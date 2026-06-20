import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const DATA_DIR = resolve(
  process.cwd(),
  process.env.CSV_DATA_DIR || '../../petroldata.ar/data/data-v1',
);

const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 5000);

function parseBool(v: string | undefined | null): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 't';
}

function parseNum(v: string | undefined | null): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseNumOrNull(v: string | undefined | null): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseMonth(v: string): Date {
  // CSV has "YYYY-MM"; store as YYYY-MM-01 UTC
  const [y, m] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

async function readCsv<T = any>(
  filename: string,
  onBatch: (rows: T[]) => Promise<void>,
): Promise<number> {
  const path = resolve(DATA_DIR, filename);
  if (!existsSync(path)) throw new Error(`CSV not found: ${path}`);

  const parser = createReadStream(path).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true }),
  );

  let batch: T[] = [];
  let total = 0;
  for await (const record of parser) {
    batch.push(record as T);
    if (batch.length >= BATCH_SIZE) {
      await onBatch(batch);
      total += batch.length;
      batch = [];
      if (total % 50000 === 0) process.stdout.write(`    ${total.toLocaleString()} rows...\n`);
    }
  }
  if (batch.length) {
    await onBatch(batch);
    total += batch.length;
  }
  return total;
}

async function clearTables() {
  console.log('Clearing existing data...');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "fact_production_monthly", "agg_monthly_by_operator", "dim_well", "dim_formation", "dim_operator" RESTART IDENTITY CASCADE',
  );
}

async function seedOperators() {
  const t0 = Date.now();
  const total = await readCsv<any>('dim_operator.csv', async (rows) => {
    await prisma.dimOperator.createMany({
      data: rows.map((r) => ({
        operatorSlug: r.operator_slug,
        operatorName: r.operator_name,
        aliases: r.aliases ?? '',
      })),
      skipDuplicates: true,
    });
  });
  console.log(`  operators: ${total} rows in ${Date.now() - t0}ms`);
}

async function seedFormations() {
  const t0 = Date.now();
  const total = await readCsv<any>('dim_formation.csv', async (rows) => {
    await prisma.dimFormation.createMany({
      data: rows.map((r) => ({
        formationSlug: r.formation_slug,
        formationName: r.formation_name,
        formationVacaMuerta: parseBool(r.formation_vaca_muerta),
      })),
      skipDuplicates: true,
    });
  });
  console.log(`  formations: ${total} rows in ${Date.now() - t0}ms`);
}

async function seedWells(validOperators: Set<string>, validFormations: Set<string>) {
  const t0 = Date.now();
  let skipped = 0;
  const total = await readCsv<any>('dim_well.csv', async (rows) => {
    const data: Prisma.DimWellCreateManyInput[] = [];
    for (const r of rows) {
      const operatorSlug = normSlug(r.operator_slug);
      const formationSlug = normSlug(r.formation_slug);
      if (!validOperators.has(operatorSlug) || !validFormations.has(formationSlug)) {
        skipped++;
        continue;
      }
      data.push({
        wellId: String(r.well_id),
        sigla: r.sigla ?? '',
        operatorSlug,
        formationSlug,
        operatorName: r.operator_name ?? '',
        province: r.province ?? '',
        basin: r.basin ?? '',
        concession: r.concession ?? '',
        yacimiento: r.yacimiento ?? '',
        wellType: r.well_type ?? '',
        extractionType: r.extraction_type ?? '',
        statusCode: r.status_code ?? '',
        resourceType: r.resource_type ?? '',
        subResourceType: r.sub_resource_type ?? '',
        depthM: parseNumOrNull(r.depth_m),
        latitude: parseNumOrNull(r.latitude),
        longitude: parseNumOrNull(r.longitude),
      });
    }
    if (data.length) await prisma.dimWell.createMany({ data, skipDuplicates: true });
  });
  console.log(`  wells: ${total - skipped} inserted, ${skipped} skipped (missing FK) in ${Date.now() - t0}ms`);
}

