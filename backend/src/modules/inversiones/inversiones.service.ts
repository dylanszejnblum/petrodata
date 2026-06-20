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

    const [now, prior, wells, wellsPrior, serieRows, opRows, exportRows] = await Promise.all([
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
    ]);

    const shareOil = pct(now.vm.oilM3, now.nat.oilM3);
    const shareGas = pct(now.vm.gasThousandM3, now.nat.gasThousandM3);
    const vmOilBblD = now.vm.oilBblD ?? 0;
    const exportEnergyUsd = exportRows.reduce((a, r) => a + (r._sum.valueAnnualUsd ?? 0), 0);

    const opNames = await this.prisma.dimOperator.findMany({
      where: { operatorSlug: { in: opRows.map((o) => o.operatorSlug) } },
      select: { operatorSlug: true, operatorName: true },
    });
    const nameOf = new Map(opNames.map((o) => [o.operatorSlug, o.operatorName]));

    const source = (s: { label: string; url: string }) => ({ ...s, asOf });

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
        null, source(EXPORT_SOURCE)),
    ];

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
        energiaUsd: exportEnergyUsd,
        porSector: exportRows.map((r) => ({ sector: r.sector, usd: r._sum.valueAnnualUsd ?? 0 })),
        source: source(EXPORT_SOURCE),
      },
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
