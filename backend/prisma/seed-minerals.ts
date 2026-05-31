import { PrismaClient, Prisma } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { basename, resolve } from 'path';

const prisma = new PrismaClient();

const DEFAULT_PIPELINE_ROOT = resolve(process.cwd(), '../data-pipeline');

interface RawProject {
  project_name?: string;
  primary_commodity?: string;
  by_products?: string[] | string | null;
  status?: string | null;
  deposit_type?: string | null;
  owner_controller?: string | null;
  operator?: string | null;
  area_ha?: number | null;
  province?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: {
    province?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  technical_economic?: {
    since_production?: number | null;
    estimated_lom_years?: number | null;
    productive_capacity?: string | null;
    estimated_annual_production?: string | null;
    capex?: string | null;
    mining_method?: string | null;
    product?: string | null;
  } | null;
  resources?: unknown;
  reserves?: unknown;
  resources_year?: number | null;
  geology?: {
    regional?: string | null;
    deposit?: string | null;
  } | null;
  sources_consulted?: unknown;
  [key: string]: unknown;
}

function pipelineDirName(dir: string): string {
  const name = basename(dir);
  return name.startsWith('out_') ? name.slice(4) : name;
}

function resolveDataDirs(): string[] {
  const envList = process.env.MINERALS_DATA_DIRS;
  if (envList && envList.trim()) {
    return envList
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => resolve(process.cwd(), d));
  }

  if (!existsSync(DEFAULT_PIPELINE_ROOT)) {
    throw new Error(`Default pipeline root not found: ${DEFAULT_PIPELINE_ROOT}`);
  }

  return readdirSync(DEFAULT_PIPELINE_ROOT)
    .filter((name) => name.startsWith('out_'))
    .map((name) => resolve(DEFAULT_PIPELINE_ROOT, name))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}

function asString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function asNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asInt(v: unknown): number | null {
  const n = asNumber(v);
  return n === null ? null : Math.trunc(n);
}

function byProductsString(v: unknown): string | null {
  if (Array.isArray(v)) {
    const items = v.map((x) => asString(x)).filter((s): s is string => !!s);
    return items.length ? items.join(', ') : null;
  }
  return asString(v);
}

function toRecord(raw: RawProject, sourcePipeline: string): Prisma.MiningProjectCreateManyInput | null {
  const projectName = asString(raw.project_name);
  const primaryCommodity = asString(raw.primary_commodity);
  if (!projectName || !primaryCommodity) return null;

  const loc = raw.location ?? {};
  const tech = raw.technical_economic ?? {};

  return {
    projectName,
    primaryCommodity,
    byProducts: byProductsString(raw.by_products),
    status: asString(raw.status),
    depositType: asString(raw.deposit_type),
    ownerController: asString(raw.owner_controller),
    operator: asString(raw.operator),
    areaHa: asNumber(raw.area_ha),
    province: asString(raw.province ?? loc.province),
    country: asString(raw.country ?? loc.country),
    latitude: asNumber(raw.latitude ?? loc.latitude),
    longitude: asNumber(raw.longitude ?? loc.longitude),
    sinceProduction: asInt(tech.since_production),
    estimatedLomYears: asInt(tech.estimated_lom_years),
    productiveCapacity: asString(tech.productive_capacity),
    estimatedAnnualProd: asString(tech.estimated_annual_production),
    capex: asString(tech.capex),
    miningMethod: asString(tech.mining_method),
    product: asString(tech.product),
    sourcePipeline,
    resourcesYear: asInt(raw.resources_year),
    resources: (raw.resources ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    reserves: (raw.reserves ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    geology: (raw.geology ?? Prisma.JsonNull) as Prisma.InputJsonValue,
  };
}

async function main() {
  const t0 = Date.now();
  const dirs = resolveDataDirs();
  if (!dirs.length) {
    console.log('No pipeline directories found.');
    return;
  }
  console.log(`Seeding minerals from ${dirs.length} pipeline director${dirs.length === 1 ? 'y' : 'ies'}:`);
  dirs.forEach((d) => console.log(`  - ${d}`));

  console.log('Clearing mining_project...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "mining_project" RESTART IDENTITY');

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const dir of dirs) {
    const file = resolve(dir, 'projects.json');
    if (!existsSync(file)) {
      console.log(`  ${basename(dir)}: no projects.json, skipping`);
      continue;
    }
    const sourcePipeline = pipelineDirName(dir);
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as RawProject[];
    if (!Array.isArray(raw)) {
      console.log(`  ${sourcePipeline}: projects.json is not an array, skipping`);
      continue;
    }

    const records: Prisma.MiningProjectCreateManyInput[] = [];
    let skipped = 0;
    for (const p of raw) {
      const rec = toRecord(p, sourcePipeline);
      if (rec) records.push(rec);
      else skipped++;
    }

    if (records.length) {
      await prisma.miningProject.createMany({ data: records, skipDuplicates: true });
    }

    totalInserted += records.length;
    totalSkipped += skipped;
    console.log(`  ${sourcePipeline}: ${records.length} inserted, ${skipped} skipped`);
  }

  console.log(`\nDone: ${totalInserted} project(s) upserted, ${totalSkipped} skipped in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