async function seedFacts(
  validWells: Set<string>,
  validOperators: Set<string>,
  validFormations: Set<string>,
) {
  const t0 = Date.now();
  let skipped = 0;
  const total = await readCsv<any>('fact_production_monthly.csv', async (rows) => {
    const data: Prisma.FactProductionMonthlyCreateManyInput[] = [];
    for (const r of rows) {
      const wellId = String(r.well_id);
      const operatorSlug = normSlug(r.operator_slug);
      const formationSlug = normSlug(r.formation_slug);
      if (
        !validWells.has(wellId) ||
        !validOperators.has(operatorSlug) ||
        !validFormations.has(formationSlug)
      ) {
        skipped++;
        continue;
      }
      data.push({
        dateMonth: parseMonth(r.date_month),
        wellId,
        operatorSlug,
        formationSlug,
        concession: r.concession ?? '',
        yacimiento: r.yacimiento ?? '',
        basin: r.basin ?? '',
        province: r.province ?? '',
        wellType: r.well_type ?? '',
        extractionType: r.extraction_type ?? '',
        statusCode: r.status_code ?? '',
        tipoRecurso: r.tipo_recurso ?? '',
        depthM: parseNumOrNull(r.depth_m),
        coordX: parseNumOrNull(r.coord_x),
        coordY: parseNumOrNull(r.coord_y),
        oilM3: parseNum(r.oil_m3),
        gasThousandM3: parseNum(r.gas_thousand_m3),
        oilBbl: parseNum(r.oil_bbl),
        oilBblD: parseNum(r.oil_bbl_d),
        oilBoe: parseNum(r.oil_boe),
        gasMm3D: parseNum(r.gas_mm3_d),
        gasMcf: parseNum(r.gas_mcf),
        gasMmcfD: parseNum(r.gas_mmcf_d),
        gasBoe: parseNum(r.gas_boe),
        boe: parseNum(r.boe),
        formationVacaMuerta: parseBool(r.formation_vaca_muerta),
        unconventional: parseBool(r.unconventional),
        vmCombined: parseBool(r.vm_combined),
      });
    }
    if (data.length) await prisma.factProductionMonthly.createMany({ data });
  });
  console.log(`  facts: ${total - skipped} inserted, ${skipped} skipped in ${Date.now() - t0}ms`);
}

async function seedAggByOperator() {
  const t0 = Date.now();
  const total = await readCsv<any>('agg_monthly_by_operator.csv', async (rows) => {
    await prisma.aggMonthlyByOperator.createMany({
      data: rows.map((r) => ({
        dateMonth: parseMonth(r.date_month),
        operatorSlug: r.operator_slug,
        operatorName: r.operator_name ?? '',
        concession: r.concession ?? '',
        yacimiento: r.yacimiento ?? '',
        province: r.province ?? '',
        formationSlug: r.formation_slug,
        vmCombined: parseBool(r.vm_combined),
        oilM3: parseNum(r.oil_m3),
        oilBbl: parseNum(r.oil_bbl),
        oilBblD: parseNum(r.oil_bbl_d),
        gasThousandM3: parseNum(r.gas_thousand_m3),
        gasMm3D: parseNum(r.gas_mm3_d),
        gasMcf: parseNum(r.gas_mcf),
        gasMmcfD: parseNum(r.gas_mmcf_d),
        boe: parseNum(r.boe),
        activeWells: Math.round(parseNum(r.active_wells)),
      })),
    });
  });
  console.log(`  agg_by_operator: ${total} rows in ${Date.now() - t0}ms`);
}

async function loadIdSet(filename: string, column: string): Promise<Set<string>> {
  const set = new Set<string>();
  await readCsv<any>(filename, async (rows) => {
    for (const r of rows) set.add(String(r[column]));
  });
  return set;
}

const UNKNOWN_SLUG = 'unknown';

function normSlug(v: string | undefined | null): string {
  const s = (v ?? '').trim();
  return s === '' ? UNKNOWN_SLUG : s;
}

