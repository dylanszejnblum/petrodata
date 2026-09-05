import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

// Quien dirige cada empresa del ranking. El CSV está en el repo para que cada
// fila lleve su fuente — mismo criterio que rigi_projects.csv: ningún dato
// editorial hardcodeado en código.
//
// De dónde salió: el pipeline de CEOS cruza las 50 primeras empresas del sitio
// con búsqueda y verificación manual; cruzan 48 y cubren el 97,6% del valor de
// la producción del país. `confirmed` es true en 45 de 48; el resto son cargos
// que una sola fuente sugiere y que nadie verificó contra otra.
//
// LAS FOTOS NO SE SIEMBRAN ACÁ. `photo_url` queda en NULL y lo escribe
// scripts/upload-executive-photos.ts al subirlas al bucket, para que volver a
// correr esta semilla no borre las que ya están cargadas.
const CSV_PATH = resolve(__dirname, 'data', 'company_executives.csv');

interface ExecRow {
  company_slug: string;
  name: string;
  role: string;
  confirmed: string;
  source_url: string;
  source_date: string;
  in_role_since: string;
  bio: string;
}

const date = (v: string): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

async function main() {
  const t0 = Date.now();
  if (!existsSync(CSV_PATH)) throw new Error(`company_executives.csv not found at ${CSV_PATH}`);

  const rows = parse(readFileSync(CSV_PATH, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ExecRow[];

  // Toda empresa referenciada tiene que existir: una fila huérfana sería un
  // directivo de una empresa que el ranking no muestra, invisible y sin forma
  // de notarlo. Se avisa y se saltea, no se inventa la empresa.
  const known = new Set(
    (await prisma.company.findMany({ select: { slug: true } })).map((c) => c.slug),
  );

  let upserted = 0;
  const huerfanas: string[] = [];
  for (const r of rows) {
    if (!r.company_slug || !r.name || !r.role) continue;
    if (!known.has(r.company_slug)) {
      huerfanas.push(r.company_slug);
      continue;
    }
    const data = {
      name: r.name,
      role: r.role,
      confirmed: r.confirmed === 'true',
      sourceUrl: r.source_url || null,
      sourceDate: date(r.source_date),
      inRoleSince: r.in_role_since || null,
      bio: r.bio || null,
    };
    await prisma.companyExecutive.upsert({
      where: { companySlug: r.company_slug },
      create: { companySlug: r.company_slug, ...data },
      update: data, // photoUrl queda intacto a propósito
    });
    upserted++;
  }

  if (huerfanas.length) {
    console.warn(`  ⚠ directivos sin empresa en company: ${huerfanas.join(', ')}`);
  }
  console.log(
    `  Directivos: ${upserted}/${rows.length} upserted in ${((Date.now() - t0) / 1000).toFixed(2)}s`,
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
