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

    const [now, prior, wells, wellsPrior, serieRows, opRows, exportRows, breakeven, actividad, tradeAnnual] = await Promise.all([
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
    ]);

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
      // agro vs energy export crossover — real INDEC history; no projected points
      // unless a cited projection is attached.
      ...(tradeAnnual.length && tradeSource
        ? {
            cruce: {
              id: 'agro_vs_energia',
              title: 'Exportaciones: agro vs energía',
              unit: 'US$',
              source: tradeSource,
              points: tradeAnnual
                .filter((r) => r.agroExportsUsd != null || r.energyExportsUsd != null)
                .map((r) => ({
                  period: r.period.toISOString().slice(0, 4),
                  agroUsd: r.agroExportsUsd,
                  energiaUsd: r.energyExportsUsd,
                  tier: 'confirmado' as const,
                })),
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
    return {
      brentUsd: row.value,
      brentAsOf,
      referenceUsd: BREAKEVEN_REFERENCE_USD,
      headroomUsd: row.value - BREAKEVEN_REFERENCE_USD,
      tier: 'confirmado',
      source: { ...BRENT_SOURCE, asOf: brentAsOf },
      referenceSource: BREAKEVEN_REFERENCE_SOURCE,
    };
  }

  /**
   * Activity momentum: new VM wells connected per month. A well's connection
   * month is its earliest month with boe > 0 (VM-flagged). One grouped pass —
   * no per-well N+1.
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
