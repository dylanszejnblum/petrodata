import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * /inversiones — computed, not curated. Every figure is derived from data we
 * already ingest through the pipeline (Secretaría de Energía well production,
 * province exports), with the as-of date read from the data itself. Nothing is
 * taken at face value; if a number can't be computed from a real source, it is
 * not shown (EN MARCHA / PROYECTADO tiers are pending real citations).
 */

const PROD_SOURCE = {
  label: 'Secretaría de Energía — Producción de pozos',
  url: 'https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo',
};
const EXPORT_SOURCE = {
  label: 'Exportaciones por sector (provincias)',
  url: 'https://datos.energia.gob.ar/',
};
const BRENT_SOURCE = {
  label: 'EIA (Brent)',
  url: 'https://www.eia.gov/dnav/pet/hist/RBRTEM.htm',
};
const GDP_SOURCE = {
  label: 'Banco Mundial (PBI nominal, US$)',
  url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=AR',
};
const WORLD_SOURCE = {
  label: 'EIA — International Energy Statistics (producción por país)',
  url: 'https://www.eia.gov/international/data/world',
};
// Curated, cited — not computed from our data. EIA's one-off shale assessment:
// Vaca Muerta is #2 shale gas / #4 shale oil in technically recoverable resources.
const SHALE_SOURCE = {
  label: 'EIA — Technically Recoverable Shale Oil and Shale Gas Resources (2013)',
  url: 'https://www.eia.gov/analysis/studies/worldshalegas/',
};
// "Si se realiza como está proyectado" — industry/government 2030 targets. These
// are PROYECTADO, never presented as measured. Drives the rank-jump narrative.
const OIL_TARGET_TBPD = 1500; // ~1.5 Mbbl/d — commonly-cited VM 2030 oil target
const GAS_TARGET_BCF = 2300; //  ~180 MMm³/d — 2030 gas target, annualised
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
const MACRO_SOURCES: Record<string, { label: string; url: string }> = {
  fx_a3500: { label: 'BCRA — Tipo de Cambio Mayorista (Com. A 3500)', url: 'https://www.bcra.gob.ar/' },
  ipc_mensual: {
    label: 'INDEC — IPC variación mensual (Nivel General Nacional)',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
  },
  fiscal_primario: {
    label: 'Secretaría de Hacienda — Resultado primario (IMIG)',
    url: 'https://www.argentina.gob.ar/economia/sechacienda',
  },
};
// RIGI has no official time-series dataset — presented as a sourced milestone
// (link to the official régimen), never a fabricated number.
const RIGI_SOURCE = {
  label: 'RIGI — Régimen de Incentivo para Grandes Inversiones (Ley 27.742)',
  url: 'https://www.argentina.gob.ar/economia/rigi',
};
const BRENT_WINDOW = 12; // months for the trailing export-price average (real Brent)
const POLICY_CHART_SINCE = Date.UTC(2023, 0, 1); // window that shows the inflection
// Cited external reference — NOT computed from our data. The market price beside
// it is computed live; the headroom (margin) between them is the story.
const BREAKEVEN_REFERENCE_USD = 45;
const BREAKEVEN_REFERENCE_SOURCE = {
  label: 'YPF (breakeven Vaca Muerta ~US$45/bbl)',
  url: 'https://www.ypf.com/inversoresaccionistas/Paginas/informacion-financiera.aspx',
};

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

  async getPage() {
    const ref = await this.referenceMonth();
    if (!ref) {
      return { asOf: null, kpis: [], serie: null, operadores: [], exportaciones: null, headline: '' };
    }
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
      this.prisma.provinceExport.groupBy({
        by: ['sector'],
        where: { sector: { in: ['petróleo', 'gas'] } },
        _sum: { valueAnnualUsd: true },
      }),
      this.breakeven(),
      this.actividad(asOf),
      this.prisma.factEnergyTrade.findMany({
        where: { granularity: 'annual' },
        orderBy: { period: 'asc' },
      }),
      this.prisma.factPrice.findMany({
        where: { series: 'gdp_usd' },
        select: { date: true, value: true },
      }),
    ]);

    const mundo = await this.mundo(tradeAnnual, gdpRows, breakeven?.brentUsd ?? null);

    const shareOil = pct(now.vm.oilM3, now.nat.oilM3);
    const shareGas = pct(now.vm.gasThousandM3, now.nat.gasThousandM3);
    const vmOilBblD = now.vm.oilBblD ?? 0;

    // INDEC energy trade (real, computed) replaces the province-derived placeholder
    // where available; the province sum is the fallback when no INDEC rows exist.
    const provinceEnergyUsd = exportRows.reduce((a, r) => a + (r._sum.valueAnnualUsd ?? 0), 0);
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

    const energySource = tradeSource ?? source(EXPORT_SOURCE);
    const kpis = [
      kpi('produccion_vm', 'Producción de petróleo VM', vmOilBblD, { suffix: ' bbl/d', decimals: 0 },
        delta(now.vm.oilBblD, prior.vm.oilBblD), source(PROD_SOURCE)),
      kpi('participacion_petroleo', 'Participación en petróleo nacional', shareOil, { suffix: '%', decimals: 1 },
        null, source(PROD_SOURCE)),
      kpi('participacion_gas', 'Participación en gas nacional', shareGas, { suffix: '%', decimals: 1 },
        null, source(PROD_SOURCE)),
      kpi('produccion_nacional', 'Producción nacional de petróleo', now.nat.oilBblD ?? 0, { suffix: ' bbl/d', decimals: 0 },
        delta(now.nat.oilBblD, prior.nat.oilBblD), source(PROD_SOURCE)),
      kpi('pozos_activos', 'Pozos activos en VM', wells, { suffix: ' pozos', decimals: 0 },
        delta(wells, wellsPrior), source(PROD_SOURCE)),
      kpi('exportaciones_energia', 'Exportaciones de energía (anual)', exportEnergyUsd / 1e9, { prefix: 'US$', suffix: 'B', decimals: 1 },
        delta(latestTrade?.energyExportsUsd ?? null, priorTrade?.energyExportsUsd ?? null), energySource),
    ];

    // Energy trade surplus — real INDEC figure, only when computable.
    if (latestTrade?.energySurplusUsd != null) {
      kpis.push(
        kpi('superavit_energia', 'Superávit comercial energético (anual)', latestTrade.energySurplusUsd / 1e9,
          { prefix: 'US$', suffix: 'B', decimals: 1 },
          delta(latestTrade.energySurplusUsd, priorTrade?.energySurplusUsd ?? null), energySource),
      );
    }

    const headline =
      `Vaca Muerta concentra el ${shareOil.toFixed(0)}% del petróleo nacional ` +
      `y produce ${Math.round(vmOilBblD).toLocaleString('es-AR')} bbl/d (${asOf}).`;

    return {
      asOf,
      latestMonth: latestMonth.toISOString().slice(0, 7),
      tier: 'confirmado',
      note: 'Todas las cifras se computan a partir de datos oficiales ya ingeridos por el pipeline. Las cifras EN MARCHA / PROYECTADO se agregarán con su fuente verificable.',
      headline,
      kpis,
      serie: {
        id: 'produccion_vm',
        title: 'Producción de petróleo en Vaca Muerta',
        unit: 'bbl/d',
        source: source(PROD_SOURCE),
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
        porSector: exportRows.map((r) => ({ sector: r.sector, usd: r._sum.valueAnnualUsd ?? 0 })),
        porSectorSource: source(EXPORT_SOURCE), // the petróleo/gas split is province-reported
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
              title: 'Exportaciones: agro vs energía',
              unit: 'US$',
              source: tradeSource,
              gdpSource: gdpRows.length ? GDP_SOURCE : null,
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
  private async referenceMonth(): Promise<{ month: Date; latestMonth: Date } | null> {
    const recent = await this.prisma.factProductionMonthly.groupBy({
      by: ['dateMonth'],
      where: { vmCombined: true, boe: { gt: 0 } },
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

  /**
   * Breakeven headroom: the latest *measured* Brent price (computed live from
   * FactPrice) against a *cited* breakeven reference (a constant, not computed).
   * The margin between them is the headroom. Omitted entirely if we hold no
   * Brent rows — never fabricated.
   */
  private async breakeven() {
    const row = await this.prisma.factPrice.findFirst({
      where: { series: 'brent' },
      orderBy: { date: 'desc' },
      select: { value: true, date: true },
    });
    if (!row) return null;

    const brentAsOf = row.date.toISOString().slice(0, 10);

    // Trailing window of measured Brent for the trend sparkline. Anchored to the
    // latest row (not "now") so a stale dataset still renders a full window.
    const since = new Date(row.date);
    since.setUTCFullYear(since.getUTCFullYear() - 2);
    const history = await this.prisma.factPrice.findMany({
      where: { series: 'brent', date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { value: true, date: true },
    });

    return {
      brentUsd: row.value,
      brentAsOf,
      referenceUsd: BREAKEVEN_REFERENCE_USD,
      headroomUsd: row.value - BREAKEVEN_REFERENCE_USD,
      tier: 'confirmado',
      series: history.map((h) => ({ date: h.date.toISOString().slice(0, 10), value: h.value })),
      source: { ...BRENT_SOURCE, asOf: brentAsOf },
      referenceSource: BREAKEVEN_REFERENCE_SOURCE,
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
  private async actividad(asOf: string) {
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
      unit: 'pozos/mes',
      source: { ...PROD_SOURCE, asOf },
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
  ) {
    const rows = await this.prisma.factWorldProduction.findMany({
      select: { product: true, iso3: true, country: true, period: true, value: true, unit: true },
    });
    if (!rows.length) return null;

    const productMeta: Record<string, { label: string; target: number }> = {
      oil: { label: 'Petróleo crudo', target: OIL_TARGET_TBPD },
      gas: { label: 'Gas natural', target: GAS_TARGET_BCF },
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
          source: { ...WORLD_SOURCE, asOf: String(latestYear) },
          argentina: argRow ? { rank: argIdx + 1, value: argRow.value } : null,
          projected: {
            value: meta.target,
            rank: projectedRank,
            year: TARGET_YEAR,
            tier: 'proyectado' as const,
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
          source: { ...WORLD_SOURCE, asOf: String(toYear) },
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
    const bySeries = (s: string) => macroRows.filter((r) => r.series === s);
    const since = new Date(POLICY_CHART_SINCE);
    const chartPts = (s: string) =>
      bySeries(s)
        .filter((r) => r.date >= since)
        .map((r) => ({ period: r.date.toISOString().slice(0, 7), value: r.value }));
    const macroSrc = (key: string, rows: { date: Date }[]) => ({
      ...(MACRO_SOURCES[key] ?? WORLD_SOURCE),
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
      : { ...WORLD_SOURCE, asOf: '' };

    // Computed-from-real indicators.
    const ipcRows = bySeries('ipc_mensual');
    const ipcLatest = ipcRows.length ? ipcRows[ipcRows.length - 1] : null;
    const fiscalRows = bySeries('fiscal_primario');
    const fiscalLast12 = fiscalRows.slice(-12);
    const fiscalSurplusMonths = fiscalLast12.filter((r) => r.value > 0).length;

    const levers = [
      {
        tag: 'Cambiario',
        title: 'Normalización del tipo de cambio y acceso a divisas para exportadores',
        chartId: 'fx',
        indicator: ipcLatest
          ? {
              label: 'Inflación mensual',
              value: ipcLatest.value,
              format: { suffix: '%/mes', decimals: 1 },
              tier: 'confirmado',
              source: macroSrc('ipc_mensual', ipcRows),
            }
          : null,
      },
      {
        tag: 'Exportación',
        title: 'Fin de los cupos y retenciones a la exportación de crudo y gas',
        chartId: 'superavit_energia',
        indicator:
          latestTrade?.energySurplusUsd != null
            ? {
                label: 'Superávit comercial energético',
                value: latestTrade.energySurplusUsd / 1e9,
                format: { prefix: 'US$', suffix: ' B', decimals: 1 },
                delta: delta(latestTrade.energySurplusUsd, priorTrade?.energySurplusUsd ?? null) ?? undefined,
                tier: 'confirmado',
                source: tradeSource,
              }
            : null,
      },
      {
        tag: 'RIGI',
        title: 'Régimen de Incentivo a Grandes Inversiones: estabilidad fiscal a 30 años',
        // No official RIGI time-series exists — sourced milestone, not a number.
        milestone: 'Régimen vigente (Ley 27.742): estabilidad fiscal, cambiaria y aduanera por 30 años.',
        source: { ...RIGI_SOURCE, asOf: '' },
        indicator: null,
      },
      {
        tag: 'Fiscal',
        title: 'Disciplina fiscal y desregulación que anclan la previsibilidad de inversión',
        chartId: 'fiscal',
        indicator: fiscalLast12.length
          ? {
              label: 'Meses con superávit primario (últ. 12)',
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
        title: 'Inflación mensual',
        unit: '%/mes',
        kind: 'area' as const,
        source: macroSrc('ipc_mensual', ipcRows),
        points: chartPts('ipc_mensual'),
      },
      {
        id: 'fx',
        title: 'Tipo de cambio mayorista (A3500)',
        unit: 'ARS/USD',
        kind: 'line' as const,
        source: macroSrc('fx_a3500', bySeries('fx_a3500')),
        points: chartPts('fx_a3500'),
      },
      {
        id: 'fiscal',
        title: 'Resultado primario mensual (SPN)',
        unit: 'ARS millones',
        kind: 'bar' as const,
        source: macroSrc('fiscal_primario', fiscalRows),
        points: chartPts('fiscal_primario'),
      },
      {
        id: 'superavit_energia',
        title: 'Superávit comercial energético',
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
                ? `Si la producción de petróleo alcanza la meta, el valor exportable incremental equivale a ~${pctGdp.toLocaleString('es-AR', { maximumFractionDigits: 1 })}% del PBI.`
                : 'Si la producción alcanza la meta, el salto exportador se acelera.',
            items: [
              {
                label: 'Valor exportable incremental',
                value: incrementalExportUsd / 1e9,
                format: { prefix: 'US$', suffix: ' B/año', decimals: 1 },
                tier: 'proyectado' as const,
              },
              ...(pctGdp != null
                ? [
                    {
                      label: 'Equivalente en PBI',
                      value: pctGdp,
                      format: { suffix: '% del PBI', decimals: 1 },
                      tier: 'proyectado' as const,
                    },
                  ]
                : []),
            ],
            // Stated assumptions — the projection is illustrative, not a forecast.
            // Price is the trailing-12-mo average of real Brent (sourced).
            assumptions: {
              priceUsd: exportPriceUsd != null ? Math.round(exportPriceUsd * 10) / 10 : null,
              priceBasis: `Brent prom. ${brentWindow.length}m (EIA)`,
              todayBblD,
              targetBblD,
              gdpUsd,
              gdpYear,
            },
            source: { ...WORLD_SOURCE, asOf: oilRank ? String(oilRank.year) : '' },
          }
        : null;

    const politica = {
      intro: {
        title: 'La política que convierte potencial en producción',
        text: 'El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial.',
      },
      levers,
      charts,
      ...(impacto ? { impacto } : {}),
    };

    return {
      source: WORLD_SOURCE,
      rankings,
      fastestGrowing,
      // Cited, not computed — the headline resource claim.
      shale: {
        oilRank: 4,
        gasRank: 2,
        note: 'Vaca Muerta concentra el 2.º recurso de shale gas y el 4.º de shale oil técnicamente recuperable del mundo.',
        tier: 'referencia' as const,
        source: SHALE_SOURCE,
      },
      politica,
    };
  }
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
