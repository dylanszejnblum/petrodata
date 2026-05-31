import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface EnergyBalanceRow {
  ano: string;
  forma_de_energia: string;
  concepto: string;
  ktep_redond: string;
}

async function main() {
  const t0 = Date.now();
  const path = resolve(MARKET_DATA_DIR, 'energy_balance.csv');
  if (!existsSync(path)) throw new Error(`energy_balance.csv not found at ${path}`);

  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as EnergyBalanceRow[];

  console.log('Clearing fact_energy_balance...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "fact_energy_balance" RESTART IDENTITY');

  const data: Prisma.FactEnergyBalanceCreateManyInput[] = [];
  for (const r of rows) {
    const ano = Number(r.ano);
    const ktep = Number(r.ktep_redond);
    if (!Number.isFinite(ano) || !Number.isFinite(ktep)) continue;
    if (!r.forma_de_energia || !r.concepto) continue;
    data.push({
      ano,
      formaDeEnergia: r.forma_de_energia,
      concepto: r.concepto,
      ktepRedond: ktep,
    });
  }

  let inserted = 0;
  for (let i = 0; i < data.length; i += 5000) {
    const slice = data.slice(i, i + 5000);
    await prisma.factEnergyBalance.createMany({ data: slice, skipDuplicates: true });
    inserted += slice.length;
  }
  console.log(`  energy balance: ${inserted} rows in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
