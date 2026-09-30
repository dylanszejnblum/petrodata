/* DATOS REALES de vacamuerta.io/indicadores (2026-08-05). */

/** Valor de un día de Vaca Muerta */
export const DAY_VALUE = {
  perDayMUSD: 61.0,
  perYearBUSD: 22.3,
  pbiPct: 3.5,
  pbiYear: 2024,
}

export const BRENT = {
  value: 79.5,
  avg12m: 78.7,
  breakeven: 45, // US$/bbl (YPF, Vaca Muerta)
  marginOverBreakeven: 34.5,
  oilOnlyYearBUSD: 22.7,
  oilOnlyDayMUSD: 62.2,
}

/** La formación Vaca Muerta dentro del total nacional (datos 2026-04) */
export const VM = {
  oilSharePct: 69.3,
  gasSharePct: 67.5,
  wells: 3_996,
  oilBbld: 620_249,
  oilYoY: 0.387,
  wellsYoY: 0.125,
  dataDate: '2026-04',
}

/** La tesis en seis datos (todos Confirmado) */
export const TESIS: { label: string; value: string; yoy?: string; asOf: string }[] = [
  { label: 'Producción de petróleo VM', value: '620.249 bbl/d', yoy: '+38,7%', asOf: '2026-04' },
  { label: 'Participación en petróleo nacional', value: '69,3%', asOf: '2026-04' },
  { label: 'Participación en gas nacional', value: '67,5%', asOf: '2026-04' },
  { label: 'Pozos activos en VM', value: '3.996 pozos', yoy: '+12,5%', asOf: '2026-04' },
  { label: 'Exportaciones de energía (anual)', value: 'US$ 11,1B', yoy: '+14,2%', asOf: '2026-05' },
  { label: 'Superávit comercial energético (anual)', value: 'US$ 7,8B', yoy: '+36,6%', asOf: '2026-05' },
]

/** Contribución económica por operadora (ventana 2025-06 a 2026-05) */
export const CONTRIBUTION_TOTALS = {
  valorBrutoBUSD: 22.3,
  regaliasBUSD: 2.67,
  exportacionesBUSD: 13,
}

export const CONTRIBUTION: {
  operator: string
  partBoePct: number
  partUsdPct: number
  valorMUSD: number
  regaliasMUSD: number
  expoMUSD: number
}[] = [
  { operator: 'YPF S.A.', partBoePct: 34.2, partUsdPct: 45.6, valorMUSD: 10_200, regaliasMUSD: 1_220, expoMUSD: 4_440 },
  { operator: 'PAN AMERICAN ENERGY SL', partBoePct: 10.9, partUsdPct: 10.9, valorMUSD: 2_420, regaliasMUSD: 290, expoMUSD: 1_420 },
  { operator: 'PLUSPETROL S.A.', partBoePct: 8.4, partUsdPct: 7.7, valorMUSD: 1_720, regaliasMUSD: 207, expoMUSD: 1_090 },
  { operator: 'VISTA ENERGY ARGENTINA SAU', partBoePct: 4.4, partUsdPct: 7.7, valorMUSD: 1_710, regaliasMUSD: 205, expoMUSD: 575 },
  { operator: 'SHELL ARGENTINA S.A.', partBoePct: 2.4, partUsdPct: 3.9, valorMUSD: 873, regaliasMUSD: 105, expoMUSD: 309 },
  { operator: 'TECPETROL S.A.', partBoePct: 7.7, partUsdPct: 2.4, valorMUSD: 535, regaliasMUSD: 64.2, expoMUSD: 996 },
  { operator: 'PAMPA ENERGIA S.A.', partBoePct: 5.8, partUsdPct: 2.2, valorMUSD: 483, regaliasMUSD: 58, expoMUSD: 754 },
  { operator: 'CHEVRON ARGENTINA S.R.L.', partBoePct: 1.5, partUsdPct: 2.1, valorMUSD: 458, regaliasMUSD: 55, expoMUSD: 197 },
]

/** Argentina en el mundo — petróleo crudo (EIA · 2025) */
export const WORLD_OIL = {
  todayRank: 21,
  todayKbbld: 794,
  projectedRank: 15,
  projectedKbbld: 1_500,
  top: [
    { name: 'United States', kbbld: 13_586 },
    { name: 'Russia', kbbld: 9_885 },
    { name: 'Saudi Arabia', kbbld: 9_556 },
    { name: 'Canada', kbbld: 4_964 },
    { name: 'Iraq', kbbld: 4_388 },
    { name: 'China', kbbld: 4_325 },
    { name: 'Iran', kbbld: 4_051 },
    { name: 'United Arab Emirates', kbbld: 3_771 },
    { name: 'Brazil', kbbld: 3_769 },
    { name: 'Kuwait', kbbld: 2_584 },
  ],
}

/** Proyectos RIGI de petróleo y gas (Registro RIGI · 2026-06) */
export const RIGI = {
  totalBUSD: 11.2,
  projects: [
    { name: 'GNL Argentina LNG (Southern Energy / PAE–Golar)', busd: 6.9, sponsor: 'Pan American Energy / Golar LNG · Río Negro', kind: 'gas' },
    { name: 'Vaca Muerta Oleoducto Sur (VMOS)', busd: 2.5, sponsor: 'YPF y socios · Río Negro', kind: 'petróleo' },
    { name: 'Gasoducto San Matías (Southern Energy)', busd: 1.3, sponsor: 'Southern Energy · Río Negro', kind: 'gas' },
    { name: 'Ampliación Gasoducto Perito Moreno', busd: 0.6, sponsor: 'TGS · Neuquén', kind: 'gas' },
  ],
}

/** Infraestructura de transporte (Secretaría de Energía · ENARGAS · 2024) */
export const TRANSPORT = {
  totalKm: 30_712,
  gasKm: 19_413,
  oilKm: 11_299,
  gasByOperator: [
    { name: 'TGS', km: 9_734 },
    { name: 'TGN', km: 7_230 },
    { name: 'Atacama', km: 530 },
    { name: 'Nor Andino', km: 375 },
    { name: 'GasAndes', km: 313 },
    { name: 'Gas del Pacífico', km: 297 },
  ],
}

/** Breakeven ilustrativo (serie no expuesta): termina en el valor real US$45 */
export const BREAKEVEN = Array.from({ length: 10 }, (_, i) => ({
  year: 2017 + i,
  usdBbl: Math.round(70 - i * 2.8) === 45 ? 45 : Math.round(70 - i * 2.8),
}))

/** Exportaciones — vacamuerta.io/exportaciones (reales) */
export const EXPORTS_SUMMARY = {
  totalBUSD: 17.1,
  sectors: [
    { name: 'Petróleo', busd: 8.5, sharePct: 49.9 },
    { name: 'Gas', busd: 3.2, sharePct: 18.8 },
    { name: 'Minería', busd: 5.35, sharePct: 31.4 },
  ],
}
