import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Lang, numLocale, sources, strings } from './inversiones.i18n';
import { fetchLiveBrent } from './brent-live';
import { OBRAS } from '../transporte/obras';

/**
 * /inversiones — computed, not curated. Every figure is derived from data we
 * already ingest through the pipeline (Secretaría de Energía well production,
 * province exports), with the as-of date read from the data itself. Nothing is
 * taken at face value; if a number can't be computed from a real source, it is
 * not shown. EN MARCHA = approved RIGI investment + evacuation works under
 * construction (each with its source); PROYECTADO = the CEPH 2026 scenario, cited.
 */

// Source attributions (PROD/EXPORT/BRENT/GDP/WORLD/SHALE/RIGI/MACRO/BREAKEVEN)
// now live in ./inversiones.i18n.ts via sources(lang) — labels are localized,
// org names + URLs are kept. Curated, cited references (shale assessment, the
// breakeven reference) are flagged there too.

// "Si se realiza como está proyectado" — PROYECTADO, never presented as measured.
// Drives the rank-jump narrative. Source: CEPH (cámara de las petroleras) with
// Economía y Energía, scenario report of April 2026, MODERATE case, Argentina
// total (not VM-only): crude 1.0 Mbbl/d and gas 213 MMm3/d in 2030 (from 810 kbbl/d
// and 142 MMm3/d in 2025). The old 1.5 Mbbl/d / 180 MMm3/d had no solid source:
// 1.5 was a conditional remark at a 2024 hearing, 180 one consultancy's plateau.
const OIL_TARGET_TBPD = 1000; // thousand bbl/d, same unit as the EIA world table
const GAS_TARGET_BCF = 2745; // 213 MMm3/d × 365 / 28.317 = Bcf/year, same unit as the EIA table
const TARGET_YEAR = 2030;
// Countries below this base are excluded from "fastest growing" to stop tiny
// producers with explosive % growth from drowning the real story.
const GROWTH_BASE_MIN: Record<string, number> = { oil: 100, gas: 200 };
const GROWTH_WINDOW_YEARS = 5;

// --- Política → impacto -----------------------------------------------------
// The abductive bridge: the current policy framework unlocks the investment that
// turns Vaca Muerta's potential into realised production — and that production
// converts into export earnings and GDP. Every figure is a REAL, sourced series
// (FX/inflation/fiscal from datos.gob.ar via fact_price; energy surplus from
// INDEC). No hardcoded macro values — only citations (attribution) below.
const RIGI_AS_OF = '2026-06'; // as-of of the compiled approved-projects registry
const BRENT_WINDOW = 12; // months for the trailing export-price average (real Brent)
const POLICY_CHART_SINCE = Date.UTC(2023, 0, 1); // window that shows the inflection
// Cited external reference — NOT computed from our data. The market price beside
// it is computed live; the headroom (margin) between them is the story.
const BREAKEVEN_REFERENCE_USD = 45;

interface Sums {
  oilBblD: number | null;
  oilM3: number | null;
  gasThousandM3: number | null;
  gasMm3D: number | null;
  boe: number | null;
}

