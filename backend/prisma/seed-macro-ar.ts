import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

// Argentina macro series (FX, inflation, fiscal) from datos.gob.ar, produced by
// petroldata.ar/market-data/fetch_macro_ar.py → out/macro_ar.csv. Seeded into the
// generic fact_price series table (source/series/date/value), like seed-gdp.ts.
const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface MacroRow {
  source: string;
  series: string;
  name: string;
  unit: string;
  date: string; // YYYY-MM-01
  value: string;
}

async function main() {
  const t0 = Date.now();
  const path = resolve(MARKET_DATA_DIR, 'macro_ar.csv');
  if (!existsSync(path)) throw new Error(`macro_ar.csv not found at ${path}`);

  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as MacroRow[];

  let upserted = 0;
  // Idempotent upsert by [source, series, date]. No TRUNCATE — additive.
  for (const r of rows) {
    if (!r.source || !r.series || !r.date) continue;
    const value = Number(r.value);
    if (!Number.isFinite(value)) continue;
    const date = new Date(r.date);
    if (Number.isNaN(date.getTime())) continue;

    const data = { name: r.name, unit: r.unit, value };
    await prisma.factPrice.upsert({
      where: { fact_price_source_series_date: { source: r.source, series: r.series, date } },
      create: { source: r.source, series: r.series, date, ...data },
      update: data,
    });
    upserted++;
  }

  const series = [...new Set(rows.map((r) => `${r.source}/${r.series}`))].join(', ');
  console.log(
    `  macro AR: ${upserted}/${rows.length} rows upserted (${series}) in ${((Date.now() - t0) / 1000).toFixed(2)}s`,
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
