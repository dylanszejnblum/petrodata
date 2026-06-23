import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

// World oil & gas production by country (EIA International), produced by
// petroldata.ar/market-data/fetch_world_energy.py → out/world_energy.csv.
const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface WorldRow {
  product: string;
  iso3: string;
  country: string;
  period: string; // YYYY
  value: string;
  unit: string;
}

async function main() {
  const t0 = Date.now();
  const path = resolve(MARKET_DATA_DIR, 'world_energy.csv');
  if (!existsSync(path)) throw new Error(`world_energy.csv not found at ${path}`);

  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as WorldRow[];

  let upserted = 0;
  // Idempotent upsert by (product, iso3, period). No TRUNCATE — additive and re-runnable.
  for (const r of rows) {
    if (!r.product || !r.iso3 || !r.period) continue;
    const value = Number(r.value);
    if (!Number.isFinite(value)) continue;
    const period = new Date(Date.UTC(Number(r.period), 0, 1)); // annual → YYYY-01-01
    if (Number.isNaN(period.getTime())) continue;

    const data = { country: r.country, value, unit: r.unit };
    await prisma.factWorldProduction.upsert({
      where: { fact_world_production_product_iso3_period: { product: r.product, iso3: r.iso3, period } },
      create: { product: r.product, iso3: r.iso3, period, ...data },
      update: data,
    });
    upserted++;
  }

  const products = [...new Set(rows.map((r) => r.product))].join(', ');
  console.log(
    `  world energy: ${upserted}/${rows.length} rows upserted (${products}) in ${((Date.now() - t0) / 1000).toFixed(2)}s`,
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
