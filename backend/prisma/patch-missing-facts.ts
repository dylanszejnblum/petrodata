/**
 * One-off patch: insert the production facts that the original seed dropped
 * because their well wasn't in the registry CSV (the bug fixed in seed.ts via
 * fillMissingWells). Adds placeholder dim_well rows + the missing facts only —
 * no TRUNCATE, no downtime. Idempotent: re-running inserts nothing new.
 *
 *   CSV_DATA_DIR=<out_full/normalized> DATABASE_URL=<target> \
 *     ts-node --transpile-only prisma/patch-missing-facts.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();
const DATA_DIR = resolve(process.cwd(), process.env.CSV_DATA_DIR || '../data-pipeline/out_full/normalized');
const BATCH = Number(process.env.SEED_BATCH_SIZE ?? 10000);

const normSlug = (v: string | undefined | null): string =>
  (v ?? '').toString().trim().toLowerCase();
const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: any): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: any): boolean => ['true', '1', 't'].includes(String(v).trim().toLowerCase());
const month = (v: string): Date => {
  const [y, m] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};

function factRow(r: any): Prisma.FactProductionMonthlyCreateManyInput {
  return {
    dateMonth: month(r.date_month),
    wellId: String(r.well_id),
    operatorSlug: normSlug(r.operator_slug),
    formationSlug: normSlug(r.formation_slug),
    concession: r.concession ?? '',
    yacimiento: r.yacimiento ?? '',
    basin: r.basin ?? '',
    province: r.province ?? '',
    wellType: r.well_type ?? '',
    extractionType: r.extraction_type ?? '',
    statusCode: r.status_code ?? '',
    tipoRecurso: r.tipo_recurso ?? '',
    depthM: numOrNull(r.depth_m),
    coordX: numOrNull(r.coord_x),
    coordY: numOrNull(r.coord_y),
    oilM3: num(r.oil_m3),
    gasThousandM3: num(r.gas_thousand_m3),
    oilBbl: num(r.oil_bbl),
    oilBblD: num(r.oil_bbl_d),
    oilBoe: num(r.oil_boe),
    gasMm3D: num(r.gas_mm3_d),
    gasMcf: num(r.gas_mcf),
    gasMmcfD: num(r.gas_mmcf_d),
    gasBoe: num(r.gas_boe),
    boe: num(r.boe),
    formationVacaMuerta: bool(r.formation_vaca_muerta),
    unconventional: bool(r.unconventional),
    vmCombined: bool(r.vm_combined),
  };
}

function wellRow(r: any): Prisma.DimWellCreateManyInput {
  return {
    wellId: String(r.well_id),
    sigla: r.well_sigla ?? '',
    operatorSlug: normSlug(r.operator_slug),
    formationSlug: normSlug(r.formation_slug),
    operatorName: r.operator_name ?? '',
    province: r.province ?? '',
    basin: r.basin ?? '',
    concession: r.concession ?? '',
    yacimiento: r.yacimiento ?? '',
    wellType: r.well_type ?? '',
    extractionType: r.extraction_type ?? '',
    statusCode: r.status_code ?? '',
    resourceType: r.tipo_recurso ?? '',
    subResourceType: '',
    depthM: numOrNull(r.depth_m),
    latitude: null,
    longitude: null,
  };
}

async function main() {
  console.log(`Patching from: ${DATA_DIR}`);
  const existingWells = new Set<string>();
  (await prisma.dimWell.findMany({ select: { wellId: true } })).forEach((w) => existingWells.add(w.wellId));
  const validOps = new Set<string>();
  (await prisma.dimOperator.findMany({ select: { operatorSlug: true } })).forEach((o) => validOps.add(o.operatorSlug));
  const validForms = new Set<string>();
  (await prisma.dimFormation.findMany({ select: { formationSlug: true } })).forEach((f) => validForms.add(f.formationSlug));
  console.log(`Existing: ${existingWells.size} wells, ${validOps.size} operators, ${validForms.size} formations`);

  const missingWells = new Map<string, Prisma.DimWellCreateManyInput>();
  const missingFacts: Prisma.FactProductionMonthlyCreateManyInput[] = [];
  let scanned = 0;

  await new Promise<void>((res, rej) => {
    createReadStream(resolve(DATA_DIR, 'fact_production_monthly.csv'))
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (r: any) => {
        scanned++;
        const wellId = String(r.well_id);
        if (!wellId || existingWells.has(wellId)) return; // already loaded
        const op = normSlug(r.operator_slug);
        const fm = normSlug(r.formation_slug);
        if (!validOps.has(op) || !validForms.has(fm)) return; // FK can't be satisfied
        if (!missingWells.has(wellId)) missingWells.set(wellId, wellRow(r));
        missingFacts.push(factRow(r));
      })
      .on('end', () => res())
      .on('error', rej);
  });

  console.log(`Scanned ${scanned.toLocaleString()} facts → ${missingWells.size} missing wells, ${missingFacts.length} missing facts`);

  const wells = [...missingWells.values()];
  for (let i = 0; i < wells.length; i += BATCH) {
    await prisma.dimWell.createMany({ data: wells.slice(i, i + BATCH), skipDuplicates: true });
  }
  for (let i = 0; i < missingFacts.length; i += BATCH) {
    await prisma.factProductionMonthly.createMany({ data: missingFacts.slice(i, i + BATCH), skipDuplicates: true });
  }
  console.log(`Inserted ${wells.length} wells + ${missingFacts.length} facts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
