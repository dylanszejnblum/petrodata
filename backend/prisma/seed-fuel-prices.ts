import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse';
import { createReadStream, existsSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const STAGING_DIR = resolve(
  process.cwd(),
  process.env.FUEL_PRICES_STAGING_DIR || '/tmp/petroldata-v3/staging',
);

const INCLUDE_HISTORICAL = process.env.INCLUDE_HISTORICAL_FUEL_PRICES === 'true';
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 2000);

interface FuelRow {
  fecha_vigencia?: string;
  provincia?: string;
  localidad?: string;
  empresa?: string;
  empresabandera?: string;
  producto?: string;
  precio?: string;
  tipohorario?: string;
  latitud?: string;
  longitud?: string;
  indice_tiempo?: string;
  anio?: string;
  mes?: string;
}

function parseTimestamp(v: string | undefined, fallback?: { year?: string; month?: string }): Date | null {
  if (v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (fallback?.year && fallback.month) {
    const y = Number(fallback.year);
    const m = Number(fallback.month);
    if (Number.isFinite(y) && Number.isFinite(m)) return new Date(Date.UTC(y, m - 1, 1));
  }
  return null;
}

function num(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: string | undefined): string | null {
  if (v === undefined || v === null) return null;
  const s = v.trim();
  return s === '' ? null : s;
}

async function streamCsv(
  filename: string,
  onBatch: (rows: Prisma.FactFuelPriceCreateManyInput[]) => Promise<void>,
): Promise<{ inserted: number; skipped: number }> {
  const path = resolve(STAGING_DIR, filename);
  if (!existsSync(path)) throw new Error(`Fuel price CSV not found: ${path}`);

  const parser = createReadStream(path).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true }),
  );

  let batch: Prisma.FactFuelPriceCreateManyInput[] = [];
  let inserted = 0;
  let skipped = 0;
  for await (const record of parser) {
    const r = record as FuelRow;
    const precio = num(r.precio);
    const fecha = parseTimestamp(r.fecha_vigencia, { year: r.anio, month: r.mes });
    const provincia = str(r.provincia);
    const producto = str(r.producto);
    if (precio === null || !fecha || !provincia || !producto) {
      skipped++;
      continue;
    }
    batch.push({
      fechaVigencia: fecha,
      provincia,
      localidad: str(r.localidad),
      empresa: str(r.empresa),
      empresaBandera: str(r.empresabandera),
      producto,
      precio,
      tipoHorario: str(r.tipohorario),
      latitude: num(r.latitud),
      longitude: num(r.longitud),
    });
    if (batch.length >= BATCH_SIZE) {
      await onBatch(batch);
      inserted += batch.length;
      batch = [];
      if (inserted % 20000 === 0) process.stdout.write(`    ${inserted.toLocaleString()} rows...\n`);
    }
  }
  if (batch.length) {
    await onBatch(batch);
    inserted += batch.length;
  }
  return { inserted, skipped };
}

function findFiles(prefix: string): string[] {
  if (!existsSync(STAGING_DIR)) return [];
  return readdirSync(STAGING_DIR)
    .filter((n) => n.startsWith(prefix) && n.endsWith('.csv'))
    .map((n) => ({ name: n, mtime: statSync(resolve(STAGING_DIR, n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .map((f) => f.name);
}

async function main() {
  const t0 = Date.now();
  console.log(`Seeding fuel prices from: ${STAGING_DIR}`);
  if (!existsSync(STAGING_DIR)) throw new Error(`Staging dir not found: ${STAGING_DIR}`);

  console.log('Clearing fact_fuel_price...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "fact_fuel_price" RESTART IDENTITY');

  const files = findFiles('stg_fuel_prices_');
  if (!files.length) {
    console.log('  no stg_fuel_prices_*.csv files found, nothing to seed');
    return;
  }

  // Heuristic: smallest file is the "current" snapshot, largest is historical.
  // INCLUDE_HISTORICAL=true seeds both.
  const withSize = files.map((n) => ({ name: n, size: statSync(resolve(STAGING_DIR, n)).size }));
  withSize.sort((a, b) => a.size - b.size);
  const toSeed = INCLUDE_HISTORICAL ? withSize : [withSize[0]];

  let totalInserted = 0;
  let totalSkipped = 0;
  for (const f of toSeed) {
    console.log(`  → ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
    const { inserted, skipped } = await streamCsv(f.name, async (rows) => {
      await prisma.factFuelPrice.createMany({ data: rows, skipDuplicates: true });
    });
    totalInserted += inserted;
    totalSkipped += skipped;
    console.log(`     ${inserted.toLocaleString()} inserted, ${skipped} skipped`);
  }

  if (!INCLUDE_HISTORICAL && withSize.length > 1) {
    console.log(`  (historical files skipped — set INCLUDE_HISTORICAL_FUEL_PRICES=true to also seed ${withSize.length - 1} larger file(s))`);
  }

  console.log(`\nDone: ${totalInserted.toLocaleString()} inserted, ${totalSkipped} skipped in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
