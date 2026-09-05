import { createHash, createHmac } from 'crypto';

/* Firma SigV4 y lectura de objetos de un bucket S3 (Garage).
 *
 * A mano con `crypto` y `fetch` en vez del SDK de AWS: son cuarenta líneas
 * contra una dependencia de decenas de megas, para un GET y un PUT. Si la firma
 * sale mal el servidor contesta 403 «Invalid signature», así que no falla en
 * silencio.
 *
 * Lo usan el backend (para servir las fotos de los directivos) y
 * scripts/upload-assets.ts (para subirlas). Una sola implementación: firmar es
 * exactamente el tipo de código que no conviene tener dos veces. */

const SERVICE = 's3';

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const hmac = (k: Buffer | string, d: string) => createHmac('sha256', k).update(d).digest();

/* RFC 3986: sin escapar sólo A-Za-z0-9-._~ — que es lo que pide SigV4 y NO lo
   que hace encodeURIComponent, que deja pasar !'()*. */
export const encodeSeg = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/** Config desde el entorno. Null si falta algo — el que llama decide qué hacer. */
export function s3ConfigFromEnv(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, region: process.env.S3_REGION ?? 'garage' };
}

/** URL de un objeto, con la clave ya codificada segmento por segmento. */
export function objectUrl(cfg: S3Config, key: string): URL {
  const path = [cfg.bucket, ...key.split('/')].map(encodeSeg).join('/');
  return new URL(`${cfg.endpoint}/${path}`);
}

export function signHeaders(
  cfg: S3Config,
  method: string,
  url: URL,
  headers: Record<string, string>,
  payloadHash: string,
  fecha = new Date(),
): Record<string, string> {
  const amzDate = fecha.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dia = amzDate.slice(0, 8);
  const scope = `${dia}/${cfg.region}/${SERVICE}/aws4_request`;

  const h: Record<string, string> = {
    ...headers,
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const claves = Object.keys(h)
    .map((k) => k.toLowerCase())
    .sort();
  const canonHeaders = claves.map((k) => `${k}:${String(h[k]).trim()}\n`).join('');
  const signed = claves.join(';');

  /* `url.pathname` YA viene codificado (ver objectUrl): se firma tal cual.
     Volver a codificarlo acá era el bug que rompía los nombres con `@2x` —se
     firmaban como %402x y fetch mandaba el @ literal, y Garage contestaba
     «Invalid signature» sin decir por qué. */
  const canonRequest = [method, url.pathname, '', canonHeaders, signed, payloadHash].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonRequest)].join('\n');

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dia);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return {
    ...h,
    Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
  };
}

export function signedRequest(
  cfg: S3Config,
  method: 'GET' | 'HEAD' | 'PUT',
  key: string,
  opts: { headers?: Record<string, string>; body?: Buffer } = {},
): { url: URL; init: RequestInit } {
  const url = objectUrl(cfg, key);
  const payloadHash = sha256(opts.body ?? '');
  const headers = signHeaders(cfg, method, url, opts.headers ?? {}, payloadHash);
  return {
    url,
    init: { method, headers, ...(opts.body ? { body: new Uint8Array(opts.body) } : {}) },
  };
}

/** GET de un objeto. Devuelve null si no está (404). Lanza en cualquier otro error. */
export async function getObject(
  cfg: S3Config,
  key: string,
): Promise<{ body: Buffer; contentType: string; etag: string | null } | null> {
  const { url, init } = signedRequest(cfg, 'GET', key);
  const res = await fetch(url, init);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${key} → ${res.status} ${(await res.text()).slice(0, 200)}`);
  return {
    body: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    etag: res.headers.get('etag'),
  };
}
