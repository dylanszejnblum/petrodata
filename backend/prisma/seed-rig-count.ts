import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface RigRow {
  date: string;
  oil_rigs?: string;
  gas_rigs?: string;
  total_rigs?: string;
}

function parseMonth(v: string): Date {
  const [y, m] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function asInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

async function main() {
  const t0 = Date.now();
  const path = resolve(MARKET_DATA_DIR, 'rig_count_argentina.csv');
  if (!existsSync(path)) throw new Error(`rig_count_argentina.csv not found at ${path}`);

  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RigRow[];

  console.log('Clearing fact_rig_count...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "fact_rig_count"');

  const data = rows.map((r) => ({
    date: parseMonth(r.date),
    oilRigs: asInt(r.oil_rigs),
    gasRigs: asInt(r.gas_rigs),
    totalRigs: asInt(r.total_rigs),
  }));

  if (data.length) await prisma.factRigCount.createMany({ data, skipDuplicates: true });
  console.log(`  rig count: ${data.length} rows in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
