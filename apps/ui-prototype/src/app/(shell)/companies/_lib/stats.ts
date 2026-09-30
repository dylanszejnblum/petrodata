import { COMPANIES, type Company } from '@/fixtures/companies'

/* Cifras derivadas del ranking de empresas. TODAS salen de sumas sobre
   src/fixtures/companies.ts (scrape del 2026-08-11): no hay ningún número
   inventado ni traído de otra fuente.

   Dos guardas de honestidad, porque son los únicos lugares donde este
   dataset puede hacernos mentir:
   1. Las columnas NO suman 100 (producción 99,0 · valor 98,0) por
      redondeo: cualquier acumulada declara su base, nunca inventa el resto.
   2. No existe la categoría "extranjera vs local": no es un campo de la
      fixture y clasificar a mano sería inventar dato. */

/** Umbral para considerar a una empresa "grande" y comparar sus ratios. */
export const UMBRAL_GRANDE = 1

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** El ranking se ordena por participación en la producción nacional
    (decisión de Mariano, 2026-08-11: antes ordenaba por cantidad de pozos,
    lo que dejaba a la 2ª productora del país en la fila 19). */
export const RANKED: Company[] = [...COMPANIES].sort((a, b) => b.pctNacional - a.pctNacional)

/** Puesto por empresa, calculado sobre el set COMPLETO: no se renumera
    al filtrar ni al buscar (el puesto es de la empresa, no de la vista). */
export const RANK_BY_SLUG: Record<string, number> = Object.fromEntries(
  RANKED.map((c, i) => [c.slug, i + 1]),
)

const grandes = RANKED.filter((c) => c.pctNacional >= UMBRAL_GRANDE)
const cola = RANKED.filter((c) => c.pctNacional < UMBRAL_GRANDE)
const cotizan = RANKED.filter((c) => c.isPublic)
export const STATS = {
  empresas: COMPANIES.length,
  /** las que superan el umbral: 11 empresas */
  grandes: grandes.length,
  pctGrandes: suma(grandes.map((c) => c.pctNacional)),
  /** la cola larga: 41 empresas */
  cola: cola.length,
  pctCola: suma(cola.map((c) => c.pctNacional)),
  pozosCola: suma(cola.map((c) => c.proyectos)),
  /** sin producción declarada pero con pozos operados */
  sinProduccion: RANKED.filter((c) => c.pctNacional === 0).length,
  pozosSinProduccion: suma(RANKED.filter((c) => c.pctNacional === 0).map((c) => c.proyectos)),
  cotizan: cotizan.length,
  pctCotizan: suma(cotizan.map((c) => c.pctNacional)),
  pctValorCotizan: suma(cotizan.map((c) => c.pctValor)),
  top10: suma(RANKED.slice(0, 10).map((c) => c.pctNacional)),
  /** base real de la columna: no suma 100 por redondeo */
  baseNacional: suma(COMPANIES.map((c) => c.pctNacional)),
}

export type Productividad = {
  slug: string
  name: string
  pozos: number
  pctNacional: number
  /** puntos de producción nacional por cada 100 pozos operados */
  por100: number
  /** para el logo de la fila */
  website?: string
  logoUrl?: string
}

/** Cuánta producción aporta cada 100 pozos: entre las grandes varía casi
    veinte veces, que es la razón por la que "más pozos" no es "más producción". */
export const PRODUCTIVIDAD: Productividad[] = grandes
  .map((c) => ({
    slug: c.slug,
    name: c.name,
    pozos: c.proyectos,
    pctNacional: c.pctNacional,
    por100: (c.pctNacional / c.proyectos) * 100,
    website: c.website,
    logoUrl: c.logoUrl,
  }))
  .sort((a, b) => b.por100 - a.por100)

/** Las que cotizan, ordenadas por producción. */
export const COTIZAN = cotizan
