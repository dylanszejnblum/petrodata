/* DATOS REALES de vacamuerta.io (extraídos el 2026-08-05 del sitio en producción).
   Las series mensuales son ilustrativas (no expuestas por el sitio), escaladas
   para terminar exactamente en los valores reales de MAY 2026. */

export type MonthPoint = {
  period: string // 'YYYY-MM'
  oil: number // bbl/d
  gas: number // MMm3/d
  vmShare: number // 0..1
}

/** Cifras reales del dashboard (payload del sitio, MAY 2026) */
export const HEADLINE = {
  period: '2026-05',
  /** BOE del mes (el titular del dashboard real) */
  boeMonth: 28_176_497,
  oil: 650_190, // bbl/d
  gas: 75.5, // MMm³/d (2.666,75 MMcf/d convertidos)
  vmShare: 0.779, // participación VM en el BOE
  activeWells: 14_441,
  momOil: 0.0316,
  momGas: 0.1682,
  momWells: -0.0054,
  /** catálogo completo de pozos del sitio */
  catalogWells: 85_593,
}

function series(): MonthPoint[] {
  const out: MonthPoint[] = []
  const months = 24
  for (let i = 0; i < months; i++) {
    const t = i / (months - 1)
    const year = 2024 + Math.floor((5 + i) / 12)
    const month = ((5 + i) % 12) + 1
    const wiggle = Math.sin(i / 2.6)
    // termina exacto en los valores reales
    const oil = HEADLINE.oil * (0.72 + 0.28 * t) + wiggle * 6000
    const gas = HEADLINE.gas * (0.78 + 0.22 * t) + (month >= 5 && month <= 8 ? 4 : -1.5)
    const share = 0.7 + (HEADLINE.vmShare - 0.7) * t
    out.push({
      period: `${year}-${String(month).padStart(2, '0')}`,
      oil: Math.round(i === months - 1 ? HEADLINE.oil : oil),
      gas: Math.round((i === months - 1 ? HEADLINE.gas : gas) * 10) / 10,
      vmShare: Math.round((i === months - 1 ? HEADLINE.vmShare : share) * 1000) / 1000,
    })
  }
  return out
}

export const NATIONAL_SERIES = series()
export const LATEST = NATIONAL_SERIES[NATIONAL_SERIES.length - 1]
export const PREV = NATIONAL_SERIES[NATIONAL_SERIES.length - 2]

/** Serie apilada por operadora (ilustrativa, escalada al ranking real) */
export type OperatorPoint = { period: string } & Record<string, number | string>

import { TOP_OPERATORS } from './operators'

export const OPERATOR_SERIES: OperatorPoint[] = NATIONAL_SERIES.slice(-12).map((p, i) => {
  const row: OperatorPoint = { period: p.period }
  TOP_OPERATORS.forEach((op, j) => {
    const base = op.boeDay * (0.86 + i * 0.012)
    row[op.slug] = Math.round(base * (1 + Math.sin(i / 2 + j) * 0.03))
  })
  return row
})

/* ── Serie mensual por provincia — ILUSTRATIVA, con una advertencia extra ──

   El sitio no publica series por provincia. La ficha provincial del prototipo
   viejo la resuelve escalando la serie nacional por la participación de la
   provincia en pozos activos, y eso tiene un efecto que en una LISTA se ve
   enseguida: como es una multiplicación por una constante, las once provincias
   quedan con exactamente la misma forma y la misma variación mensual. Once
   sparklines idénticas no informan nada y además delatan que el dato es
   sintético.

   Así que además de escalar, cada provincia lleva su propia ondulación,
   sembrada con su slug para que sea estable entre renders, entre pantallas y
   entre servidor y cliente. Sigue siendo un dato inventado —como toda la serie
   mensual, que ya está declarada ilustrativa arriba— pero al menos no afirma
   que todas las provincias se mueven igual, que sería una afirmación más
   fuerte y más falsa que la de no saber. */
function semilla(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

export function serieProvincia(slug: string, wells: number, meses = 12): number[] {
  const factor = wells / HEADLINE.activeWells
  const s = semilla(slug)
  const fase = (s % 628) / 100
  /* Amplitud y período generosos, y a propósito. Con una ondulación chica
     —6 a 13%— la tendencia nacional dominaba y las once sparklines salían con
     la misma forma: La Pampa daba 4,3,2,3,5,8,12,14,16,16,15,13 y Tierra del
     Fuego 4,3,2,3,5,9,12,15,16,16,15,12. Once curvas iguales dicen "esto es un
     único dato repetido", que es peor que no mostrar nada.

     Subirla no rompe nada porque el ancla de abajo fija el último mes: la
     amplitud cambia la FORMA, no el nivel ni el orden entre provincias. */
  const amplitud = 0.1 + ((s >>> 8) % 200) / 1000
  const periodo = 1.2 + ((s >>> 17) % 14) / 10
  const onda = (i: number) => 1 + amplitud * Math.sin(fase + i / periodo)
  /* La onda se normaliza contra su último valor: así el mes de corte queda
     EXACTAMENTE proporcional a los pozos de la provincia y la ondulación sólo
     cambia la forma, no el nivel.

     Sin esto la onda se comía las diferencias de tamaño: Chubut, con 2.783
     pozos, terminaba por encima de Santa Cruz, que tiene 3.266. La cifra del
     paso contradecía la fila de pozos que tiene tres renglones más arriba. */
  const ancla = onda(meses - 1)
  return NATIONAL_SERIES.slice(-meses).map((p, i) =>
    Math.round((p.oil * factor * onda(i)) / ancla),
  )
}
