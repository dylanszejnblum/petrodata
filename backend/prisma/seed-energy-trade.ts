import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface TradeRow {
  period: string;
  granularity: string;
  energy_exports_usd: string;
  energy_imports_usd: string;
  energy_surplus_usd: string;
  agro_exports_usd: string;
  source_label: string;
  source_url: string;
  source_as_of: string;
}

const num = (v: string): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const t0 = Date.now();
  const path = resolve(MARKET_DATA_DIR, 'fact_energy_trade.csv');
  if (!existsSync(path)) throw new Error(`fact_energy_trade.csv not found at ${path}`);

  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as TradeRow[];

  let upserted = 0;
  // Idempotent upsert by (period, granularity). No TRUNCATE — additive and re-runnable.
  for (const r of rows) {
    if (!r.period || !r.granularity || !r.source_label) continue;
    const period = new Date(r.period);
    if (Number.isNaN(period.getTime())) continue;

    const data = {
      energyExportsUsd: num(r.energy_exports_usd),
      energyImportsUsd: num(r.energy_imports_usd),
      energySurplusUsd: num(r.energy_surplus_usd),
      agroExportsUsd: num(r.agro_exports_usd),
      sourceLabel: r.source_label,
      sourceUrl: r.source_url || null,
      sourceAsOf: r.source_as_of || null,
    };

    await prisma.factEnergyTrade.upsert({
      where: { period_granularity: { period, granularity: r.granularity } },
      create: { period, granularity: r.granularity, ...data },
      update: data,
    });
    upserted++;
  }

  console.log(
    `  energy trade: ${upserted}/${rows.length} rows upserted in ${((Date.now() - t0) / 1000).toFixed(2)}s`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
