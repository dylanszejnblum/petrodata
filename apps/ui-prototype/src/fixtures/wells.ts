/* Pozos simulados de la cuenca Neuquina (~220 puntos alrededor de Añelo).
   GeoJSON como el /api/v1/geo/wells real. */

import { COMPANIES } from './companies'

/* Las operadoras de los pozos salen de las 52 empresas reales del fixture y
   no de las 5 del ranking del dashboard. Con 5 el mapa mentía: la cuenca
   tiene decenas de operadoras y un panel de filtro sobre cinco no filtra
   nada. El sorteo va PESADO por participación nacional, así que YPF aparece
   mucho y las chicas poco, como en la realidad.

   TOP_OPERATORS no se toca: es el ranking real que publica el sitio. */
const POOL = COMPANIES.filter((c) => c.pctNacional > 0)
const PESO_TOTAL = POOL.reduce((s, c) => s + c.pctNacional, 0)
function sortea(r: number) {
  let acc = 0
  const objetivo = r * PESO_TOTAL
  for (const c of POOL) {
    acc += c.pctNacional
    if (acc >= objetivo) return c
  }
  return POOL[POOL.length - 1]
}

export type WellStatus = 'activo' | 'perforacion' | 'abandonado'

export type WellFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    id: string
    name: string
    operator: string
    operatorName: string
    status: WellStatus
    oil: number
    gas: number
  }
}

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry(20260805)

const PADS = ['LCam', 'BPO', 'FdP', 'BSur', 'AgPi', 'LCal', 'SBla', 'ChSa']

export const WELLS: WellFeature[] = Array.from({ length: 220 }, (_, i) => {
  const op = sortea(rnd())
  const r = rnd()
  const status: WellStatus = r < 0.68 ? 'activo' : r < 0.82 ? 'perforacion' : 'abandonado'
  // cluster alrededor de Añelo (-38.35, -68.78) con dispersión hacia la ventana
  const lat = -38.35 + (rnd() - 0.5) * 1.6
  const lng = -68.78 + (rnd() - 0.5) * 2.2
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      id: `w-${i}`,
      name: `${PADS[i % PADS.length]}-${100 + i}(h)`,
      operator: op.slug,
      operatorName: op.name,
      status,
      oil: status === 'activo' ? Math.round(rnd() * 240) : 0,
      gas: status === 'activo' ? Math.round(rnd() * 42 * 10) / 10 : 0,
    },
  }
})

export const WELLS_FC = { type: 'FeatureCollection' as const, features: WELLS }

export const STATUS_COLOR: Record<WellStatus, string> = {
  activo: 'var(--status-positive)',
  perforacion: 'var(--status-caution)',
  abandonado: 'var(--text-tertiary)',
}
