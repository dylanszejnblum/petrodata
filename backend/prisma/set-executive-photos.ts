import { PrismaClient } from '@prisma/client';
import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

/* Marca qué directivo tiene cara, guardando la CLAVE del objeto en el bucket.
 *
 * NO guarda una URL pública, y eso es a propósito: el bucket es privado y las
 * fotos se sirven por GET /api/v2/directivos/:slug/foto. Garage publica por
 * Host y el proxy de este server no tiene ruta ni certificado para
 * `<bucket>.web-….sslip.io`, así que una URL de bucket habría quedado atada a
 * un hostname que no existe.
 *
 *   pnpm assets:upload ../frontend-v2/public/images/ceos directivos
 *   pnpm db:photos
 *
 * QUÉ SE CONSIDERA "TIENE CARA": que el .jpg esté en la carpeta local. Esa
 * carpeta es la lista curada —32 de 48—, con el criterio escrito en su
 * .gitignore: cada cara tiene atrás una foto base que es una foto real DE ESA
 * PERSONA. Se retiraron 16 que no lo cumplían. Si algún día el bucket es la
 * fuente y no la carpeta, lo que hay que mover es esa curaduría, no el listado.
 *
 * Las que no tienen archivo quedan en NULL y la lista cae al monograma sola.
 */
const FOTOS_DIR = resolve(
  __dirname,
  '..',
  '..',
  'frontend-v2',
  'public',
  'images',
  'ceos',
);

const PREFIJO = 'directivos';

async function main() {
  if (!existsSync(FOTOS_DIR)) throw new Error(`No existe ${FOTOS_DIR}`);

  // Sólo la base 1x: el @2x es la variante retina del mismo slug, no otra cara.
  const slugs = new Set(
    readdirSync(FOTOS_DIR)
      .filter((f) => f.endsWith('.jpg') && !f.includes('@2x'))
      .map((f) => f.replace(/\.jpg$/, '')),
  );

  const execs = await prisma.companyExecutive.findMany({ select: { companySlug: true } });
  let conFoto = 0;
  let sinFoto = 0;
  for (const { companySlug } of execs) {
    const tiene = slugs.has(companySlug);
    await prisma.companyExecutive.update({
      where: { companySlug },
      data: { photoUrl: tiene ? `${PREFIJO}/${companySlug}.jpg` : null },
    });
    tiene ? conFoto++ : sinFoto++;
  }

  const huerfanas = [...slugs].filter((s) => !execs.some((e) => e.companySlug === s));
  if (huerfanas.length) {
    console.warn(`  ⚠ fotos sin directivo: ${huerfanas.join(', ')}`);
  }
  console.log(`  Fotos: ${conFoto} con cara, ${sinFoto} al monograma (prefijo ${PREFIJO}/)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