@Injectable()
export class InversionesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The full page. `trimestre` ('YYYY-Qn') filters the whole payload to a chosen
   * quarter by moving the reference anchor to the latest complete month within
   * that quarter; omit it for the latest complete month (default behaviour).
   */
  async getPage(lang: Lang = 'es', trimestre?: string) {
    const bound = trimestre ? (quarterEndMonth(trimestre) ?? undefined) : undefined;
    const ref = await this.referenceMonth(bound);
    if (!ref) {
      return { asOf: null, trimestre: null, trimestresDisponibles: [], kpis: [], serie: null, operadores: [], exportaciones: null, headline: '' };
    }
    const s = strings(lang);
    const src = sources(lang);
    const numL = numLocale(lang);
    const { month, latestMonth } = ref;
    const yearAgo = new Date(Date.UTC(month.getUTCFullYear() - 1, month.getUTCMonth(), 1));
    const asOf = month.toISOString().slice(0, 7);

    const [now, prior, wells, wellsPrior, serieRows, opRows, exportRows, breakeven, actividad, tradeAnnual, gdpRows] = await Promise.all([
      this.snapshot(month),
      this.snapshot(yearAgo),
      this.activeWells(month),
      this.activeWells(yearAgo),
      this.prisma.factProductionMonthly.groupBy({
        by: ['dateMonth'],
        where: { vmCombined: true },
        _sum: { oilBblD: true, gasMm3D: true },
        orderBy: { dateMonth: 'asc' },
      }),
      this.prisma.factProductionMonthly.groupBy({
        by: ['operatorSlug'],
        where: { dateMonth: month, vmCombined: true },
        _sum: { oilBblD: true, boe: true },
        orderBy: { _sum: { boe: 'desc' } },
        take: 8,
      }),
      // crudo vs gas, últimos 12 meses de INDEC (MUSD)
      this.prisma.factPrice.findMany({
        where: { source: 'indec', series: { in: ['expo_petroleo_crudo', 'expo_gas'] } },
        orderBy: { date: 'desc' },
        take: 24,
      }),
      this.breakeven(lang),
      this.actividad(asOf, lang),
      this.prisma.factEnergyTrade.findMany({
        where: { granularity: 'annual' },
        orderBy: { period: 'asc' },
      }),
      this.prisma.factPrice.findMany({
        where: { series: 'gdp_usd' },
        select: { date: true, value: true },
      }),
    ]);

    const mundo = await this.mundo(tradeAnnual, gdpRows, breakeven?.brentUsd ?? null, lang);

    const shareOil = pct(now.vm.oilM3, now.nat.oilM3);
    const shareGas = pct(now.vm.gasThousandM3, now.nat.gasThousandM3);
    const vmOilBblD = now.vm.oilBblD ?? 0;

    // INDEC energy trade (real, computed) replaces the province-derived placeholder
    // where available; the province sum is the fallback when no INDEC rows exist.
    const SECTOR = { expo_petroleo_crudo: 'petróleo', expo_gas: 'gas' } as Record<string, string>;
    const exportBySector = new Map<string, number>();
    for (const r of exportRows) exportBySector.set(SECTOR[r.series], (exportBySector.get(SECTOR[r.series]) ?? 0) + r.value * 1e6);
    const provinceEnergyUsd = [...exportBySector.values()].reduce((a, b) => a + b, 0);
    const latestTrade = tradeAnnual.length ? tradeAnnual[tradeAnnual.length - 1] : null;
    const priorTrade = tradeAnnual.length > 1 ? tradeAnnual[tradeAnnual.length - 2] : null;
    const tradeSource = latestTrade
      ? {
          label: latestTrade.sourceLabel,
          url: latestTrade.sourceUrl ?? '',
          asOf: latestTrade.sourceAsOf ?? latestTrade.period.toISOString().slice(0, 4),
        }
      : null;
    const exportEnergyUsd = latestTrade?.energyExportsUsd ?? provinceEnergyUsd;

    // Year → nominal GDP (US$), for export-as-%-of-GDP. World Bank lags ~1-2y,
    // so the most recent trade year may have no GDP (→ null %, not fabricated).
    const gdpByYear = new Map<string, number>(
      gdpRows.map((g) => [g.date.toISOString().slice(0, 4), g.value]),
    );

    const opNames = await this.prisma.dimOperator.findMany({
      where: { operatorSlug: { in: opRows.map((o) => o.operatorSlug) } },
      select: { operatorSlug: true, operatorName: true },
    });
    const nameOf = new Map(opNames.map((o) => [o.operatorSlug, o.operatorName]));

    const source = (s: { label: string; url: string }) => ({ ...s, asOf });

    const energySource = tradeSource ?? source(src.EXPORT);
    const kpis = [
      kpi('produccion_vm', s.kpi.produccionVm, vmOilBblD, { suffix: ' bbl/d', decimals: 0 },
        delta(now.vm.oilBblD, prior.vm.oilBblD), source(src.PROD)),
      kpi('participacion_petroleo', s.kpi.participacionPetroleo, shareOil, { suffix: '%', decimals: 1 },
        null, source(src.PROD)),
      kpi('participacion_gas', s.kpi.participacionGas, shareGas, { suffix: '%', decimals: 1 },
        null, source(src.PROD)),
      // produccion_nacional removed — the page focuses on Vaca Muerta, not national totals.
      kpi('pozos_activos', s.kpi.pozosActivos, wells, { suffix: s.wellsSuffix, decimals: 0 },
        delta(wells, wellsPrior), source(src.PROD)),
      kpi('exportaciones_energia', s.kpi.exportacionesEnergia, exportEnergyUsd / 1e9, { prefix: 'US$', suffix: 'B', decimals: 1 },
        delta(latestTrade?.energyExportsUsd ?? null, priorTrade?.energyExportsUsd ?? null), energySource),
    ];

    // Energy trade surplus — real INDEC figure, only when computable.
    if (latestTrade?.energySurplusUsd != null) {
      kpis.push(
        kpi('superavit_energia', s.kpi.superavitEnergia, latestTrade.energySurplusUsd / 1e9,
          { prefix: 'US$', suffix: 'B', decimals: 1 },
          delta(latestTrade.energySurplusUsd, priorTrade?.energySurplusUsd ?? null), energySource),
      );
    }

    const headline = s.headline(
      shareOil.toFixed(0),
      Math.round(vmOilBblD).toLocaleString(numL),
      asOf,
    );

    // Distinct quarters that have data — the valid values for the ?trimestre filter.
    const trimestresDisponibles = [...new Set(serieRows.map((r) => quarterOf(r.dateMonth)))];

    return {
      asOf,
      trimestre: quarterOf(month),
      trimestresDisponibles,
      latestMonth: latestMonth.toISOString().slice(0, 7),
      tier: 'confirmado',
      note: s.note,
      headline,
      kpis,
      enMarcha: await this.enMarcha(lang),
      serie: {
        id: 'produccion_vm',
        title: s.serieTitle,
        unit: 'bbl/d',
        source: source(src.PROD),
        points: serieRows.map((r) => {
          const period = r.dateMonth.toISOString().slice(0, 7);
          return {
            period,
            oilBblD: r._sum.oilBblD ?? 0,
            gasMm3D: r._sum.gasMm3D ?? 0,
            preliminary: period > asOf, // months past the reference are not fully reported
          };
        }),
      },
      operadores: opRows.map((o) => ({
        slug: o.operatorSlug,
        name: nameOf.get(o.operatorSlug) ?? o.operatorSlug,
        oilBblD: o._sum.oilBblD ?? 0,
        boe: o._sum.boe ?? 0,
        sharePct: pct(o._sum.boe, now.vm.boe),
      })),
      exportaciones: {
        energiaUsd: exportEnergyUsd, // INDEC where available, province fallback
        source: energySource,
        porSector: [...exportBySector].map(([sector, usd]) => ({ sector, usd })), // last 12 months
        porSectorSource: source(src.EXPORT),
      },
      ...(breakeven ? { breakeven } : {}), // omitted when no Brent rows — never fabricated
      actividad,
      ...(mundo ? { mundo } : {}), // Argentina on the world stage — omitted if no world data

      // agro vs energy export crossover — real INDEC history; no projected points
      // unless a cited projection is attached.
      ...(tradeAnnual.length && tradeSource
        ? {
            cruce: {
              id: 'agro_vs_energia',
              title: s.cruceTitle,
              unit: 'US$',
              source: tradeSource,
              gdpSource: gdpRows.length ? src.GDP : null,
              points: tradeAnnual
                .filter((r) => r.agroExportsUsd != null || r.energyExportsUsd != null)
                .map((r) => {
                  const year = r.period.toISOString().slice(0, 4);
                  const gdpUsd = gdpByYear.get(year) ?? null;
                  return {
                    period: year,
                    agroUsd: r.agroExportsUsd,
                    energiaUsd: r.energyExportsUsd,
                    gdpUsd,
                    // % of GDP — null when GDP for that year isn't published yet.
                    agroPctGdp: gdpUsd && r.agroExportsUsd != null ? (r.agroExportsUsd / gdpUsd) * 100 : null,
                    energiaPctGdp: gdpUsd && r.energyExportsUsd != null ? (r.energyExportsUsd / gdpUsd) * 100 : null,
                    tier: 'confirmado' as const,
                  };
                }),
            },
          }
        : {}),
    };
  }

  /**
   * The latest month in the official data is typically partial (operators
   * report with a lag). Pick the latest *complete* month: step back if the
   * newest month's active-well count drops sharply vs. the prior month.
   */
  private async referenceMonth(bound?: Date): Promise<{ month: Date; latestMonth: Date } | null> {
    const recent = await this.prisma.factProductionMonthly.groupBy({
      by: ['dateMonth'],
      where: { vmCombined: true, boe: { gt: 0 }, ...(bound ? { dateMonth: { lte: bound } } : {}) },
      _count: { _all: true },
      orderBy: { dateMonth: 'desc' },
      take: 4,
    });
    if (recent.length === 0) return null;
    const latestMonth = recent[0].dateMonth;
    let idx = 0;
    while (
      idx + 1 < recent.length &&
      recent[idx]._count._all < 0.9 * recent[idx + 1]._count._all
    ) {
      idx++; // current month looks partial; step back
    }
    return { month: recent[idx].dateMonth, latestMonth };
  }

  private async snapshot(m: Date): Promise<{ vm: Sums; nat: Sums }> {
    const sel = { oilBblD: true, oilM3: true, gasThousandM3: true, gasMm3D: true, boe: true } as const;
    const [vm, nat] = await Promise.all([
      this.prisma.factProductionMonthly.aggregate({ where: { dateMonth: m, vmCombined: true }, _sum: sel }),
      this.prisma.factProductionMonthly.aggregate({ where: { dateMonth: m }, _sum: sel }),
    ]);
    return { vm: vm._sum as Sums, nat: nat._sum as Sums };
  }

  private activeWells(m: Date): Promise<number> {
    return this.prisma.factProductionMonthly.count({ where: { dateMonth: m, vmCombined: true, boe: { gt: 0 } } });
  }

  /* EN MARCHA: lo que ya está comprometido y tiene papel atrás —inversión
     aprobada en el RIGI (resolución en el BO) y obras de evacuación en
     construcción con su fuente—. No incluye lo anunciado sin decisión: eso es
     PROYECTADO y va aparte. */
  private async enMarcha(lang: Lang) {
    const en = lang === 'en';
    const rigi = await this.prisma.rigiProject.aggregate({
      where: { sector: 'Petróleo y gas' },
      _sum: { investmentMusd: true, jobs: true },
      _count: { _all: true },
    });
    const enObra = OBRAS.filter((o) => o.status === 'under_construction' || o.status === 'expansion_approved');
    const suma = (unit: string, type?: string) =>
      enObra.filter((o) => o.capacity_unit === unit && (!type || o.type === type)).reduce((a, o) => a + o.capacity, 0);
    return {
      tier: 'en_marcha' as const,
      rigi: {
        label: en ? 'Approved RIGI oil & gas investment' : 'Inversión aprobada en el RIGI, petróleo y gas',
        projects: rigi._count._all,
        investmentMusd: rigi._sum.investmentMusd ?? 0,
        jobs: rigi._sum.jobs ?? 0,
        source: sources(lang).RIGI,
      },
      evacuacion: {
        label: en ? 'Evacuation capacity under construction' : 'Capacidad de evacuación en obra',
        oilBblD: suma('bbl/d', 'oleoducto'),
        gasMm3d: suma('MMm3/d', 'gasoducto'),
        lngMtpa: suma('MTPA', 'gnl'),
        note: en
          ? 'Sum of projects under construction or approved; some overlap (Duplicar Norte feeds the Allen hub, Duplicar X is interruptible).'
          : 'Suma de obras en construcción o aprobadas; hay superposición (Duplicar Norte alimenta el nodo de Allen, Duplicar X es interrumpible).',
        projects: enObra.map((o) => ({
          name: o.name,
          capacity: o.capacity,
          unit: o.capacity_unit,
          expected: o.expected,
          sourceKind: o.source_kind,
          sourceUrl: o.source_url,
        })),
      },
    };
  }

  /** The approved-RIGI registry as a list: every project with amount, companies,
   *  province, approval date and its resolution/source, plus totals by sector and
   *  province. Approved projects only — the "en evaluación" pipeline isn't
   *  published per project. Loaded by `pnpm db:refresh:rigi` from the Ministry's sheet + each resolution page. */
  async rigi() {
    const projects = await this.prisma.rigiProject.findMany({ orderBy: [{ investmentMusd: 'desc' }, { name: 'asc' }] });
    const sum = (key: (p: (typeof projects)[number]) => string | null) => {
      const out: Record<string, { count: number; investment_musd: number; jobs: number }> = {};
      for (const p of projects) {
        const k = key(p) ?? 'sin dato';
        out[k] ??= { count: 0, investment_musd: 0, jobs: 0 };
        out[k].count++;
        out[k].investment_musd += p.investmentMusd ?? 0;
        out[k].jobs += p.jobs ?? 0;
      }
      return out;
    };
    const dates = projects.map((p) => p.approvalDate).filter((d): d is Date => d != null);
    return {
      as_of: dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString().slice(0, 10) : null,
      totals: {
        count: projects.length,
        investment_musd: projects.reduce((a, p) => a + (p.investmentMusd ?? 0), 0),
        jobs: projects.reduce((a, p) => a + (p.jobs ?? 0), 0),
        by_sector: sum((p) => p.sector),
        by_province: sum((p) => p.province),
      },
      projects: projects.map((p) => ({
        name: p.name,
        sector: p.sector,
        companies: p.operator,
        province: p.province,
        investment_musd: p.investmentMusd,
        approval_date: p.approvalDate ? p.approvalDate.toISOString().slice(0, 10) : null,
        resolution: p.resolution,
        jobs: p.jobs,
        description: p.description,
        status: 'aprobado',
        source_label: p.sourceLabel,
        source_url: p.sourceUrl,
      })),
    };
  }

  /**
   * Breakeven headroom: the live Brent price against a *cited* breakeven
   * reference (a constant, not computed). The margin between them is the
   * headroom. The headline price is the real-time front-month Brent future
   * (Yahoo BZ=F); if that fetch fails we fall back to the latest *measured* EIA
   * row from FactPrice — never fabricated. Omitted entirely if we hold no Brent
   * rows and the live fetch is unavailable.
   */
  private async breakeven(lang: Lang) {
    const src = sources(lang);
    const row = await this.prisma.factPrice.findFirst({
      where: { series: 'brent' },
      orderBy: { date: 'desc' },
      select: { value: true, date: true },
    });

    // Real-time spot (cached). On failure we degrade to the last measured row.
    const live = await fetchLiveBrent();
    if (!row && !live) return null;

    const brentUsd = live ? live.value : row!.value;
    const brentAsOf = live ? live.asOf : row!.date.toISOString().slice(0, 10);
    const source = live ? { ...src.BRENT_LIVE, asOf: live.asOf } : { ...src.BRENT, asOf: brentAsOf };

    // Trailing window of measured Brent for the trend sparkline. Anchored to the
    // latest row (not "now") so a stale dataset still renders a full window.
    let series: { date: string; value: number }[] = [];
    if (row) {
      const since = new Date(row.date);
      since.setUTCFullYear(since.getUTCFullYear() - 2);
      const history = await this.prisma.factPrice.findMany({
        where: { series: 'brent', date: { gte: since } },
        orderBy: { date: 'asc' },
        select: { value: true, date: true },
      });
      series = history.map((h) => ({ date: h.date.toISOString().slice(0, 10), value: h.value }));
    }

    // Cap the trend with the live spot so the sparkline tip is the real-time
    // price. Replace the last point if it shares the live quote's date.
    if (live) {
      if (series.length && series[series.length - 1].date === live.date) series.pop();
      series.push({ date: live.date, value: live.value });
    }

    return {
      brentUsd,
      brentAsOf,
      referenceUsd: BREAKEVEN_REFERENCE_USD,
      headroomUsd: brentUsd - BREAKEVEN_REFERENCE_USD,
      tier: 'confirmado',
      series,
      source,
      referenceSource: src.BREAKEVEN_REFERENCE,
    };
  }

  /**
   * Activity momentum: new VM wells connected per month. A well's connection
   * month is its earliest month with boe > 0 (VM-flagged). One grouped pass —
   * no per-well N+1.
   *
   * The first month of the dataset window is excluded: every well already
   * producing at/before the window start collapses into it, so it isn't a
   * genuine "new wells" count (it would dwarf every real month).
   */
  private async actividad(asOf: string, lang: Lang) {
    const src = sources(lang);
    const s = strings(lang);
    const rows = await this.prisma.$queryRaw<{ period: string; nuevos: number }[]>`
      SELECT to_char(conn_month, 'YYYY-MM') AS period, COUNT(*)::int AS nuevos
      FROM (
        SELECT well_id, MIN(date_month) AS conn_month
        FROM fact_production_monthly
        WHERE vm_combined = true AND boe > 0
        GROUP BY well_id
      ) c
      WHERE conn_month > (
        SELECT MIN(date_month) FROM fact_production_monthly WHERE vm_combined = true AND boe > 0
      )
      GROUP BY conn_month
      ORDER BY conn_month ASC`;

    return {
      unit: s.actividadUnit,
      source: { ...src.PROD, asOf },
      points: rows.map((r) => ({
        period: r.period,
        nuevosPozos: Number(r.nuevos),
        preliminary: r.period > asOf, // trailing month not fully reported yet
      })),
    };
  }

  /**
   * "Argentina en el mundo" — the catapult block. Ranks Argentina among world
   * producers (EIA International) on oil & gas, today and at the projected 2030
   * target, plus the climb it has already made and the fastest-growing peers.
   *
   * Everything here is computed from FactWorldProduction except the curated
   * PROYECTADO targets and the cited shale-resource ranking (both flagged).
   * Returns null if the world table hasn't been seeded yet — never fabricated.
   */
  private async mundo(
    tradeAnnual: {
      period: Date;
      energyExportsUsd: number | null;
      energySurplusUsd: number | null;
      sourceLabel?: string;
      sourceUrl?: string | null;
    }[],
    gdpRows: { date: Date; value: number }[],
    brentUsd: number | null,
    lang: Lang,
  ) {
    const s = strings(lang);
    const src = sources(lang);
    const numL = numLocale(lang);
    const rows = await this.prisma.factWorldProduction.findMany({
      select: { product: true, iso3: true, country: true, period: true, value: true, unit: true },
    });
    if (!rows.length) return null;

    const productMeta: Record<string, { label: string; target: number }> = {
      oil: { label: s.product.oil, target: OIL_TARGET_TBPD },
      gas: { label: s.product.gas, target: GAS_TARGET_BCF },
    };

    const rankings = Object.keys(productMeta)
      .map((product) => {
        const meta = productMeta[product];
        const pool = rows.filter((r) => r.product === product);
        if (!pool.length) return null;

        const years = [...new Set(pool.map((r) => r.period.getUTCFullYear()))].sort((a, b) => a - b);
        const latestYear = years[years.length - 1];
        const unit = pool[0].unit;

        // Latest-year leaderboard, sorted numerically (EIA sorts lexically — useless).
        const latest = pool
          .filter((r) => r.period.getUTCFullYear() === latestYear)
          .sort((a, b) => b.value - a.value);
        const argIdx = latest.findIndex((r) => r.iso3 === 'ARG');
        const argRow = argIdx >= 0 ? latest[argIdx] : null;

        // Projected rank: Argentina at the target vs every OTHER country's current
        // value (Argentina is the one moving, so exclude its own current value).
        const others = latest.filter((r) => r.iso3 !== 'ARG');
        const projectedRank = 1 + others.filter((r) => r.value > meta.target).length;

        // Top 12, always including Argentina even if it sits below the cut.
        const top = latest.slice(0, 12).map((r, i) => ({
          rank: i + 1,
          iso3: r.iso3,
          country: r.country,
          value: r.value,
          isArgentina: r.iso3 === 'ARG',
        }));
        if (argRow && argIdx >= 12) {
          top.push({ rank: argIdx + 1, iso3: 'ARG', country: argRow.country, value: argRow.value, isArgentina: true });
        }

        // The climb: Argentina's rank per year (where it has data).
        const history = years
          .map((year) => {
            const yearPool = pool
              .filter((r) => r.period.getUTCFullYear() === year)
              .sort((a, b) => b.value - a.value);
            const i = yearPool.findIndex((r) => r.iso3 === 'ARG');
            if (i < 0) return null;
            return { year, rank: i + 1, value: yearPool[i].value, countries: yearPool.length };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        return {
          product,
          label: meta.label,
          unit,
          year: latestYear,
          countries: latest.length,
          source: { ...src.WORLD, asOf: String(latestYear) },
          argentina: argRow ? { rank: argIdx + 1, value: argRow.value } : null,
          projected: {
            value: meta.target,
            rank: projectedRank,
            year: TARGET_YEAR,
            tier: 'proyectado' as const,
            source: src.PROYECCION,
          },
          top,
          history,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Fastest-growing producers over the trailing window — where Argentina shines.
    const fastestGrowing = Object.keys(productMeta)
      .map((product) => {
        const pool = rows.filter((r) => r.product === product);
        if (!pool.length) return null;
        const years = [...new Set(pool.map((r) => r.period.getUTCFullYear()))].sort((a, b) => a - b);
        const toYear = years[years.length - 1];
        const sinceYear = toYear - GROWTH_WINDOW_YEARS;
        const baseMin = GROWTH_BASE_MIN[product] ?? 0;

        const byCountry = new Map<string, { country: string; from?: number; to?: number }>();
        for (const r of pool) {
          const y = r.period.getUTCFullYear();
          if (y !== toYear && y !== sinceYear) continue;
          const e = byCountry.get(r.iso3) ?? { country: r.country };
          if (y === sinceYear) e.from = r.value;
          if (y === toYear) e.to = r.value;
          byCountry.set(r.iso3, e);
        }

        const leaders = [...byCountry.entries()]
          .filter(([, e]) => e.from != null && e.to != null && e.from >= baseMin)
          .map(([iso3, e]) => ({
            iso3,
            country: e.country,
            from: e.from as number,
            to: e.to as number,
            growthPct: (((e.to as number) - (e.from as number)) / (e.from as number)) * 100,
            isArgentina: iso3 === 'ARG',
          }))
          .sort((a, b) => b.growthPct - a.growthPct);

        const top = leaders.slice(0, 8);
        const arg = leaders.find((l) => l.isArgentina);
        if (arg && !top.some((l) => l.isArgentina)) top.push(arg); // always show Argentina

        return {
          product,
          label: productMeta[product].label,
          unit: pool[0].unit,
          sinceYear,
          toYear,
          leaders: top,
          argentinaRank: arg ? leaders.findIndex((l) => l.isArgentina) + 1 : null,
          source: { ...src.WORLD, asOf: String(toYear) },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // --- Política → impacto: sourced policy charts + indicators + GDP payoff -
    const oilRank = rankings.find((r) => r.product === 'oil');
    // EIA reports crude in TBPD (thousand bbl/d); convert to bbl/d for USD math.
    const todayBblD = oilRank?.argentina ? oilRank.argentina.value * 1000 : null;
    const targetBblD = oilRank ? oilRank.projected.value * 1000 : null;
    const incrementalBblD = todayBblD != null && targetBblD != null ? targetBblD - todayBblD : null;

    // Real, sourced macro series (FX, inflation, fiscal) + Brent for the export
    // price — all from fact_price. No hardcoded macro values.
    const macroRows = await this.prisma.factPrice.findMany({
      where: {
        OR: [
          { source: 'bcra', series: 'fx_a3500' },
          { source: 'indec', series: 'ipc_mensual' },
          { source: 'mecon', series: 'fiscal_primario' },
          { source: 'eia', series: 'brent' },
        ],
      },
      select: { series: true, date: true, value: true, unit: true },
      orderBy: { date: 'asc' },
    });
    // Approved RIGI oil & gas projects (sourced registry) for the RIGI chart.
    const rigiRows = await this.prisma.rigiProject.findMany({
      where: { sector: 'Petróleo y gas' }, // the Ministry's own sector label
      orderBy: { investmentMusd: 'desc' },
    });

    const bySeries = (s: string) => macroRows.filter((r) => r.series === s);
    const since = new Date(POLICY_CHART_SINCE);
    const chartPts = (s: string) =>
      bySeries(s)
        .filter((r) => r.date >= since)
        .map((r) => ({ period: r.date.toISOString().slice(0, 7), value: r.value }));
    const macroSrc = (key: string, rows: { date: Date }[]) => ({
      ...(src.MACRO[key] ?? src.WORLD),
      asOf: rows.length ? rows[rows.length - 1].date.toISOString().slice(0, 7) : '',
    });

    // Export price = trailing-12-mo average of REAL Brent (not a magic constant).
    const brentRows = bySeries('brent');
    const brentWindow = brentRows.slice(-BRENT_WINDOW);
    const exportPriceUsd = brentWindow.length
      ? brentWindow.reduce((a, r) => a + r.value, 0) / brentWindow.length
      : brentUsd;
    const incrementalExportUsd =
      incrementalBblD != null && exportPriceUsd != null ? incrementalBblD * 365 * exportPriceUsd : null;

    const latestGdpRow = gdpRows.length ? gdpRows.reduce((a, b) => (a.date > b.date ? a : b)) : null;
    const gdpUsd = latestGdpRow?.value ?? null;
    const gdpYear = latestGdpRow ? latestGdpRow.date.getUTCFullYear() : null;
    const pctGdp = incrementalExportUsd != null && gdpUsd ? (incrementalExportUsd / gdpUsd) * 100 : null;

    const latestTrade = tradeAnnual.length ? tradeAnnual[tradeAnnual.length - 1] : null;
    const priorTrade = tradeAnnual.length > 1 ? tradeAnnual[tradeAnnual.length - 2] : null;
    const tradeYear = latestTrade ? latestTrade.period.getUTCFullYear() : null;
    const tradeSource = latestTrade
      ? { label: latestTrade.sourceLabel ?? 'INDEC', url: latestTrade.sourceUrl ?? '', asOf: String(tradeYear) }
      : { ...src.WORLD, asOf: '' };

    // Computed-from-real indicators.
    const ipcRows = bySeries('ipc_mensual');
    const ipcLatest = ipcRows.length ? ipcRows[ipcRows.length - 1] : null;
    const fiscalRows = bySeries('fiscal_primario');
    const fiscalLast12 = fiscalRows.slice(-12);
    const fiscalSurplusMonths = fiscalLast12.filter((r) => r.value > 0).length;

    const levers = [
      {
        tag: s.lever.fxTag,
        title: s.lever.fxTitle,
        chartId: 'fx',
        indicator: ipcLatest
          ? {
              label: s.indicator.inflacionMensual,
              value: ipcLatest.value,
              format: { suffix: s.pctMesSuffix, decimals: 1 },
              tier: 'confirmado',
              source: macroSrc('ipc_mensual', ipcRows),
            }
          : null,
      },
      {
        tag: s.lever.exportTag,
        title: s.lever.exportTitle,
        chartId: 'superavit_energia',
        indicator:
          latestTrade?.energySurplusUsd != null
            ? {
                label: s.indicator.superavitEnergetico,
                value: latestTrade.energySurplusUsd / 1e9,
                format: { prefix: 'US$', suffix: ' B', decimals: 1 },
                delta: delta(latestTrade.energySurplusUsd, priorTrade?.energySurplusUsd ?? null) ?? undefined,
                tier: 'confirmado',
                source: tradeSource,
              }
            : null,
      },
      {
        tag: s.lever.rigiTag,
        title: s.lever.rigiTitle,
        milestone: s.lever.rigiMilestone,
        source: { ...src.RIGI, asOf: RIGI_AS_OF },
        // Real committed investment from the approved oil & gas RIGI projects.
        indicator: rigiRows.length
          ? {
              label: s.indicator.inversionComprometida,
              value: rigiRows.reduce((a, r) => a + (r.investmentMusd ?? 0), 0) / 1000,
              format: { prefix: 'US$', suffix: ' B', decimals: 1 },
              tier: 'referencia',
              source: { ...src.RIGI, asOf: RIGI_AS_OF },
            }
          : null,
      },
      {
        tag: s.lever.fiscalTag,
        title: s.lever.fiscalTitle,
        chartId: 'fiscal',
        indicator: fiscalLast12.length
          ? {
              label: s.indicator.mesesSuperavit,
              value: fiscalSurplusMonths,
              format: { suffix: `/${fiscalLast12.length}`, decimals: 0 },
              tier: 'confirmado',
              source: macroSrc('fiscal_primario', fiscalRows),
            }
          : null,
      },
    ];

    // The sourced graphs the section is built around.
    const charts = [
      {
        id: 'inflacion',
        title: s.chart.inflacionTitle,
        unit: s.pctMesUnit,
        kind: 'area' as const,
        source: macroSrc('ipc_mensual', ipcRows),
        points: chartPts('ipc_mensual'),
      },
      {
        id: 'fx',
        title: s.chart.fxTitle,
        unit: 'ARS/USD',
        kind: 'line' as const,
        source: macroSrc('fx_a3500', bySeries('fx_a3500')),
        points: chartPts('fx_a3500'),
      },
      {
        id: 'fiscal',
        title: s.chart.fiscalTitle,
        unit: s.arsMillonesUnit,
        kind: 'bar' as const,
        source: macroSrc('fiscal_primario', fiscalRows),
        points: chartPts('fiscal_primario'),
      },
      {
        id: 'superavit_energia',
        title: s.chart.superavitTitle,
        unit: 'US$ MM',
        kind: 'bar' as const,
        source: tradeSource,
        points: tradeAnnual
          .filter((r) => r.energySurplusUsd != null)
          .slice(-8)
          .map((r) => ({ period: String(r.period.getUTCFullYear()), value: (r.energySurplusUsd as number) / 1e6 })),
      },
    ].filter((c) => c.points.length > 0);

    const impacto =
      incrementalExportUsd != null
        ? {
            headline:
              pctGdp != null
                ? s.impacto.headline(pctGdp.toLocaleString(numL, { maximumFractionDigits: 1 }))
                : s.impacto.headlineFallback,
            items: [
              {
                label: s.impacto.valorExportable,
                value: incrementalExportUsd / 1e9,
                format: { prefix: 'US$', suffix: s.impacto.bAnioSuffix, decimals: 1 },
                tier: 'proyectado' as const,
              },
              ...(pctGdp != null
                ? [
                    {
                      label: s.impacto.equivalentePbi,
                      value: pctGdp,
                      format: { suffix: s.impacto.pctPbiSuffix, decimals: 1 },
                      tier: 'proyectado' as const,
                    },
                  ]
                : []),
            ],
            // Stated assumptions — the projection is illustrative, not a forecast.
            // Price is the trailing-12-mo average of real Brent (sourced).
            assumptions: {
              priceUsd: exportPriceUsd != null ? Math.round(exportPriceUsd * 10) / 10 : null,
              priceBasis: s.impacto.priceBasis(brentWindow.length),
              todayBblD,
              targetBblD,
              targetSource: src.PROYECCION,
              gdpUsd,
              gdpYear,
            },
            source: { ...src.WORLD, asOf: oilRank ? String(oilRank.year) : '' },
          }
        : null;

    // RIGI oil & gas projects block (sourced registry) — committed investment.
    const rigi = rigiRows.length
      ? {
          title: s.rigiTitle,
          subtitle: s.rigiSubtitle,
          count: rigiRows.length,
          totalMusd: rigiRows.reduce((a, r) => a + (r.investmentMusd ?? 0), 0),
          projects: rigiRows.map((r) => ({
            name: r.name,
            sector: r.sector,
            operator: r.operator,
            province: r.province,
            investmentMusd: r.investmentMusd,
            approvalDate: r.approvalDate ? r.approvalDate.toISOString().slice(0, 10) : null,
            sourceUrl: r.sourceUrl,
          })),
          source: { ...src.RIGI, asOf: RIGI_AS_OF },
        }
      : null;

    const politica = {
      intro: {
        title: s.politicaIntroTitle,
        text: s.politicaIntroText,
      },
      levers,
      charts,
      ...(rigi ? { rigi } : {}),
      ...(impacto ? { impacto } : {}),
    };

    return {
      source: src.WORLD,
      rankings,
      fastestGrowing,
      // Cited, not computed — the headline resource claim.
      shale: {
        oilRank: 4,
        gasRank: 2,
        note: s.shaleNote,
        tier: 'referencia' as const,
        source: src.SHALE,
      },
      politica,
    };
  }
}

/** 'YYYY-Qn' for a month's calendar quarter. */
function quarterOf(d: Date): string {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

/** Last month of a 'YYYY-Qn' quarter (the anchor upper-bound), or null if malformed. */
function quarterEndMonth(trimestre: string): Date | null {
  const m = /^(\d{4})-Q([1-4])$/.exec(trimestre);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) * 3 - 1, 1));
}

function pct(part: number | null, whole: number | null): number {
  if (!whole || !part) return 0;
  return (part / whole) * 100;
}

function delta(now: number | null, prior: number | null) {
  if (!now || !prior) return null;
  return { pct: ((now - prior) / prior) * 100, base: 'YoY' as const };
}

function kpi(
  id: string,
  label: string,
  value: number,
  format: { prefix?: string; suffix?: string; decimals: number },
  d: { pct: number; base: 'YoY' } | null,
  source: { label: string; url: string; asOf: string },
) {
  return {
    id,
    label,
    tier: 'confirmado',
    figure: { kind: 'point', value },
    delta: d ?? undefined,
    format,
    source,
  };
}