async function collectReferencedSlugs(): Promise<{
  operators: Set<string>;
  formations: Set<string>;
}> {
  const operators = new Set<string>();
  const formations = new Set<string>();
  await readCsv<any>('dim_well.csv', async (rows) => {
    for (const r of rows) {
      operators.add(normSlug(r.operator_slug));
      formations.add(normSlug(r.formation_slug));
    }
  });
  await readCsv<any>('fact_production_monthly.csv', async (rows) => {
    for (const r of rows) {
      operators.add(normSlug(r.operator_slug));
      formations.add(normSlug(r.formation_slug));
    }
  });
  return { operators, formations };
}

async function fillMissingDims(
  validOperators: Set<string>,
  validFormations: Set<string>,
): Promise<{ addedOperators: number; addedFormations: number }> {
  const { operators, formations } = await collectReferencedSlugs();

  const missingOps = [...operators].filter((s) => !validOperators.has(s));
  const missingForms = [...formations].filter((s) => !validFormations.has(s));

  if (missingOps.length) {
    await prisma.dimOperator.createMany({
      data: missingOps.map((slug) => ({
        operatorSlug: slug,
        operatorName: slug,
        aliases: '',
      })),
      skipDuplicates: true,
    });
    missingOps.forEach((s) => validOperators.add(s));
  }
  if (missingForms.length) {
    await prisma.dimFormation.createMany({
      data: missingForms.map((slug) => ({
        formationSlug: slug,
        formationName: slug,
        formationVacaMuerta: false,
      })),
      skipDuplicates: true,
    });
    missingForms.forEach((s) => validFormations.add(s));
  }

  return { addedOperators: missingOps.length, addedFormations: missingForms.length };
}

/**
 * Wells referenced by production facts but absent from the well-registry CSV
 * would otherwise have their facts silently dropped. Create placeholder
 * dim_well rows for them (built from the fact row's own metadata) so no
 * production is lost. Operator/formation FKs are already placeholder-filled.
 */
async function fillMissingWells(
  validWells: Set<string>,
  validOperators: Set<string>,
  validFormations: Set<string>,
): Promise<number> {
  const placeholders = new Map<string, Prisma.DimWellCreateManyInput>();
  await readCsv<any>('fact_production_monthly.csv', async (rows) => {
    for (const r of rows) {
      const wellId = String(r.well_id);
      if (!wellId || validWells.has(wellId) || placeholders.has(wellId)) continue;
      const operatorSlug = normSlug(r.operator_slug);
      const formationSlug = normSlug(r.formation_slug);
      if (!validOperators.has(operatorSlug) || !validFormations.has(formationSlug)) continue;
      placeholders.set(wellId, {
        wellId,
        sigla: r.well_sigla ?? '',
        operatorSlug,
        formationSlug,
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
        depthM: parseNumOrNull(r.depth_m),
        latitude: null,
        longitude: null,
      });
    }
  });
  const rows = [...placeholders.values()];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await prisma.dimWell.createMany({ data: rows.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }
  rows.forEach((w) => validWells.add(w.wellId));
  return rows.length;
}

async function main() {
  const t0 = Date.now();
  console.log(`Seeding from: ${DATA_DIR}`);
  if (!existsSync(DATA_DIR)) throw new Error(`Data dir not found: ${DATA_DIR}`);

  await clearTables();

  console.log('Loading dimensions...');
  await seedOperators();
  await seedFormations();

  const validOperators = await loadIdSet('dim_operator.csv', 'operator_slug');
  const validFormations = await loadIdSet('dim_formation.csv', 'formation_slug');

  console.log('Filling placeholder rows for slugs missing from dim CSVs...');
  const { addedOperators, addedFormations } = await fillMissingDims(validOperators, validFormations);
  console.log(`  added ${addedOperators} operator placeholders, ${addedFormations} formation placeholders`);

  console.log('Loading wells...');
  await seedWells(validOperators, validFormations);

  const validWells = new Set<string>();
  (await prisma.dimWell.findMany({ select: { wellId: true } })).forEach((w) =>
    validWells.add(w.wellId),
  );

  const addedWells = await fillMissingWells(validWells, validOperators, validFormations);
  console.log(`  added ${addedWells} well placeholders (referenced in facts, missing from registry)`);

  console.log('Loading production facts (this is the big one)...');
  await seedFacts(validWells, validOperators, validFormations);

  console.log('Loading aggregate tables...');
  await seedAggByOperator();

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
