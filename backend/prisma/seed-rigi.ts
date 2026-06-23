import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

// Approved RIGI oil & gas projects, compiled from the official Ministerio de
// Economía registry (argentina.gob.ar/economia/rigi). The CSV is committed in
// the repo so every figure carries provenance — no hardcoded numbers in code.
const CSV_PATH = resolve(__dirname, 'data', 'rigi_projects.csv');

interface RigiRow {
  name: string;
  sector: string;
  operator: string;
  province: string;
  investment_musd: string;
  approval_date: string;
  source_label: string;
  source_url: string;
}

const num = (v: string): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const t0 = Date.now();
  if (!existsSync(CSV_PATH)) throw new Error(`rigi_projects.csv not found at ${CSV_PATH}`);

  const rows = parse(readFileSync(CSV_PATH, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RigiRow[];

  let upserted = 0;
  // Idempotent upsert by name. No TRUNCATE — additive and re-runnable.
  for (const r of rows) {
    if (!r.name || !r.sector) continue;
    const approval = r.approval_date ? new Date(r.approval_date) : null;
    const data = {
      sector: r.sector,
      operator: r.operator || null,
      province: r.province || null,
      investmentMusd: num(r.investment_musd),
      approvalDate: approval && !Number.isNaN(approval.getTime()) ? approval : null,
      sourceLabel: r.source_label || null,
      sourceUrl: r.source_url || null,
    };
    await prisma.rigiProject.upsert({
      where: { name: r.name },
      create: { name: r.name, ...data },
      update: data,
    });
    upserted++;
  }

  console.log(`  RIGI: ${upserted}/${rows.length} projects upserted in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
