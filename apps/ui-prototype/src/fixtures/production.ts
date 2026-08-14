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
