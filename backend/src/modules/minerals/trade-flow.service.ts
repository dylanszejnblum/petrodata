import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TradeFlowQueryDto } from './trade-flow.dto';

// Maps a commodity name to the trade dataset that backs it. Only uranium has
// SIACAM trade data today; new minerals slot in here as their pipelines land.
const URANIUM_ALIASES = new Set(['uranio', 'uranium', 'u']);

const UNSPECIFIED = 'Sin especificar';

@Injectable()
export class TradeFlowService {
  constructor(private readonly prisma: PrismaService) {}

  async flow(q: TradeFlowQueryDto) {
    const mineral = (q.mineral ?? 'Uranio').trim();
    const isUranium = URANIUM_ALIASES.has(mineral.toLowerCase());

    if (!isUranium) {
      // No trade dataset for this commodity yet — return an empty, well-formed flow.
      return {
        mineral,
        year: q.year ?? null,
        imports: [],
        exports: [],
        total_import_usd: 0,
        total_export_usd: 0,
        balance_usd: 0,
        available_years: [],
      };
    }

    const where: Prisma.UraniumTradeWhereInput = {};
    if (q.year !== undefined) where.year = q.year;

    const [rows, yearRows] = await Promise.all([
      this.prisma.uraniumTrade.findMany({ where }),
      this.prisma.uraniumTrade.findMany({ select: { year: true }, distinct: ['year'], orderBy: { year: 'asc' } }),
    ]);

    const imports = aggregateByCountry(rows.filter((r) => r.tradeType !== 'export'));
    const exports = aggregateByCountry(rows.filter((r) => r.tradeType === 'export'));

    const total_import_usd = round2(imports.reduce((s, e) => s + e.value_usd, 0));
    const total_export_usd = round2(exports.reduce((s, e) => s + e.value_usd, 0));

    return {
      mineral: 'Uranio',
      year: q.year ?? null,
      imports,
      exports,
      total_import_usd,
      total_export_usd,
      balance_usd: round2(total_export_usd - total_import_usd),
      available_years: yearRows.map((r) => r.year),
    };
  }
}

function aggregateByCountry(rows: Array<{ country: string; valueUsd: number }>): Array<{ country: string; value_usd: number }> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    const country = normalizeCountry(r.country);
    totals.set(country, (totals.get(country) ?? 0) + r.valueUsd);
  }
  return [...totals.entries()]
    .map(([country, value_usd]) => ({ country, value_usd: round2(value_usd) }))
    .sort((a, b) => b.value_usd - a.value_usd);
}

function normalizeCountry(c: string | null | undefined): string {
  const v = (c ?? '').trim();
  return v === '' || v === '-' ? UNSPECIFIED : v;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
