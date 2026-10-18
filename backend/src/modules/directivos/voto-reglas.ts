import { createHmac } from 'crypto';

/* Las reglas del voto, sueltas de Nest para poder correrlas sin levantar la
   app. Ver voto-reglas.spec.ts: son cuentas de calendario y de escala, y las
   dos fallan en silencio (un lunes mal calculado no rompe nada, sólo caduca
   los presupuestos el día equivocado). */

/** Votos por semana y por votante. */
export const LIMITE_SEMANAL = 5;

/* CUÁNTO MUEVE UN VOTO, y por qué no es una constante de puntos.

   El frontend tenía PESO_VOTO = 3 puntos por voto, con su propio comentario
   diciendo que eso no sobrevive al volumen: con mil votantes, tres puntos por
   voto rompe la escala del índice —que va de 0 a 100— y el ranking pasa a ser
   un conteo de clics con un índice decorativo al lado.

   Acá el voto tiene un PRESUPUESTO FIJO de puntos que se reparte por posición
   relativa: el más votado de la semana se lleva el máximo, el resto en
   proporción a él. Diez votantes o diez mil dan el mismo rango, así que la
   mezcla entre "lo que produce la empresa" y "lo que opina la gente" no cambia
   sola con el tráfico. */
export const PUNTOS_MAX_VOTO = 6;

/** Lunes de la semana de `d`, a medianoche UTC. Es la clave con la que caduca
    el presupuesto: al cambiar de lunes las filas viejas dejan de contar. */
export function semanaDe(d: Date = new Date()): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dia = (x.getUTCDay() + 6) % 7; // lunes = 0
  x.setUTCDate(x.getUTCDate() - dia);
  return x;
}

/** El día al que pertenece un voto, a medianoche UTC. Es la unidad del corte. */
export function diaDe(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/* La IP no se guarda. Se guarda un HMAC con un secreto del servidor, que es lo
   que hace que la tabla no sea una lista de IPs: sin el secreto no se puede ir
   de una IP a su fila, y el espacio de IPv4 es chico —4.300 millones— así que
   un hash sin clave se revierte con una tabla en un rato.

   Sin VOTE_SALT el endpoint devuelve 503 en vez de arrancar con un secreto
   vacío o uno por proceso: el primero es no tener secreto, y el segundo hace
   que cada reinicio le devuelva a todo el mundo los cinco votos. */
export function hashVotante(ip: string, salt: string): string {
  return createHmac('sha256', salt).update(ip).digest('hex');
}

/** Puntos que el voto le suma (o resta) al índice de cada empresa. */
export function puntosPorVoto(netoPorEmpresa: Map<string, number>): Map<string, number> {
  const maxAbs = Math.max(0, ...[...netoPorEmpresa.values()].map(Math.abs));
  const out = new Map<string, number>();
  if (!maxAbs) return out;
  for (const [slug, neto] of netoPorEmpresa) {
    out.set(slug, (neto / maxAbs) * PUNTOS_MAX_VOTO);
  }
  return out;
}

/* EL VOTANTE ES EL NAVEGADOR, no la IP. En un evento cientos de personas votan
   desde el mismo wifi —la misma IP— y con la IP como votante el presupuesto de
   la semana se lo llevaba el primero; con las operadoras móviles (CGNAT) pasa
   lo mismo todos los días. El navegador genera un UUID al azar, lo guarda y lo
   manda en `x-votante`.

   Lo que esto NO es: una identidad. Una ventana privada o un segundo navegador
   son otro votante. Contra eso hay dos frenos y ninguno es perfecto: Turnstile
   (que frena scripts, no personas) y un techo semanal de votos por IP, alto
   para que un evento entero quepa detrás de una sola. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El id de navegador si viene bien formado; si no, null. */
export function votanteDe(header: unknown): string | null {
  return typeof header === 'string' && UUID.test(header) ? header.toLowerCase() : null;
}

/** Votos por semana desde una misma IP, sumando todos sus navegadores. 5.000 =
    mil personas votando las cinco veces detrás del mismo wifi. */
export function topeSemanalIp(): number {
  return Number(process.env.VOTE_IP_WEEKLY_CAP) || 5000;
}
