import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isPreliminary, latestCompleteMonth } from '../../common/complete-month';

const MMM3_PER_BCF = 28.317; // 1 Bcf = 28,317 millones de m3
import { FxQueryDto } from './macro.dto';

const FX_SERIES = ['fx_oficial_sell', 'fx_oficial_buy', 'fx_blue_sell', 'fx_blue_buy'] as const;

@Injectable()
export class MacroService {
  constructor(private readonly prisma: PrismaService) {}

  async fxSeries(q: FxQueryDto) {
    const where: Prisma.FactPriceWhereInput = {
      source: 'fx',
      series: { in: [...FX_SERIES] },
    };
    if (q.from || q.to) {
      where.date = {};
      if (q.from) (where.date as Prisma.DateTimeFilter).gte = parseDay(q.from);
      if (q.to) (where.date as Prisma.DateTimeFilter).lte = parseDay(q.to);
    }
    const rows = await this.prisma.factPrice.findMany({ where, orderBy: [{ date: 'asc' }, { series: 'asc' }] });
    return pivotByDate(rows);
  }

  async fxLatest() {
    const rows = await this.prisma.factPrice.findMany({
      where: { source: 'fx', series: { in: [...FX_SERIES] } },
      orderBy: { date: 'desc' },
    });
    if (!rows.length) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'No FX data ingested. Run seed-prices.ts.' });
    }
    const latestDate = rows[0].date.toISOString().slice(0, 10);
    const sameDay = rows.filter((r) => r.date.toISOString().slice(0, 10) === latestDate);
    return {
      date: latestDate,
      oficial_sell: pickValue(sameDay, 'fx_oficial_sell'),
      oficial_buy: pickValue(sameDay, 'fx_oficial_buy'),
      blue_sell: pickValue(sameDay, 'fx_blue_sell'),
      blue_buy: pickValue(sameDay, 'fx_blue_buy'),
    };
  }

  async rigCountSeries() {
    const rows = await this.prisma.factRigCount.findMany({ orderBy: { date: 'asc' } });
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 7),
      oil_rigs: r.oilRigs,
      gas_rigs: r.gasRigs,
      total_rigs: r.totalRigs,
    }));
  }

  /** Vaca Muerta next to the US shale basins, month by month, in the same units:
   *  crude kb/d, gas Bcf/d (and MMm3/d), rigs. VM = vm_combined production (SE);
   *  US basins = EIA STEO; rigs for Argentina are the whole country (Baker Hughes),
   *  there is no VM-only rig count. */
  async basins(from = '2023-01') {
    const since = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
    const [steo, vm, rigs, complete] = await Promise.all([
      this.prisma.factPrice.findMany({ where: { source: 'eia_steo', date: { gte: since } }, orderBy: { date: 'asc' } }),
      this.prisma.$queryRaw<{ month: Date; oil_bbl_d: number; gas_mm3_d: number }[]>`
        SELECT date_month AS month, SUM(oil_bbl_d)::float AS oil_bbl_d, SUM(gas_mm3_d)::float AS gas_mm3_d
        FROM agg_monthly_by_operator
        WHERE vm_combined AND date_month >= ${since}
        GROUP BY date_month`,
      this.prisma.factRigCount.findMany({ where: { date: { gte: since } } }),
      latestCompleteMonth(this.prisma),
    ]);
    const r1 = (v: number) => Math.round(v * 10) / 10;
    const months = new Map<string, Record<string, unknown>>();
    const at = (d: Date) => {
      const k = d.toISOString().slice(0, 7);
      if (!months.has(k)) months.set(k, { date: k });
      return months.get(k)!;
    };
    for (const v of vm) {
      at(v.month).vaca_muerta = {
        oil_kbd: r1(v.oil_bbl_d / 1000),
        gas_bcfd: Math.round((v.gas_mm3_d / MMM3_PER_BCF) * 100) / 100,
        gas_mm3d: r1(v.gas_mm3_d),
        preliminary: isPreliminary(v.month, complete),
      };
    }
    for (const r of rigs) at(r.date).argentina_rigs = r.totalRigs;
    for (const p of steo) {
      const [basin, metric] = [p.series.slice(0, p.series.lastIndexOf('_')), p.series.slice(p.series.lastIndexOf('_') + 1)];
      const m = at(p.date);
      const b = ((m[basin] as Record<string, number>) ??= {});
      if (metric === 'oil') b.oil_kbd = r1(p.value);
      if (metric === 'gas') {
        b.gas_bcfd = p.value;
        b.gas_mm3d = r1(p.value * MMM3_PER_BCF);
      }
      if (metric === 'rigs') b.rigs = Math.round(p.value);
    }
    return [...months.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  /** Pozos en perforación por mes: total nacional y por provincia (o una sola). */
  async wellsDrilling(province?: string) {
    const rows = await this.prisma.factWellsDrilling.findMany({
      where: province ? { province: { equals: province, mode: 'insensitive' } } : {},
      orderBy: [{ date: 'asc' }, { wells: 'desc' }],
    });
    const byMonth = new Map<string, { date: string; total: number; by_province: Record<string, number> }>();
    for (const r of rows) {
      const date = r.date.toISOString().slice(0, 7);
      const m = byMonth.get(date) ?? { date, total: 0, by_province: {} };
      m.total += r.wells;
      m.by_province[r.province] = r.wells;
      byMonth.set(date, m);
    }
    return [...byMonth.values()];
  }

  async rigCountLatest() {
    const r = await this.prisma.factRigCount.findFirst({ orderBy: { date: 'desc' } });
    if (!r) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'No rig-count data ingested. Run pnpm db:load:rigs.' });
    }
    return {
      date: r.date.toISOString().slice(0, 7),
      oil_rigs: r.oilRigs,
      gas_rigs: r.gasRigs,
      total_rigs: r.totalRigs,
    };
  }
}

function parseDay(v: string): Date {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function pickValue(rows: Array<{ series: string; value: number }>, series: string): number | null {
  const r = rows.find((x) => x.series === series);
  return r ? r.value : null;
}

function pivotByDate(rows: Array<{ date: Date; series: string; value: number }>) {
  const buckets = new Map<string, { date: string; oficial_sell: number | null; oficial_buy: number | null; blue_sell: number | null; blue_buy: number | null }>();
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    let entry = buckets.get(key);
    if (!entry) {
      entry = { date: key, oficial_sell: null, oficial_buy: null, blue_sell: null, blue_buy: null };
      buckets.set(key, entry);
    }
    if (r.series === 'fx_oficial_sell') entry.oficial_sell = r.value;
    else if (r.series === 'fx_oficial_buy') entry.oficial_buy = r.value;
    else if (r.series === 'fx_blue_sell') entry.blue_sell = r.value;
    else if (r.series === 'fx_blue_buy') entry.blue_buy = r.value;
  }
  return Array.from(buckets.values());
}
