import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { getObject, s3ConfigFromEnv, signedRequest } from '../src/common/s3';

/* Sube una carpeta de imágenes al bucket. La firma SigV4 vive en
 * src/common/s3.ts, compartida con el backend que después las sirve.
 *
 *   S3_ENDPOINT=https://s3-….sslip.io S3_BUCKET=vacamuerta-assets \
 *   S3_ACCESS_KEY_ID=GK… S3_SECRET_ACCESS_KEY=… \
 *   pnpm assets:upload ../frontend-v2/public/images/ceos directivos
 *
 * Sube sólo lo que cambió: compara el MD5 local contra el ETag remoto, que en
 * Garage es el MD5 para subidas simples. */

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function main() {
  const [dir, prefijo = ''] = process.argv.slice(2);
  if (!dir) throw new Error('Uso: pnpm assets:upload <carpeta> [prefijo]');

  const cfg = s3ConfigFromEnv();
  if (!cfg) throw new Error('Faltan S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY');

  const archivos = readdirSync(dir).filter(
    (f) => statSync(join(dir, f)).isFile() && extname(f).toLowerCase() in TIPOS,
  );
  if (!archivos.length) throw new Error(`No hay imágenes en ${dir}`);

  let subidos = 0;
  let iguales = 0;
  for (const nombre of archivos) {
    const cuerpo = readFileSync(join(dir, nombre));
    const key = prefijo ? `${prefijo.replace(/\/$/, '')}/${nombre}` : nombre;
    const md5 = createHash('md5').update(cuerpo).digest('hex');

    const actual = await getObject(cfg, key).catch(() => null);
    if (actual?.etag?.replace(/"/g, '') === md5) {
      iguales++;
      continue;
    }

    const { url, init } = signedRequest(cfg, 'PUT', key, {
      body: cuerpo,
      headers: {
        'content-type': TIPOS[extname(nombre).toLowerCase()],
        // El nombre lleva el slug y no cambia; si cambia la cara, cambia el
        // archivo y hay que purgar. Un año es lo que aguanta un asset así.
        'cache-control': 'public, max-age=31536000',
      },
    });
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`PUT ${key} → ${res.status} ${(await res.text()).slice(0, 300)}`);
    subidos++;
  }

  console.log(`  Assets: ${subidos} subidos, ${iguales} sin cambios → ${cfg.bucket}/${prefijo}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
