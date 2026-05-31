import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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

  async rigCountLatest() {
    const r = await this.prisma.factRigCount.findFirst({ orderBy: { date: 'desc' } });
    if (!r) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'No rig-count data ingested. Run seed-rig-count.ts.' });
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
