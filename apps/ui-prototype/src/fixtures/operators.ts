/* DATOS REALES de vacamuerta.io (2026-08-05). */

export type Operator = {
  slug: string
  name: string
  ticker?: string
  /** BOE del mes (ranking real del dashboard, MAY 2026) */
  boeMonth: number
  /** BOE por día (derivado: boeMonth / 31) */
  boeDay: number
  color: string
}

const op = (slug: string, name: string, boeMonth: number, color: string, ticker?: string): Operator => ({
  slug,
  name,
  boeMonth,
  boeDay: Math.round(boeMonth / 31),
  color,
  ticker,
})

/** Ranking real del dashboard — "Operadores principales · BOE" */
export const TOP_OPERATORS: Operator[] = [
  op('ypf', 'YPF S.A.', 17_016_667, '#2382cf', 'YPF'),
  op('pluspetrol', 'PLUSPETROL S.A.', 5_238_190, '#3fb883'),
  op('pampa', 'PAMPA ENERGIA S.A.', 3_563_997, '#9a7420', 'PAM'),
  op('shell', 'SHELL ARGENTINA S.A.', 1_225_597, '#dd4136', 'SHEL'),
  op('pecom_servicios_energia_sau', 'PECOM SERVICIOS ENERGIA SAU', 1_132_046, '#7c7977'),
]

export const OPERATORS = TOP_OPERATORS

/** Productores de petróleo (sección 05 de /indicadores, datos 2026-04) */
export const OIL_PRODUCERS: { name: string; bbld: number; sharePct: number }[] = [
  { name: 'YPF S.A.', bbld: 329_176, sharePct: 39.5 },
  { name: 'PLUSPETROL S.A.', bbld: 52_967, sharePct: 11.0 },
  { name: 'TECPETROL S.A.', bbld: 22_655, sharePct: 10.4 },
  { name: 'PAMPA ENERGIA S.A.', bbld: 20_564, sharePct: 8.1 },
  { name: 'VISTA ENERGY ARGENTINA SAU', bbld: 79_922, sharePct: 7.4 },
  { name: 'PAN AMERICAN ENERGY SL', bbld: 25_624, sharePct: 6.8 },
  { name: 'TOTAL AUSTRAL S.A.', bbld: 2_677, sharePct: 5.9 },
  { name: 'SHELL ARGENTINA S.A.', bbld: 31_217, sharePct: 3.3 },
]
