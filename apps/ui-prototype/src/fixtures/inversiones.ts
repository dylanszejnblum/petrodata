/* DATOS REALES de vacamuerta.io/indicadores (payload RSC del 2026-08-07).
   Copia 1:1 del sitio en producción — NO editar a mano los números:
   se regeneran re-scrapeando el sitio. */

import type { InvKpi, InvMundo } from '@/app/(shell)/indicadores/_lib/types'

/* eslint-disable */
export const ASOF = '2026-04'

export const KPIS: InvKpi[] = [
 {
  "id": "produccion_vm",
  "label": "Producción de petróleo VM",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 620249.4200000018
  },
  "delta": {
   "pct": 38.70008614731385,
   "base": "YoY"
  },
  "format": {
   "suffix": " bbl/d",
   "decimals": 0
  },
  "source": {
   "label": "Secretaría de Energía — Producción de pozos",
   "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
   "asOf": "2026-04"
  }
 },
 {
  "id": "participacion_petroleo",
  "label": "Participación en petróleo",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 69.26691164887767
  },
  "format": {
   "suffix": "%",
   "decimals": 1
  },
  "source": {
   "label": "Secretaría de Energía — Producción de pozos",
   "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
   "asOf": "2026-04"
  }
 },
 {
  "id": "participacion_gas",
  "label": "Participación en gas",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 67.48040348483482
  },
  "format": {
   "suffix": "%",
   "decimals": 1
  },
  "source": {
   "label": "Secretaría de Energía — Producción de pozos",
   "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
   "asOf": "2026-04"
  }
 },
 {
  "id": "pozos_activos",
  "label": "Pozos activos en VM",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 3996
  },
  "delta": {
   "pct": 12.5,
   "base": "YoY"
  },
  "format": {
   "suffix": " pozos",
   "decimals": 0
  },
  "source": {
   "label": "Secretaría de Energía — Producción de pozos",
   "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
   "asOf": "2026-04"
  }
 },
 {
  "id": "exportaciones_energia",
  "label": "Exportaciones de energía",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 11.10016311483
  },
  "delta": {
   "pct": 14.233489372088359,
   "base": "YoY"
  },
  "format": {
   "prefix": "US$",
   "suffix": "B",
   "decimals": 1
  },
  "source": {
   "label": "INDEC — Intercambio Comercial Argentino (ICA)",
   "url": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40",
   "asOf": "2026-05"
  }
 },
 {
  "id": "superavit_energia",
  "label": "Superávit energético (anual)",
  "tier": "confirmado",
  "figure": {
   "kind": "point",
   "value": 7.82906310358
  },
  "delta": {
   "pct": 36.632974047978344,
   "base": "YoY"
  },
  "format": {
   "prefix": "US$",
   "suffix": "B",
   "decimals": 1
  },
  "source": {
   "label": "INDEC — Intercambio Comercial Argentino (ICA)",
   "url": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40",
   "asOf": "2026-05"
  }
 }
]

export const BREAKEVEN = {
 "brentUsd": 81.89,
 "brentAsOf": "2026-08-07 11:25 UTC",
 "referenceUsd": 45,
 "headroomUsd": 36.89,
 "tier": "confirmado",
 "series": [
  {
   "date": "2024-04-01",
   "value": 89.94
  },
  {
   "date": "2024-05-01",
   "value": 81.75
  },
  {
   "date": "2024-06-01",
   "value": 82.25
  },
  {
   "date": "2024-07-01",
   "value": 85.15
  },
  {
   "date": "2024-08-01",
   "value": 80.36
  },
  {
   "date": "2024-09-01",
   "value": 74.02
  },
  {
   "date": "2024-10-01",
   "value": 75.63
  },
  {
   "date": "2024-11-01",
   "value": 74.35
  },
  {
   "date": "2024-12-01",
   "value": 73.86
  },
  {
   "date": "2025-01-01",
   "value": 79.27
  },
  {
   "date": "2025-02-01",
   "value": 75.44
  },
  {
   "date": "2025-03-01",
   "value": 72.73
  },
  {
   "date": "2025-04-01",
   "value": 68.13
  },
  {
   "date": "2025-05-01",
   "value": 64.45
  },
  {
   "date": "2025-06-01",
   "value": 71.44
  },
  {
   "date": "2025-07-01",
   "value": 71.04
  },
  {
   "date": "2025-08-01",
   "value": 67.87
  },
  {
   "date": "2025-09-01",
   "value": 67.99
  },
  {
   "date": "2025-10-01",
   "value": 64.54
  },
  {
   "date": "2025-11-01",
   "value": 63.8
  },
  {
   "date": "2025-12-01",
   "value": 62.54
  },
  {
   "date": "2026-01-01",
   "value": 66.6
  },
  {
   "date": "2026-02-01",
   "value": 70.89
  },
  {
   "date": "2026-03-01",
   "value": 103.13
  },
  {
   "date": "2026-04-01",
   "value": 117.29
  },
  {
   "date": "2026-08-07",
   "value": 81.89
  }
 ],
 "source": {
  "label": "Yahoo Finance — Brent (BZ=F), tiempo real",
  "url": "https://finance.yahoo.com/quote/BZ=F",
  "asOf": "2026-08-07 11:25 UTC"
 },
 "referenceSource": {
  "label": "YPF (breakeven Vaca Muerta ~US$45/bbl)",
  "url": "https://www.ypf.com/inversoresaccionistas/Paginas/informacion-financiera.aspx"
 }
}

export const SERIE = {
 "title": "Producción de petróleo en Vaca Muerta",
 "unit": "bbl/d",
 "points": [
  {
   "period": "2023-01",
   "oilBblD": 300242.3999999999,
   "gasMm3D": 73.36469999999994,
   "preliminary": false
  },
  {
   "period": "2023-02",
   "oilBblD": 278700.7299999996,
   "gasMm3D": 67.3227,
   "preliminary": false
  },
  {
   "period": "2023-03",
   "oilBblD": 316459.5999999999,
   "gasMm3D": 74.70319999999995,
   "preliminary": false
  },
  {
   "period": "2023-04",
   "oilBblD": 301849.4999999999,
   "gasMm3D": 73.00990000000004,
   "preliminary": false
  },
  {
   "period": "2023-05",
   "oilBblD": 312583.66,
   "gasMm3D": 81.36899999999997,
   "preliminary": false
  },
  {
   "period": "2023-06",
   "oilBblD": 296953.6900000001,
   "gasMm3D": 82.74750000000004,
   "preliminary": false
  },
  {
   "period": "2023-07",
   "oilBblD": 307137.4999999998,
   "gasMm3D": 86.13250000000002,
   "preliminary": false
  },
  {
   "period": "2023-08",
   "oilBblD": 313834.7299999999,
   "gasMm3D": 92.48800000000003,
   "preliminary": false
  },
  {
   "period": "2023-09",
   "oilBblD": 311537.2299999999,
   "gasMm3D": 88.53790000000002,
   "preliminary": false
  },
  {
   "period": "2023-10",
   "oilBblD": 340786.58,
   "gasMm3D": 75.44519999999991,
   "preliminary": false
  },
  {
   "period": "2023-11",
   "oilBblD": 345422.2099999998,
   "gasMm3D": 76.74520000000001,
   "preliminary": false
  },
  {
   "period": "2023-12",
   "oilBblD": 369759.58,
   "gasMm3D": 68.99559999999997,
   "preliminary": false
  },
  {
   "period": "2024-01",
   "oilBblD": 363177.6999999998,
   "gasMm3D": 77.21190000000001,
   "preliminary": false
  },
  {
   "period": "2024-02",
   "oilBblD": 346611.4599999998,
   "gasMm3D": 78.44790000000003,
   "preliminary": false
  },
  {
   "period": "2024-03",
   "oilBblD": 378360.5299999998,
   "gasMm3D": 85.0381,
   "preliminary": false
  },
  {
   "period": "2024-04",
   "oilBblD": 369284.4899999999,
   "gasMm3D": 84.17649999999996,
   "preliminary": false
  },
  {
   "period": "2024-05",
   "oilBblD": 385146.08,
   "gasMm3D": 100.9712,
   "preliminary": false
  },
  {
   "period": "2024-06",
   "oilBblD": 379915.4799999999,
   "gasMm3D": 96.5635,
   "preliminary": false
  },
  {
   "period": "2024-07",
   "oilBblD": 405741.3099999998,
   "gasMm3D": 105.2986,
   "preliminary": false
  },
  {
   "period": "2024-08",
   "oilBblD": 422973.4299999999,
   "gasMm3D": 105.2715,
   "preliminary": false
  },
  {
   "period": "2024-09",
   "oilBblD": 391914.9599999997,
   "gasMm3D": 95.48710000000003,
   "preliminary": false
  },
  {
   "period": "2024-10",
   "oilBblD": 441777.6300000001,
   "gasMm3D": 83.74919999999995,
   "preliminary": false
  },
  {
   "period": "2024-11",
   "oilBblD": 443459.1299999998,
   "gasMm3D": 77.27029999999999,
   "preliminary": false
  },
  {
   "period": "2024-12",
   "oilBblD": 468539.61,
   "gasMm3D": 78.84249999999999,
   "preliminary": false
  },
  {
   "period": "2025-01",
   "oilBblD": 463450.1299999999,
   "gasMm3D": 88.14040000000007,
   "preliminary": false
  },
  {
   "period": "2025-02",
   "oilBblD": 419043.7399999991,
   "gasMm3D": 84.53480000000006,
   "preliminary": false
  },
  {
   "period": "2025-03",
   "oilBblD": 466728.4300000004,
   "gasMm3D": 84.72500000000002,
   "preliminary": false
  },
  {
   "period": "2025-04",
   "oilBblD": 447187.4799999996,
   "gasMm3D": 84.5197,
   "preliminary": false
  },
  {
   "period": "2025-05",
   "oilBblD": 468479.58,
   "gasMm3D": 98.49470000000011,
   "preliminary": false
  },
  {
   "period": "2025-06",
   "oilBblD": 481578.8799999999,
   "gasMm3D": 105.1485,
   "preliminary": false
  },
  {
   "period": "2025-07",
   "oilBblD": 531104.1400000006,
   "gasMm3D": 110.5688,
   "preliminary": false
  },
  {
   "period": "2025-08",
   "oilBblD": 549528.9500000002,
   "gasMm3D": 109.3054000000001,
   "preliminary": false
  },
  {
   "period": "2025-09",
   "oilBblD": 552011.9400000004,
   "gasMm3D": 88.93179999999995,
   "preliminary": false
  },
  {
   "period": "2025-10",
   "oilBblD": 592138.0700000003,
   "gasMm3D": 79.18789999999998,
   "preliminary": false
  },
  {
   "period": "2025-11",
   "oilBblD": 581408.3500000006,
   "gasMm3D": 76.68410000000002,
   "preliminary": false
  },
  {
   "period": "2025-12",
   "oilBblD": 614764.6099999999,
   "gasMm3D": 88.7586999999999,
   "preliminary": false
  },
  {
   "period": "2026-01",
   "oilBblD": 624032.2300000008,
   "gasMm3D": 88.7563000000002,
   "preliminary": false
  },
  {
   "period": "2026-02",
   "oilBblD": 555469.2500000003,
   "gasMm3D": 85.21540000000023,
   "preliminary": false
  },
  {
   "period": "2026-03",
   "oilBblD": 621947.3699999999,
   "gasMm3D": 98.53650000000002,
   "preliminary": false
  },
  {
   "period": "2026-04",
   "oilBblD": 620249.4199999999,
   "gasMm3D": 94.89450000000011,
   "preliminary": false
  },
  {
   "period": "2026-05",
   "oilBblD": 482105.5299999997,
   "gasMm3D": 62.83359999999992,
   "preliminary": true
  }
 ],
 "source": {
  "label": "Secretaría de Energía — Producción de pozos",
  "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
  "asOf": "2026-04"
 }
}

export const ACTIVIDAD = {
 "unit": "pozos/mes",
 "source": {
  "label": "Secretaría de Energía — Producción de pozos",
  "url": "https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo",
  "asOf": "2026-04"
 },
 "points": [
  {
   "period": "2023-02",
   "nuevosPozos": 65,
   "preliminary": false
  },
  {
   "period": "2023-03",
   "nuevosPozos": 33,
   "preliminary": false
  },
  {
   "period": "2023-04",
   "nuevosPozos": 30,
   "preliminary": false
  },
  {
   "period": "2023-05",
   "nuevosPozos": 32,
   "preliminary": false
  },
  {
   "period": "2023-06",
   "nuevosPozos": 40,
   "preliminary": false
  },
  {
   "period": "2023-07",
   "nuevosPozos": 44,
   "preliminary": false
  },
  {
   "period": "2023-08",
   "nuevosPozos": 45,
   "preliminary": false
  },
  {
   "period": "2023-09",
   "nuevosPozos": 41,
   "preliminary": false
  },
  {
   "period": "2023-10",
   "nuevosPozos": 37,
   "preliminary": false
  },
  {
   "period": "2023-11",
   "nuevosPozos": 50,
   "preliminary": false
  },
  {
   "period": "2023-12",
   "nuevosPozos": 43,
   "preliminary": false
  },
  {
   "period": "2024-01",
   "nuevosPozos": 29,
   "preliminary": false
  },
  {
   "period": "2024-02",
   "nuevosPozos": 47,
   "preliminary": false
  },
  {
   "period": "2024-03",
   "nuevosPozos": 48,
   "preliminary": false
  },
  {
   "period": "2024-04",
   "nuevosPozos": 33,
   "preliminary": false
  },
  {
   "period": "2024-05",
   "nuevosPozos": 40,
   "preliminary": false
  },
  {
   "period": "2024-06",
   "nuevosPozos": 49,
   "preliminary": false
  },
  {
   "period": "2024-07",
   "nuevosPozos": 46,
   "preliminary": false
  },
  {
   "period": "2024-08",
   "nuevosPozos": 42,
   "preliminary": false
  },
  {
   "period": "2024-09",
   "nuevosPozos": 50,
   "preliminary": false
  },
  {
   "period": "2024-10",
   "nuevosPozos": 43,
   "preliminary": false
  },
  {
   "period": "2024-11",
   "nuevosPozos": 16,
   "preliminary": false
  },
  {
   "period": "2024-12",
   "nuevosPozos": 37,
   "preliminary": false
  },
  {
   "period": "2025-01",
   "nuevosPozos": 33,
   "preliminary": false
  },
  {
   "period": "2025-02",
   "nuevosPozos": 35,
   "preliminary": false
  },
  {
   "period": "2025-03",
   "nuevosPozos": 39,
   "preliminary": false
  },
  {
   "period": "2025-04",
   "nuevosPozos": 59,
   "preliminary": false
  },
  {
   "period": "2025-05",
   "nuevosPozos": 53,
   "preliminary": false
  },
  {
   "period": "2025-06",
   "nuevosPozos": 46,
   "preliminary": false
  },
  {
   "period": "2025-07",
   "nuevosPozos": 51,
   "preliminary": false
  },
  {
   "period": "2025-08",
   "nuevosPozos": 34,
   "preliminary": false
  },
  {
   "period": "2025-09",
   "nuevosPozos": 46,
   "preliminary": false
  },
  {
   "period": "2025-10",
   "nuevosPozos": 54,
   "preliminary": false
  },
  {
   "period": "2025-11",
   "nuevosPozos": 29,
   "preliminary": false
  },
  {
   "period": "2025-12",
   "nuevosPozos": 38,
   "preliminary": false
  },
  {
   "period": "2026-01",
   "nuevosPozos": 32,
   "preliminary": false
  },
  {
   "period": "2026-02",
   "nuevosPozos": 52,
   "preliminary": false
  },
  {
   "period": "2026-03",
   "nuevosPozos": 44,
   "preliminary": false
  },
  {
   "period": "2026-04",
   "nuevosPozos": 49,
   "preliminary": false
  },
  {
   "period": "2026-05",
   "nuevosPozos": 54,
   "preliminary": true
  }
 ]
}

export const CRUCE = {
 "id": "agro_vs_energia",
 "title": "Exportaciones: agro vs energía",
 "unit": "US$",
 "source": {
  "label": "INDEC — Intercambio Comercial Argentino (ICA)",
  "url": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40",
  "asOf": "2026-05"
 },
 "gdpSource": {
  "label": "Banco Mundial (PBI nominal, US$)",
  "url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=AR"
 },
 "points": [
  {
   "period": "1992",
   "agroUsd": 8329631209,
   "energiaUsd": 1081880434,
   "gdpUsd": 228778917308.17,
   "agroPctGdp": 3.640908571037519,
   "energiaPctGdp": 0.47289341462468953,
   "tier": "confirmado"
  },
  {
   "period": "1993",
   "agroUsd": 8203237370,
   "energiaUsd": 1235619404,
   "gdpUsd": 236741715015.015,
   "agroPctGdp": 3.465057845627131,
   "energiaPctGdp": 0.52192719982688,
   "tier": "confirmado"
  },
  {
   "period": "1994",
   "agroUsd": 9541222359,
   "energiaUsd": 1651199843,
   "gdpUsd": 257440000000,
   "agroPctGdp": 3.70619265032629,
   "energiaPctGdp": 0.6413921080640149,
   "tier": "confirmado"
  },
  {
   "period": "1995",
   "agroUsd": 12289611246,
   "energiaUsd": 2169398060,
   "gdpUsd": 258031750000,
   "agroPctGdp": 4.762829088280802,
   "energiaPctGdp": 0.8407484970357331,
   "tier": "confirmado"
  },
  {
   "period": "1996",
   "agroUsd": 14256474193,
   "energiaUsd": 3088592559,
   "gdpUsd": 272149750000,
   "agroPctGdp": 5.238466760671285,
   "energiaPctGdp": 1.1348871564276652,
   "tier": "confirmado"
  },
  {
   "period": "1997",
   "agroUsd": 14809323941,
   "energiaUsd": 3286873883,
   "gdpUsd": 292859000000,
   "agroPctGdp": 5.0568102537398545,
   "energiaPctGdp": 1.122340062282532,
   "tier": "confirmado"
  },
  {
   "period": "1998",
   "agroUsd": 15365298226,
   "energiaUsd": 2444125007,
   "gdpUsd": 298948250000,
   "agroPctGdp": 5.139785305985233,
   "energiaPctGdp": 0.8175746160079547,
   "tier": "confirmado"
  },
  {
   "period": "1999",
   "agroUsd": 13337586985,
   "energiaUsd": 3005388743,
   "gdpUsd": 283523000000,
   "agroPctGdp": 4.704234571798408,
   "energiaPctGdp": 1.0600158516240306,
   "tier": "confirmado"
  },
  {
   "period": "2000",
   "agroUsd": 13209155690,
   "energiaUsd": 4901883553,
   "gdpUsd": 284203750000,
   "agroPctGdp": 4.647776705972388,
   "energiaPctGdp": 1.7247779288626557,
   "tier": "confirmado"
  },
  {
   "period": "2001",
   "agroUsd": 13512134614,
   "energiaUsd": 4724948137,
   "gdpUsd": 268696750000,
   "agroPctGdp": 5.028767416799794,
   "energiaPctGdp": 1.7584686591854946,
   "tier": "confirmado"
  },
  {
   "period": "2002",
   "agroUsd": 13410431579,
   "energiaUsd": 4638835300,
   "gdpUsd": 97724004251.8602,
   "agroPctGdp": 13.722761036723204,
   "energiaPctGdp": 4.74687394925459,
   "tier": "confirmado"
  },
  {
   "period": "2003",
   "agroUsd": 16475114749,
   "energiaUsd": 5416773741,
   "gdpUsd": 127586973492.177,
   "agroPctGdp": 12.912850190000135,
   "energiaPctGdp": 4.2455539094139025,
   "tier": "confirmado"
  },
  {
   "period": "2004",
   "agroUsd": 18778328677,
   "energiaUsd": 6181025856,
   "gdpUsd": 164657930452.787,
   "agroPctGdp": 11.404448376924295,
   "energiaPctGdp": 3.75385858367284,
   "tier": "confirmado"
  },
  {
   "period": "2005",
   "agroUsd": 21251908346,
   "energiaUsd": 7150056322,
   "gdpUsd": 198737095012.282,
   "agroPctGdp": 10.693478409094501,
   "energiaPctGdp": 3.597746219224008,
   "tier": "confirmado"
  },
  {
   "period": "2006",
   "agroUsd": 23890313676,
   "energiaUsd": 7812990769,
   "gdpUsd": 232557260817.308,
   "agroPctGdp": 10.272873696585082,
   "energiaPctGdp": 3.3595987248653216,
   "tier": "confirmado"
  },
  {
   "period": "2007",
   "agroUsd": 31698644815.27,
   "energiaUsd": 6948878045.47,
   "gdpUsd": 287530508430.568,
   "agroPctGdp": 11.024445714749081,
   "energiaPctGdp": 2.4167446033463245,
   "tier": "confirmado"
  },
  {
   "period": "2008",
   "agroUsd": 40107714418.32,
   "energiaUsd": 7847757056.97,
   "gdpUsd": 361558037110.419,
   "agroPctGdp": 11.09302250307084,
   "energiaPctGdp": 2.1705386829980253,
   "tier": "confirmado"
  },
  {
   "period": "2009",
   "agroUsd": 30481799919.45,
   "energiaUsd": 6456604585.54,
   "gdpUsd": 332976484577.619,
   "agroPctGdp": 9.154340120479135,
   "energiaPctGdp": 1.9390572261372179,
   "tier": "confirmado"
  },
  {
   "period": "2010",
   "agroUsd": 37819668031.99,
   "energiaUsd": 6525161897.95,
   "gdpUsd": 423627422092.49,
   "agroPctGdp": 8.92757788086081,
   "energiaPctGdp": 1.5403067784703914,
   "tier": "confirmado"
  },
  {
   "period": "2011",
   "agroUsd": 47509146859.07,
   "energiaUsd": 6681679813.55,
   "gdpUsd": 530158122010.442,
   "agroPctGdp": 8.961316423656386,
   "energiaPctGdp": 1.2603182967775786,
   "tier": "confirmado"
  },
  {
   "period": "2012",
   "agroUsd": 45821692653.86,
   "energiaUsd": 6978016447.78,
   "gdpUsd": 545982375701.128,
   "agroPctGdp": 8.392522303493346,
   "energiaPctGdp": 1.2780662450539946,
   "tier": "confirmado"
  },
  {
   "period": "2013",
   "agroUsd": 44766662496.98,
   "energiaUsd": 5561574483.33,
   "gdpUsd": 552025140252.246,
   "agroPctGdp": 8.109533286205775,
   "energiaPctGdp": 1.007485724434336,
   "tier": "confirmado"
  },
  {
   "period": "2014",
   "agroUsd": 40637917182.29,
   "energiaUsd": 4942604989.14,
   "gdpUsd": 526319673731.638,
   "agroPctGdp": 7.72114728187239,
   "energiaPctGdp": 0.9390880173824084,
   "tier": "confirmado"
  },
  {
   "period": "2015",
   "agroUsd": 36588760062.1,
   "energiaUsd": 2245622992.2,
   "gdpUsd": 594749285413.212,
   "agroPctGdp": 6.151963686123531,
   "energiaPctGdp": 0.3775747272465936,
   "tier": "confirmado"
  },
  {
   "period": "2016",
   "agroUsd": 39039817385.4,
   "energiaUsd": 2034711496.5,
   "gdpUsd": 557532320662.955,
   "agroPctGdp": 7.002251876443364,
   "energiaPctGdp": 0.3649495143313932,
   "tier": "confirmado"
  },
  {
   "period": "2017",
   "agroUsd": 37376000000,
   "energiaUsd": 2477000000,
   "gdpUsd": 643628393281.364,
   "agroPctGdp": 5.807077560616716,
   "energiaPctGdp": 0.38484939848158195,
   "tier": "confirmado"
  },
  {
   "period": "2018",
   "agroUsd": 36966000000,
   "energiaUsd": 4200000000,
   "gdpUsd": 524819892360.176,
   "agroPctGdp": 7.043559235866538,
   "energiaPctGdp": 0.8002745439225087,
   "tier": "confirmado"
  },
  {
   "period": "2019",
   "agroUsd": 41483000000,
   "energiaUsd": 4421000000,
   "gdpUsd": 447754683615.225,
   "agroPctGdp": 9.264671374302841,
   "energiaPctGdp": 0.9873710229682727,
   "tier": "confirmado"
  },
  {
   "period": "2020",
   "agroUsd": 37991000000,
   "energiaUsd": 3593000000,
   "gdpUsd": 385740508436.965,
   "agroPctGdp": 9.848848946132454,
   "energiaPctGdp": 0.9314551936893977,
   "tier": "confirmado"
  },
  {
   "period": "2021",
   "agroUsd": 52735000000,
   "energiaUsd": 5284000000,
   "gdpUsd": 486564085480.036,
   "agroPctGdp": 10.838243424393424,
   "energiaPctGdp": 1.0859823315538986,
   "tier": "confirmado"
  },
  {
   "period": "2022",
   "agroUsd": 56884000000,
   "energiaUsd": 8509000000,
   "gdpUsd": 633993756301.08,
   "agroPctGdp": 8.972328108068325,
   "energiaPctGdp": 1.3421267820749838,
   "tier": "confirmado"
  },
  {
   "period": "2023",
   "agroUsd": 38234365334.19,
   "energiaUsd": 7910657621.92,
   "gdpUsd": 649461687959.174,
   "agroPctGdp": 5.887085573028207,
   "energiaPctGdp": 1.21803299079549,
   "tier": "confirmado"
  },
  {
   "period": "2024",
   "agroUsd": 47932155844.43,
   "energiaUsd": 9717083121.46,
   "gdpUsd": 638365455340.04,
   "agroPctGdp": 7.5085760740135665,
   "energiaPctGdp": 1.5221818536975769,
   "tier": "confirmado"
  },
  {
   "period": "2025",
   "agroUsd": 52615871154.84,
   "energiaUsd": 11100163114.83,
   "gdpUsd": null,
   "agroPctGdp": null,
   "energiaPctGdp": null,
   "tier": "confirmado"
  }
 ]
}

export const OPERADORES = [
 {
  "slug": "ypf",
  "name": "YPF S.A.",
  "oilBblD": 329176.1999999998,
  "boe": 14186817.27,
  "sharePct": 39.47191127062597
 },
 {
  "slug": "pluspetrol",
  "name": "PLUSPETROL S.A.",
  "oilBblD": 52967.47999999998,
  "boe": 3949755.379999999,
  "sharePct": 10.989384788208914
 },
 {
  "slug": "tecpetrol",
  "name": "TECPETROL S.A.",
  "oilBblD": 22655.02000000001,
  "boe": 3754146.740000001,
  "sharePct": 10.445143840087663
 },
 {
  "slug": "pampa",
  "name": "PAMPA ENERGIA S.A.",
  "oilBblD": 20563.79,
  "boe": 2900071.879999998,
  "sharePct": 8.068855596516565
 },
 {
  "slug": "vista",
  "name": "VISTA ENERGY ARGENTINA SAU",
  "oilBblD": 79921.80999999997,
  "boe": 2645398.150000001,
  "sharePct": 7.360278141672161
 },
 {
  "slug": "pae",
  "name": "PAN AMERICAN ENERGY SL",
  "oilBblD": 25623.99999999999,
  "boe": 2454625.719999999,
  "sharePct": 6.829492956628201
 },
 {
  "slug": "totalenergies",
  "name": "TOTAL AUSTRAL S.A.",
  "oilBblD": 2677.34,
  "boe": 2110199.14,
  "sharePct": 5.871196592738748
 },
 {
  "slug": "shell",
  "name": "SHELL ARGENTINA S.A.",
  "oilBblD": 31216.78999999999,
  "boe": 1172014.5,
  "sharePct": 3.2608901257728724
 }
]

export const MUNDO: InvMundo = {
 "source": {
  "label": "EIA — International Energy Statistics (producción por país)",
  "url": "https://www.eia.gov/international/data/world"
 },
 "rankings": [
  {
   "product": "oil",
   "label": "Petróleo crudo",
   "unit": "TBPD",
   "year": 2025,
   "countries": 98,
   "source": {
    "label": "EIA — International Energy Statistics (producción por país)",
    "url": "https://www.eia.gov/international/data/world",
    "asOf": "2025"
   },
   "argentina": {
    "rank": 21,
    "value": 794.0044469152623
   },
   "projected": {
    "value": 1500,
    "rank": 15,
    "year": 2030,
    "tier": "proyectado"
   },
   "top": [
    {
     "rank": 1,
     "iso3": "USA",
     "country": "United States",
     "value": 13586.08690410959,
     "isArgentina": false
    },
    {
     "rank": 2,
     "iso3": "RUS",
     "country": "Russia",
     "value": 9885.10903296257,
     "isArgentina": false
    },
    {
     "rank": 3,
     "iso3": "SAU",
     "country": "Saudi Arabia",
     "value": 9556.054035616438,
     "isArgentina": false
    },
    {
     "rank": 4,
     "iso3": "CAN",
     "country": "Canada",
     "value": 4964.104353424657,
     "isArgentina": false
    },
    {
     "rank": 5,
     "iso3": "IRQ",
     "country": "Iraq",
     "value": 4388.068493150685,
     "isArgentina": false
    },
    {
     "rank": 6,
     "iso3": "CHN",
     "country": "China",
     "value": 4324.684931506849,
     "isArgentina": false
    },
    {
     "rank": 7,
     "iso3": "IRN",
     "country": "Iran",
     "value": 4051.424657534247,
     "isArgentina": false
    },
    {
     "rank": 8,
     "iso3": "ARE",
     "country": "United Arab Emirates",
     "value": 3771.219178082192,
     "isArgentina": false
    },
    {
     "rank": 9,
     "iso3": "BRA",
     "country": "Brazil",
     "value": 3769.407010164946,
     "isArgentina": false
    },
    {
     "rank": 10,
     "iso3": "KWT",
     "country": "Kuwait",
     "value": 2583.54794520548,
     "isArgentina": false
    },
    {
     "rank": 11,
     "iso3": "KAZ",
     "country": "Kazakhstan",
     "value": 2046.610159015274,
     "isArgentina": false
    },
    {
     "rank": 12,
     "iso3": "NOR",
     "country": "Norway",
     "value": 1858.498407342466,
     "isArgentina": false
    },
    {
     "rank": 21,
     "iso3": "ARG",
     "country": "Argentina",
     "value": 794.0044469152623,
     "isArgentina": true
    }
   ],
   "history": [
    {
     "year": 2000,
     "rank": 20,
     "value": 800.8231038251366,
     "countries": 88
    },
    {
     "year": 2001,
     "rank": 20,
     "value": 825.6981753424658,
     "countries": 88
    },
    {
     "year": 2002,
     "rank": 22,
     "value": 800.3786328767123,
     "countries": 88
    },
    {
     "year": 2003,
     "rank": 24,
     "value": 740.250202739726,
     "countries": 87
    },
    {
     "year": 2004,
     "rank": 24,
     "value": 694.8500819672131,
     "countries": 95
    },
    {
     "year": 2005,
     "rank": 24,
     "value": 664.6936109589041,
     "countries": 95
    },
    {
     "year": 2006,
     "rank": 25,
     "value": 660.7966301369863,
     "countries": 97
    },
    {
     "year": 2007,
     "rank": 26,
     "value": 653.1839150684932,
     "countries": 97
    },
    {
     "year": 2008,
     "rank": 26,
     "value": 661.2152377049181,
     "countries": 97
    },
    {
     "year": 2009,
     "rank": 28,
     "value": 628.8054739726027,
     "countries": 97
    },
    {
     "year": 2010,
     "rank": 28,
     "value": 613.3419616438356,
     "countries": 97
    },
    {
     "year": 2011,
     "rank": 26,
     "value": 576.0272712328767,
     "countries": 98
    },
    {
     "year": 2012,
     "rank": 28,
     "value": 551.1197896174864,
     "countries": 99
    },
    {
     "year": 2013,
     "rank": 28,
     "value": 539.9405095890411,
     "countries": 99
    },
    {
     "year": 2014,
     "rank": 28,
     "value": 532.1596794520548,
     "countries": 99
    },
    {
     "year": 2015,
     "rank": 28,
     "value": 532.2395178082191,
     "countries": 99
    },
    {
     "year": 2016,
     "rank": 28,
     "value": 510.5054398907104,
     "countries": 99
    },
    {
     "year": 2017,
     "rank": 29,
     "value": 479.6305892688958,
     "countries": 97
    },
    {
     "year": 2018,
     "rank": 29,
     "value": 489.5134259473776,
     "countries": 97
    },
    {
     "year": 2019,
     "rank": 29,
     "value": 507.4001762541271,
     "countries": 98
    },
    {
     "year": 2020,
     "rank": 27,
     "value": 480.339388187215,
     "countries": 98
    },
    {
     "year": 2021,
     "rank": 27,
     "value": 513.5619013428797,
     "countries": 98
    },
    {
     "year": 2022,
     "rank": 26,
     "value": 582.667458490306,
     "countries": 97
    },
    {
     "year": 2023,
     "rank": 23,
     "value": 635.3171681731327,
     "countries": 97
    },
    {
     "year": 2024,
     "rank": 22,
     "value": 700.7792575954543,
     "countries": 98
    },
    {
     "year": 2025,
     "rank": 21,
     "value": 794.0044469152623,
     "countries": 98
    }
   ]
  },
  {
   "product": "gas",
   "label": "Gas natural",
   "unit": "BCF",
   "year": 2024,
   "countries": 96,
   "source": {
    "label": "EIA — International Energy Statistics (producción por país)",
    "url": "https://www.eia.gov/international/data/world",
    "asOf": "2024"
   },
   "argentina": {
    "rank": 16,
    "value": 1652.02428
   },
   "projected": {
    "value": 2300,
    "rank": 14,
    "year": 2030,
    "tier": "proyectado"
   },
   "top": [
    {
     "rank": 1,
     "iso3": "USA",
     "country": "United States",
     "value": 37766.605374,
     "isArgentina": false
    },
    {
     "rank": 2,
     "iso3": "RUS",
     "country": "Russia",
     "value": 22673.46303,
     "isArgentina": false
    },
    {
     "rank": 3,
     "iso3": "IRN",
     "country": "Iran",
     "value": 9852.843534,
     "isArgentina": false
    },
    {
     "rank": 4,
     "iso3": "CHN",
     "country": "China",
     "value": 9126.850389,
     "isArgentina": false
    },
    {
     "rank": 5,
     "iso3": "CAN",
     "country": "Canada",
     "value": 7025.930409,
     "isArgentina": false
    },
    {
     "rank": 6,
     "iso3": "QAT",
     "country": "Qatar",
     "value": 6001.884083,
     "isArgentina": false
    },
    {
     "rank": 7,
     "iso3": "AUS",
     "country": "Australia",
     "value": 5374.054641,
     "isArgentina": false
    },
    {
     "rank": 8,
     "iso3": "NOR",
     "country": "Norway",
     "value": 4623.324901,
     "isArgentina": false
    },
    {
     "rank": 9,
     "iso3": "SAU",
     "country": "Saudi Arabia",
     "value": 4357.305617,
     "isArgentina": false
    },
    {
     "rank": 10,
     "iso3": "DZA",
     "country": "Algeria",
     "value": 3489.26846,
     "isArgentina": false
    },
    {
     "rank": 11,
     "iso3": "MYS",
     "country": "Malaysia",
     "value": 2845.572693,
     "isArgentina": false
    },
    {
     "rank": 12,
     "iso3": "TKM",
     "country": "Turkmenistan",
     "value": 2740.42072,
     "isArgentina": false
    },
    {
     "rank": 16,
     "iso3": "ARG",
     "country": "Argentina",
     "value": 1652.02428,
     "isArgentina": true
    }
   ],
   "history": [
    {
     "year": 2000,
     "rank": 15,
     "value": 1321.13415,
     "countries": 87
    },
    {
     "year": 2001,
     "rank": 15,
     "value": 1311.5991,
     "countries": 86
    },
    {
     "year": 2002,
     "rank": 16,
     "value": 1275.22465,
     "countries": 87
    },
    {
     "year": 2003,
     "rank": 15,
     "value": 1449.3276,
     "countries": 87
    },
    {
     "year": 2004,
     "rank": 15,
     "value": 1584.9372,
     "countries": 88
    },
    {
     "year": 2005,
     "rank": 17,
     "value": 1611.42345,
     "countries": 91
    },
    {
     "year": 2006,
     "rank": 19,
     "value": 1628.0215,
     "countries": 93
    },
    {
     "year": 2007,
     "rank": 19,
     "value": 1583.17145,
     "countries": 92
    },
    {
     "year": 2008,
     "rank": 19,
     "value": 1555.9789,
     "countries": 92
    },
    {
     "year": 2009,
     "rank": 19,
     "value": 1460.69903,
     "countries": 93
    },
    {
     "year": 2010,
     "rank": 22,
     "value": 1416.1315,
     "countries": 94
    },
    {
     "year": 2011,
     "rank": 24,
     "value": 1369.16255,
     "countries": 94
    },
    {
     "year": 2012,
     "rank": 25,
     "value": 1329.2566,
     "countries": 94
    },
    {
     "year": 2013,
     "rank": 24,
     "value": 1255.8014,
     "countries": 94
    },
    {
     "year": 2014,
     "rank": 24,
     "value": 1253.6825,
     "countries": 97
    },
    {
     "year": 2015,
     "rank": 24,
     "value": 1285.466,
     "countries": 98
    },
    {
     "year": 2016,
     "rank": 20,
     "value": 1386.6779302,
     "countries": 97
    },
    {
     "year": 2017,
     "rank": 20,
     "value": 1444.8765558,
     "countries": 97
    },
    {
     "year": 2018,
     "rank": 18,
     "value": 1481.61671,
     "countries": 99
    },
    {
     "year": 2019,
     "rank": 18,
     "value": 1544.098794,
     "countries": 100
    },
    {
     "year": 2020,
     "rank": 18,
     "value": 1423.004627,
     "countries": 100
    },
    {
     "year": 2021,
     "rank": 18,
     "value": 1434.369508,
     "countries": 98
    },
    {
     "year": 2022,
     "rank": 17,
     "value": 1562.431063,
     "countries": 96
    },
    {
     "year": 2023,
     "rank": 17,
     "value": 1532.4676,
     "countries": 97
    },
    {
     "year": 2024,
     "rank": 16,
     "value": 1652.02428,
     "countries": 96
    }
   ]
  }
 ],
 "fastestGrowing": [
  {
   "product": "oil",
   "label": "Petróleo crudo",
   "unit": "TBPD",
   "sinceYear": 2020,
   "toYear": 2025,
   "leaders": [
    {
     "iso3": "LBY",
     "country": "Libya",
     "from": 408.0737704918033,
     "to": 1363.041095890411,
     "growthPct": 234.01830611354853,
     "isArgentina": false
    },
    {
     "iso3": "VEN",
     "country": "Venezuela",
     "from": 527.0628415300547,
     "to": 968.3698630136986,
     "growthPct": 83.72948853737002,
     "isArgentina": false
    },
    {
     "iso3": "ARG",
     "country": "Argentina",
     "from": 480.339388187215,
     "to": 794.0044469152623,
     "growthPct": 65.30071579426557,
     "isArgentina": true
    },
    {
     "iso3": "IRN",
     "country": "Iran",
     "from": 2512.991803278689,
     "to": 4051.424657534247,
     "growthPct": 61.21917517790435,
     "isArgentina": false
    },
    {
     "iso3": "GAB",
     "country": "Gabon",
     "from": 173.6338797814208,
     "to": 239.3150684931507,
     "growthPct": 37.82740372697583,
     "isArgentina": false
    },
    {
     "iso3": "BRA",
     "country": "Brazil",
     "from": 2939.950036300069,
     "to": 3769.407010164946,
     "growthPct": 28.213301710009663,
     "isArgentina": false
    },
    {
     "iso3": "ARE",
     "country": "United Arab Emirates",
     "from": 3122.754098360656,
     "to": 3771.219178082192,
     "growthPct": 20.765806698066903,
     "isArgentina": false
    },
    {
     "iso3": "USA",
     "country": "United States",
     "from": 11307.56284699453,
     "to": 13586.08690410959,
     "growthPct": 20.15044345051486,
     "isArgentina": false
    }
   ],
   "argentinaRank": 3,
   "source": {
    "label": "EIA — International Energy Statistics (producción por país)",
    "url": "https://www.eia.gov/international/data/world",
    "asOf": "2025"
   }
  },
  {
   "product": "gas",
   "label": "Gas natural",
   "unit": "BCF",
   "sinceYear": 2019,
   "toYear": 2024,
   "leaders": [
    {
     "iso3": "ISR",
     "country": "Israel",
     "from": 363.2441105,
     "to": 940.4237422,
     "growthPct": 158.89579900016028,
     "isArgentina": false
    },
    {
     "iso3": "AZE",
     "country": "Azerbaijan",
     "from": 814.8903746,
     "to": 1337.547935,
     "growthPct": 64.13838924733327,
     "isArgentina": false
    },
    {
     "iso3": "CHN",
     "country": "China",
     "from": 6332.548363,
     "to": 9126.850389,
     "growthPct": 44.12602740354309,
     "isArgentina": false
    },
    {
     "iso3": "VEN",
     "country": "Venezuela",
     "from": 702.2743063,
     "to": 898.0486073,
     "growthPct": 27.87718406379634,
     "isArgentina": false
    },
    {
     "iso3": "KAZ",
     "country": "Kazakhstan",
     "from": 819.0568267,
     "to": 1033.451606,
     "growthPct": 26.17581250910293,
     "isArgentina": false
    },
    {
     "iso3": "OMN",
     "country": "Oman",
     "from": 1281.236722,
     "to": 1566.181981,
     "growthPct": 22.239860449457193,
     "isArgentina": false
    },
    {
     "iso3": "IRN",
     "country": "Iran",
     "from": 8294.078736,
     "to": 9852.843534,
     "growthPct": 18.79370630078861,
     "isArgentina": false
    },
    {
     "iso3": "CAN",
     "country": "Canada",
     "from": 6068.211941,
     "to": 7025.930409,
     "growthPct": 15.782548093436807,
     "isArgentina": false
    },
    {
     "iso3": "ARG",
     "country": "Argentina",
     "from": 1544.098794,
     "to": 1652.02428,
     "growthPct": 6.989545385267627,
     "isArgentina": true
    }
   ],
   "argentinaRank": 18,
   "source": {
    "label": "EIA — International Energy Statistics (producción por país)",
    "url": "https://www.eia.gov/international/data/world",
    "asOf": "2024"
   }
  }
 ],
 "shale": {
  "oilRank": 4,
  "gasRank": 2,
  "note": "Vaca Muerta concentra el 2.º recurso de shale gas y el 4.º de shale oil técnicamente recuperable del mundo.",
  "tier": "referencia",
  "source": {
   "label": "EIA — Technically Recoverable Shale Oil and Shale Gas Resources (2013)",
   "url": "https://www.eia.gov/analysis/studies/worldshalegas/"
  }
 },
 "politica": {
  "intro": {
   "title": "La política que convierte potencial en producción",
   "text": "El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial."
  },
  "charts": [
   {
    "id": "inflacion",
    "title": "Inflación mensual",
    "unit": "%/mes",
    "kind": "area",
    "source": {
     "label": "INDEC — IPC variación mensual (Nivel General Nacional)",
     "url": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31",
     "asOf": "2026-05"
    },
    "points": [
     {
      "period": "2023-01",
      "value": 6.0279
     },
     {
      "period": "2023-02",
      "value": 6.6277
     },
     {
      "period": "2023-03",
      "value": 7.6752
     },
     {
      "period": "2023-04",
      "value": 8.4027
     },
     {
      "period": "2023-05",
      "value": 7.7728
     },
     {
      "period": "2023-06",
      "value": 5.9508
     },
     {
      "period": "2023-07",
      "value": 6.3449
     },
     {
      "period": "2023-08",
      "value": 12.4416
     },
     {
      "period": "2023-09",
      "value": 12.7498
     },
     {
      "period": "2023-10",
      "value": 8.3017
     },
     {
      "period": "2023-11",
      "value": 12.8107
     },
     {
      "period": "2023-12",
      "value": 25.4657
     },
     {
      "period": "2024-01",
      "value": 20.6142
     },
     {
      "period": "2024-02",
      "value": 13.2407
     },
     {
      "period": "2024-03",
      "value": 11.0097
     },
     {
      "period": "2024-04",
      "value": 8.8319
     },
     {
      "period": "2024-05",
      "value": 4.2
     },
     {
      "period": "2024-06",
      "value": 4.5771
     },
     {
      "period": "2024-07",
      "value": 4.0309
     },
     {
      "period": "2024-08",
      "value": 4.1723
     },
     {
      "period": "2024-09",
      "value": 3.4692
     },
     {
      "period": "2024-10",
      "value": 2.6917
     },
     {
      "period": "2024-11",
      "value": 2.4266
     },
     {
      "period": "2024-12",
      "value": 2.7041
     },
     {
      "period": "2025-01",
      "value": 2.211
     },
     {
      "period": "2025-02",
      "value": 2.4016
     },
     {
      "period": "2025-03",
      "value": 3.7293
     },
     {
      "period": "2025-04",
      "value": 2.7808
     },
     {
      "period": "2025-05",
      "value": 1.5011
     },
     {
      "period": "2025-06",
      "value": 1.6189
     },
     {
      "period": "2025-07",
      "value": 1.9017
     },
     {
      "period": "2025-08",
      "value": 1.8758
     },
     {
      "period": "2025-09",
      "value": 2.076
     },
     {
      "period": "2025-10",
      "value": 2.3419
     },
     {
      "period": "2025-11",
      "value": 2.4729
     },
     {
      "period": "2025-12",
      "value": 2.8453
     },
     {
      "period": "2026-01",
      "value": 2.8816
     },
     {
      "period": "2026-02",
      "value": 2.8963
     },
     {
      "period": "2026-03",
      "value": 3.3826
     },
     {
      "period": "2026-04",
      "value": 2.5822
     },
     {
      "period": "2026-05",
      "value": 2.15
     }
    ]
   },
   {
    "id": "fx",
    "title": "Tipo de cambio mayorista (A3500)",
    "unit": "ARS/USD",
    "kind": "line",
    "source": {
     "label": "BCRA — Tipo de Cambio Mayorista (Com. A 3500)",
     "url": "https://www.bcra.gob.ar/",
     "asOf": "2026-06"
    },
    "points": [
     {
      "period": "2023-01",
      "value": 186.875
     },
     {
      "period": "2023-02",
      "value": 197.1533
     },
     {
      "period": "2023-03",
      "value": 208.9883
     },
     {
      "period": "2023-04",
      "value": 222.575
     },
     {
      "period": "2023-05",
      "value": 239.325
     },
     {
      "period": "2023-06",
      "value": 256.675
     },
     {
      "period": "2023-07",
      "value": 275.2833
     },
     {
      "period": "2023-08",
      "value": 350.0167
     },
     {
      "period": "2023-09",
      "value": 350.0083
     },
     {
      "period": "2023-10",
      "value": 350.0083
     },
     {
      "period": "2023-11",
      "value": 360.525
     },
     {
      "period": "2023-12",
      "value": 808.4833
     },
     {
      "period": "2024-01",
      "value": 826.25
     },
     {
      "period": "2024-02",
      "value": 842.25
     },
     {
      "period": "2024-03",
      "value": 857.4167
     },
     {
      "period": "2024-04",
      "value": 876.75
     },
     {
      "period": "2024-05",
      "value": 895.25
     },
     {
      "period": "2024-06",
      "value": 911.75
     },
     {
      "period": "2024-07",
      "value": 932.75
     },
     {
      "period": "2024-08",
      "value": 952.8333
     },
     {
      "period": "2024-09",
      "value": 970.9167
     },
     {
      "period": "2024-10",
      "value": 990.75
     },
     {
      "period": "2024-11",
      "value": 1011.75
     },
     {
      "period": "2024-12",
      "value": 1032.5
     },
     {
      "period": "2025-01",
      "value": 1053.5
     },
     {
      "period": "2025-02",
      "value": 1064.375
     },
     {
      "period": "2025-03",
      "value": 1073.875
     },
     {
      "period": "2025-04",
      "value": 1172
     },
     {
      "period": "2025-05",
      "value": 1195.3333
     },
     {
      "period": "2025-06",
      "value": 1194.0833
     },
     {
      "period": "2025-07",
      "value": 1351.8333
     },
     {
      "period": "2025-08",
      "value": 1323.8333
     },
     {
      "period": "2025-09",
      "value": 1366.5833
     },
     {
      "period": "2025-10",
      "value": 1443
     },
     {
      "period": "2025-11",
      "value": 1450.75
     },
     {
      "period": "2025-12",
      "value": 1459.4167
     },
     {
      "period": "2026-01",
      "value": 1447.6657
     },
     {
      "period": "2026-02",
      "value": 1408.9662
     },
     {
      "period": "2026-03",
      "value": 1382.7578
     },
     {
      "period": "2026-04",
      "value": 1381.0954
     },
     {
      "period": "2026-05",
      "value": 1410.2904
     },
     {
      "period": "2026-06",
      "value": 1439.2199
     }
    ]
   },
   {
    "id": "fiscal",
    "title": "Resultado primario mensual (SPN)",
    "unit": "ARS millones",
    "kind": "bar",
    "source": {
     "label": "Secretaría de Hacienda — Resultado primario (IMIG)",
     "url": "https://www.argentina.gob.ar/economia/sechacienda",
     "asOf": "2026-04"
    },
    "points": [
     {
      "period": "2023-01",
      "value": -203938.3
     },
     {
      "period": "2023-02",
      "value": -228134
     },
     {
      "period": "2023-03",
      "value": -257855.5
     },
     {
      "period": "2023-04",
      "value": -331372.8
     },
     {
      "period": "2023-05",
      "value": -247650.9
     },
     {
      "period": "2023-06",
      "value": -611742.5
     },
     {
      "period": "2023-07",
      "value": -334366
     },
     {
      "period": "2023-08",
      "value": -36964.4
     },
     {
      "period": "2023-09",
      "value": -380473.4
     },
     {
      "period": "2023-10",
      "value": -330338.2
     },
     {
      "period": "2023-11",
      "value": -210484.4
     },
     {
      "period": "2023-12",
      "value": -1991316.1
     },
     {
      "period": "2024-01",
      "value": 2010745.5
     },
     {
      "period": "2024-02",
      "value": 1232524.5
     },
     {
      "period": "2024-03",
      "value": 625034.1
     },
     {
      "period": "2024-04",
      "value": 264951.6
     },
     {
      "period": "2024-05",
      "value": 2332205.4
     },
     {
      "period": "2024-06",
      "value": 488568.8
     },
     {
      "period": "2024-07",
      "value": 908252.5
     },
     {
      "period": "2024-08",
      "value": 899660
     },
     {
      "period": "2024-09",
      "value": 816447.1
     },
     {
      "period": "2024-10",
      "value": 746920.5
     },
     {
      "period": "2024-11",
      "value": 1381545.4
     },
     {
      "period": "2024-12",
      "value": -1301045.8
     },
     {
      "period": "2025-01",
      "value": 2434865.3
     },
     {
      "period": "2025-02",
      "value": 1176915.3
     },
     {
      "period": "2025-03",
      "value": 745339.5
     },
     {
      "period": "2025-04",
      "value": 845949.1
     },
     {
      "period": "2025-05",
      "value": 1696917.4
     },
     {
      "period": "2025-06",
      "value": 790532.9
     },
     {
      "period": "2025-07",
      "value": 1749385.5
     },
     {
      "period": "2025-08",
      "value": 1556864
     },
     {
      "period": "2025-09",
      "value": 696965.1
     },
     {
      "period": "2025-10",
      "value": 823924.8
     },
     {
      "period": "2025-11",
      "value": 2128009.4
     },
     {
      "period": "2025-12",
      "value": -2876449.6
     },
     {
      "period": "2026-01",
      "value": 3125737.3
     },
     {
      "period": "2026-02",
      "value": 1410639.7
     },
     {
      "period": "2026-03",
      "value": 930284.1
     },
     {
      "period": "2026-04",
      "value": 632844.1
     }
    ]
   },
   {
    "id": "superavit_energia",
    "title": "Superávit comercial energético",
    "unit": "US$ MM",
    "kind": "bar",
    "source": {
     "label": "INDEC — Intercambio Comercial Argentino (ICA)",
     "url": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40",
     "asOf": "2025"
    },
    "points": [
     {
      "period": "2018",
      "value": -2355
     },
     {
      "period": "2019",
      "value": -26
     },
     {
      "period": "2020",
      "value": 953
     },
     {
      "period": "2021",
      "value": -558
     },
     {
      "period": "2022",
      "value": -4359
     },
     {
      "period": "2023",
      "value": -13.3643316
     },
     {
      "period": "2024",
      "value": 5729.99538225
     },
     {
      "period": "2025",
      "value": 7829.06310358
     }
    ]
   }
  ],
  "rigi": {
   "title": "Proyectos RIGI de petróleo y gas",
   "subtitle": "Inversión comprometida en proyectos aprobados",
   "count": 4,
   "totalMusd": 11214,
   "projects": [
    {
     "name": "GNL Argentina LNG (Southern Energy / PAE–Golar)",
     "sector": "gas",
     "operator": "Pan American Energy / Golar LNG",
     "province": "Río Negro",
     "investmentMusd": 6878,
     "approvalDate": null,
     "sourceUrl": "https://www.argentina.gob.ar/economia/rigi"
    },
    {
     "name": "Vaca Muerta Oleoducto Sur (VMOS)",
     "sector": "petroleo",
     "operator": "YPF y socios",
     "province": "Río Negro",
     "investmentMusd": 2486,
     "approvalDate": "2025-03-21",
     "sourceUrl": "https://www.boletinoficial.gob.ar/detalleAviso/primera/322830/20250321"
    },
    {
     "name": "Gasoducto San Matías (Southern Energy)",
     "sector": "gas",
     "operator": "Southern Energy",
     "province": "Río Negro",
     "investmentMusd": 1300,
     "approvalDate": null,
     "sourceUrl": "https://www.argentina.gob.ar/economia/rigi"
    },
    {
     "name": "Ampliación Gasoducto Perito Moreno",
     "sector": "gas",
     "operator": "Transportadora de Gas del Sur (TGS)",
     "province": "Neuquén",
     "investmentMusd": 550,
     "approvalDate": null,
     "sourceUrl": "https://www.argentina.gob.ar/economia/rigi"
    }
   ],
   "source": {
    "label": "Ministerio de Economía — Registro RIGI (Ley 27.742)",
    "url": "https://www.argentina.gob.ar/economia/rigi",
    "asOf": "2026-06"
   }
  },
  "impacto": {
   "headline": "Si la producción de petróleo alcanza la meta, el valor exportable incremental equivale a ~3% del PBI.",
   "items": [
    {
     "label": "Valor exportable incremental",
     "value": 19.145816921253417,
     "format": {
      "prefix": "US$",
      "suffix": " B/año",
      "decimals": 1
     },
     "tier": "proyectado"
    },
    {
     "label": "Equivalente en PBI",
     "value": 2.999193762929255,
     "format": {
      "suffix": "% del PBI",
      "decimals": 1
     },
     "tier": "proyectado"
    }
   ],
   "assumptions": {
    "priceUsd": 74.3,
    "priceBasis": "Brent prom. 12m (EIA)",
    "todayBblD": 794004.4469152623,
    "targetBblD": 1500000,
    "gdpUsd": 638365455340.04,
    "gdpYear": 2024
   },
   "source": {
    "label": "EIA — International Energy Statistics (producción por país)",
    "url": "https://www.eia.gov/international/data/world",
    "asOf": "2025"
   }
  }
 }
}

export const CONTRIBUTION = {
 "window": {
  "from": "2025-06-01",
  "to": "2026-05-01",
  "months": 12
 },
 "totals": {
  "oil_bbl": 304768304.6299997,
  "gas_mcf": 1741184637.3199997,
  "boe": 604972552.4437932,
  "gross_value_usd": 22280455848.980392,
  "gross_value_annualized_usd": 22280455848.980392,
  "royalties_usd": 2673654701.877647,
  "energy_exports_usd": 13009610062.01,
  "gdp_usd": 638365455340.04,
  "gdp_year": 2024,
  "value_share_of_gdp": 0.0349023520345602
 },
 "assumptions": {
  "brent_avg_usd_bbl": 78.70166666666667,
  "oil_discount_usd_bbl": 5,
  "gas_pist_avg_usd_mmbtu": null,
  "mcf_to_mmbtu": 1.037,
  "royalty_rate": 0.12
 },
 "operators": [
  {
   "operator_slug": "ypf",
   "operator_name": "YPF S.A.",
   "oil_bbl": 138404110.84,
   "gas_mcf": 396096464.5399999,
   "boe": 206696604.72620693,
   "share_boe": 0.34166278104891495,
   "share_oil": 0.4541289521823073,
   "share_gas": 0.227486767371015,
   "oil_value_usd": 10169431201.497303,
   "gas_value_usd": 0,
   "gross_value_usd": 10169431201.497303,
   "gross_value_annualized_usd": 10169431201.497303,
   "attributed_exports_usd": 4444899554.148284,
   "royalties_usd": 1220331744.1796763,
   "value_share_of_gdp": 0.01593042216872516
  },
  {
   "operator_slug": "pae",
   "operator_name": "PAN AMERICAN ENERGY SL",
   "oil_bbl": 34812943.5,
   "gas_mcf": 180445445.47,
   "boe": 65924227.20172414,
   "share_boe": 0.10897060855971484,
   "share_oil": 0.1142275721297995,
   "share_gas": 0.1036337224682492,
   "oil_value_usd": 2419421498.0253,
   "gas_value_usd": 0,
   "gross_value_usd": 2419421498.0253,
   "gross_value_annualized_usd": 2419421498.0253,
   "attributed_exports_usd": 1417665125.5818193,
   "royalties_usd": 290330579.763036,
   "value_share_of_gdp": 0.0037900257255251064
  },
  {
   "operator_slug": "pluspetrol",
   "operator_name": "PLUSPETROL S.A.",
   "oil_bbl": 22922950.109999996,
   "gas_mcf": 160623343.21999997,
   "boe": 50616629.97551724,
   "share_boe": 0.08366764702142405,
   "share_oil": 0.0752143505796291,
   "share_gas": 0.0922494603830347,
   "oil_value_usd": 1723689554.8902998,
   "gas_value_usd": 0,
   "gross_value_usd": 1723689554.8902998,
   "gross_value_annualized_usd": 1723689554.8902998,
   "attributed_exports_usd": 1088483462.5546193,
   "royalties_usd": 206842746.58683598,
   "value_share_of_gdp": 0.0027001610761850153
  },
  {
   "operator_slug": "vista",
   "operator_name": "VISTA ENERGY ARGENTINA SAU",
   "oil_bbl": 24116672.39,
   "gas_mcf": 15304914.33,
   "boe": 26755450.722758625,
   "share_boe": 0.044225891926302593,
   "share_oil": 0.0791311695593758,
   "share_gas": 0.008789943353484356,
   "oil_value_usd": 1710193154.7073,
   "gas_value_usd": 0,
   "gross_value_usd": 1710193154.7073,
   "gross_value_annualized_usd": 1710193154.7073,
   "attributed_exports_usd": 575361608.605793,
   "royalties_usd": 205223178.564876,
   "value_share_of_gdp": 0.002679018954426859
  },
  {
   "operator_slug": "shell",
   "operator_name": "SHELL ARGENTINA S.A.",
   "oil_bbl": 11919141.44,
   "gas_mcf": 14238951.71,
   "boe": 14374133.11413793,
   "share_boe": 0.023759975648603337,
   "share_oil": 0.03910886158083365,
   "share_gas": 0.008177737963457075,
   "oil_value_usd": 873473733.0543001,
   "gas_value_usd": 0,
   "gross_value_usd": 873473733.0543001,
   "gross_value_annualized_usd": 873473733.0543001,
   "attributed_exports_usd": 309108018.27118254,
   "royalties_usd": 104816847.966516,
   "value_share_of_gdp": 0.0013682973064214827
  },
  {
   "operator_slug": "tecpetrol",
   "operator_name": "TECPETROL S.A.",
   "oil_bbl": 7545716.459999998,
   "gas_mcf": 224932787.91,
   "boe": 46327231.616896555,
   "share_boe": 0.07657741071021686,
   "share_oil": 0.024758862208984576,
   "share_gas": 0.12918376551737357,
   "oil_value_usd": 534654362.7373999,
   "gas_value_usd": 0,
   "gross_value_usd": 534654362.7373999,
   "gross_value_annualized_usd": 534654362.7373999,
   "attributed_exports_usd": 996242252.8983096,
   "royalties_usd": 64158523.52848798,
   "value_share_of_gdp": 0.0008375364898976308
  },
  {
   "operator_slug": "pampa",
   "operator_name": "PAMPA ENERGIA S.A.",
   "oil_bbl": 6268283.42,
   "gas_mcf": 167123622.13000003,
   "boe": 35082701.02862069,
   "share_boe": 0.05799056649248588,
   "share_oil": 0.020567373065942453,
   "share_gas": 0.09598271116567725,
   "oil_value_usd": 483165861.44860005,
   "gas_value_usd": 0,
   "gross_value_usd": 483165861.44860005,
   "gross_value_annualized_usd": 483165861.44860005,
   "attributed_exports_usd": 754434657.3423042,
   "royalties_usd": 57979903.373832,
   "value_share_of_gdp": 0.0007568797111542176
  },
  {
   "operator_slug": "chevron",
   "operator_name": "CHEVRON ARGENTINA S.R.L.",
   "oil_bbl": 6505784.32,
   "gas_mcf": 15389317.299999999,
   "boe": 9159114.888965517,
   "share_boe": 0.015139719731031058,
   "share_oil": 0.021346656529452005,
   "share_gas": 0.008838417804838298,
   "oil_value_usd": 458371072.6375,
   "gas_value_usd": 0,
   "gross_value_usd": 458371072.6375,
   "gross_value_annualized_usd": 458371072.6375,
   "attributed_exports_usd": 196961850.14883298,
   "royalties_usd": 55004528.7165,
   "value_share_of_gdp": 0.0007180386545091763
  },
  {
   "operator_slug": "cgc",
   "operator_name": "COMPAÑÍA GENERAL DE COMBUSTIBLES S.A.",
   "oil_bbl": 6007511.53,
   "gas_mcf": 58086950.61,
   "boe": 16022503.014482759,
   "share_boe": 0.02648467761018196,
   "share_oil": 0.019711733269945336,
   "share_gas": 0.03336059218820492,
   "oil_value_usd": 418706544.0006,
   "gas_value_usd": 0,
   "gross_value_usd": 418706544.0006,
   "gross_value_annualized_usd": 418706544.0006,
   "attributed_exports_usd": 344555328.3265142,
   "royalties_usd": 50244785.280071996,
   "value_share_of_gdp": 0.0006559041384492936
  },
  {
   "operator_slug": "petroleos_sudamericanos_sa",
   "operator_name": "PETROLEOS SUDAMERICANOS S.A.",
   "oil_bbl": 5071801.830000001,
   "gas_mcf": 2660976.16,
   "boe": 5530590.823103447,
   "share_boe": 0.009141887182753277,
   "share_oil": 0.01664150029038407,
   "share_gas": 0.0015282561670746917,
   "oil_value_usd": 372640059.0707,
   "gas_value_usd": 0,
   "gross_value_usd": 372640059.0707,
   "gross_value_annualized_usd": 372640059.0707,
   "attributed_exports_usd": 118932387.4785073,
   "royalties_usd": 44716807.088484,
   "value_share_of_gdp": 0.000583740952699586
  },
  {
   "operator_slug": "pecom_servicios_energia_sau",
   "operator_name": "PECOM SERVICIOS ENERGIA SAU",
   "oil_bbl": 3842200.49,
   "gas_mcf": 1031126.96,
   "boe": 4019981.000344828,
   "share_boe": 0.0066448981596042185,
   "share_oil": 0.012606955617201,
   "share_gas": 0.00059219851697468,
   "oil_value_usd": 313644079.6799,
   "gas_value_usd": 0,
   "gross_value_usd": 313644079.6799,
   "gross_value_annualized_usd": 313644079.6799,
   "attributed_exports_usd": 86447533.95821877,
   "royalties_usd": 37637289.561588,
   "value_share_of_gdp": 0.00049132370346204
  },
  {
   "operator_slug": "cap",
   "operator_name": "COMPAÑÍAS ASOCIADAS PETROLERAS S.A.",
   "oil_bbl": 4000664.77,
   "gas_mcf": 1023474.4700000001,
   "boe": 4177125.8855172414,
   "share_boe": 0.006904653556006295,
   "share_oil": 0.01312690561722604,
   "share_gas": 0.0005878035264400872,
   "oil_value_usd": 294887214.0706,
   "gas_value_usd": 0,
   "gross_value_usd": 294887214.0706,
   "gross_value_annualized_usd": 294887214.0706,
   "attributed_exports_usd": 89826850.37691262,
   "royalties_usd": 35386465.688471995,
   "value_share_of_gdp": 0.0004619410583762267
  },
  {
   "operator_slug": "capex",
   "operator_name": "CAPEX S.A.",
   "oil_bbl": 3948437.6500000004,
   "gas_mcf": 18092572.27,
   "boe": 7067846.662068966,
   "share_boe": 0.011682921206124679,
   "share_oil": 0.012955538978351288,
   "share_gas": 0.010390955607010043,
   "oil_value_usd": 287502234.23429996,
   "gas_value_usd": 0,
   "gross_value_usd": 287502234.23429996,
   "gross_value_annualized_usd": 287502234.23429996,
   "attributed_exports_usd": 151990249.27686962,
   "royalties_usd": 34500268.10811599,
   "value_share_of_gdp": 0.0004503724815139868
  },
  {
   "operator_slug": "phoenix_global_resources_sa",
   "operator_name": "PHOENIX GLOBAL RESOURCES S.A.",
   "oil_bbl": 2049149.17,
   "gas_mcf": 697282.75,
   "boe": 2169370.3337931037,
   "share_boe": 0.003585898773473125,
   "share_oil": 0.006723629520752642,
   "share_gas": 0.00040046456593669763,
   "oil_value_usd": 220610861.1393,
   "gas_value_usd": 0,
   "gross_value_usd": 220610861.1393,
   "gross_value_annualized_usd": 220610861.1393,
   "attributed_exports_usd": 46651144.76472529,
   "royalties_usd": 26473303.336715996,
   "value_share_of_gdp": 0.00034558709167899215
  },
  {
   "operator_slug": "pcr",
   "operator_name": "PETROQUIMICA COMODORO RIVADAVIA S.A.",
   "oil_bbl": 2910350.230000001,
   "gas_mcf": 5749290.97,
   "boe": 3901607.293793103,
   "share_boe": 0.0064492302634764475,
   "share_oil": 0.009549386159211262,
   "share_gas": 0.0033019421644158347,
   "oil_value_usd": 202828897.21940002,
   "gas_value_usd": 0,
   "gross_value_usd": 202828897.21940002,
   "gross_value_annualized_usd": 202828897.21940002,
   "attributed_exports_usd": 83901970.92794259,
   "royalties_usd": 24339467.666328,
   "value_share_of_gdp": 0.00031773163087491716
  },
  {
   "operator_slug": "totalenergies",
   "operator_name": "TOTAL AUSTRAL S.A.",
   "oil_bbl": 2844969.0300000003,
   "gas_mcf": 392848600.17,
   "boe": 70577486.30068967,
   "share_boe": 0.11666229486873603,
   "share_oil": 0.009334858601697117,
   "share_gas": 0.22562144861022065,
   "oil_value_usd": 197504803.4615,
   "gas_value_usd": 0,
   "gross_value_usd": 197504803.4615,
   "gross_value_annualized_usd": 197504803.4615,
   "attributed_exports_usd": 1517730965.181486,
   "royalties_usd": 23700576.415379997,
   "value_share_of_gdp": 0.00030939143371455543
  },
  {
   "operator_slug": "quintana_e_p_argentina_srl",
   "operator_name": "QUINTANA E&P ARGENTINA S.R.L.",
   "oil_bbl": 2142612.64,
   "gas_mcf": 19808540.240000002,
   "boe": 5557878.198620689,
   "share_boe": 0.009186992329105808,
   "share_oil": 0.007030300091740883,
   "share_gas": 0.011376473129517702,
   "oil_value_usd": 170491731.93599996,
   "gas_value_usd": 0,
   "gross_value_usd": 170491731.93599996,
   "gross_value_annualized_usd": 170491731.93599996,
   "attributed_exports_usd": 119519187.84434362,
   "royalties_usd": 20459007.832319994,
   "value_share_of_gdp": 0.00026707543541055746
  },
  {
   "operator_slug": "aconcagua",
   "operator_name": "Petrolera Aconcagua Energia S.A.",
   "oil_bbl": 2317156.19,
   "gas_mcf": 4648145.3,
   "boe": 3118560.5520689655,
   "share_boe": 0.005154879406464816,
   "share_oil": 0.007603009088537326,
   "share_gas": 0.002669530387744715,
   "oil_value_usd": 152656820.7016,
   "gas_value_usd": 0,
   "gross_value_usd": 152656820.7016,
   "gross_value_annualized_usd": 152656820.7016,
   "attributed_exports_usd": 67062970.99479281,
   "royalties_usd": 18318818.484192,
   "value_share_of_gdp": 0.0002391370325956686
  },
  {
   "operator_slug": "petrolera_el_trebol",
   "operator_name": "PETROLERA EL TREBOL S.A.",
   "oil_bbl": 2391044.37,
   "gas_mcf": 886632.8899999999,
   "boe": 2543912.109655172,
   "share_boe": 0.004205004176435793,
   "share_oil": 0.007845449588016768,
   "share_gas": 0.0005092124470869956,
   "oil_value_usd": 148113915.5838,
   "gas_value_usd": 0,
   "gross_value_usd": 148113915.5838,
   "gross_value_annualized_usd": 148113915.5838,
   "attributed_exports_usd": 54705464.64455317,
   "royalties_usd": 17773669.870056,
   "value_share_of_gdp": 0.00023202056806927892
  },
  {
   "operator_slug": "kilwer_sa",
   "operator_name": "KILWER S.A.",
   "oil_bbl": 2241987.08,
   "gas_mcf": 852185.42,
   "boe": 2388915.600689655,
   "share_boe": 0.003948799976196613,
   "share_oil": 0.007356365625755794,
   "share_gas": 0.0004894285199481594,
   "oil_value_usd": 141116023.8863,
   "gas_value_usd": 0,
   "gross_value_usd": 141116023.8863,
   "gross_value_annualized_usd": 141116023.8863,
   "attributed_exports_usd": 51372347.90319231,
   "royalties_usd": 16933922.866356,
   "value_share_of_gdp": 0.00022105836508827268
  },
  {
   "operator_slug": "crown_point",
   "operator_name": "CROWN POINT ENERGIA S.A.",
   "oil_bbl": 1788255.0500000003,
   "gas_mcf": 1537847.15,
   "boe": 2053401.1103448276,
   "share_boe": 0.0033942054098985014,
   "share_oil": 0.005867588665990087,
   "share_gas": 0.0008832188827297642,
   "oil_value_usd": 140107988.2198,
   "gas_value_usd": 0,
   "gross_value_usd": 140107988.2198,
   "gross_value_annualized_usd": 140107988.2198,
   "attributed_exports_usd": 44157288.85314432,
   "royalties_usd": 16812958.586376,
   "value_share_of_gdp": 0.0002194792764047175
  },
  {
   "operator_slug": "clear_petroleum_sa",
   "operator_name": "Clear Petroleum S.A.",
   "oil_bbl": 1514567.2600000002,
   "gas_mcf": 278786.85,
   "boe": 1562633.958275862,
   "share_boe": 0.0025829832311624473,
   "share_oil": 0.004969569463067173,
   "share_gas": 0.0001601133182688217,
   "oil_value_usd": 128142031.039,
   "gas_value_usd": 0,
   "gross_value_usd": 128142031.039,
   "gross_value_annualized_usd": 128142031.039,
   "attributed_exports_usd": 33603604.63413408,
   "royalties_usd": 15377043.724679999,
   "value_share_of_gdp": 0.00020073459484229485
  },
  {
   "operator_slug": "patagonia_resources_sa",
   "operator_name": "PATAGONIA RESOURCES S.A.",
   "oil_bbl": 1329853.45,
   "gas_mcf": 1592975.5799999998,
   "boe": 1604504.4120689658,
   "share_boe": 0.002652193732736391,
   "share_oil": 0.004363490001411048,
   "share_gas": 0.0009148803325372083,
   "oil_value_usd": 112566339.52239999,
   "gas_value_usd": 0,
   "gross_value_usd": 112566339.52239999,
   "gross_value_annualized_usd": 112566339.52239999,
   "attributed_exports_usd": 34504006.27180721,
   "royalties_usd": 13507960.742687998,
   "value_share_of_gdp": 0.00017633526153516395
  },
  {
   "operator_slug": "vm_inversiones",
   "operator_name": "VACA MUERTA INVERSIONES SAU",
   "oil_bbl": 1122946.56,
   "gas_mcf": 2649105.69,
   "boe": 1579688.920344828,
   "share_boe": 0.0026111745300900963,
   "share_oil": 0.003684591025183212,
   "share_gas": 0.0015214386993888575,
   "oil_value_usd": 86936222.4642,
   "gas_value_usd": 0,
   "gross_value_usd": 86936222.4642,
   "gross_value_annualized_usd": 86936222.4642,
   "attributed_exports_usd": 33970362.44032435,
   "royalties_usd": 10432346.695704,
   "value_share_of_gdp": 0.00013618566251817531
  },
  {
   "operator_slug": "roch_sa",
   "operator_name": "ROCH S.A.",
   "oil_bbl": 1110731.1,
   "gas_mcf": 4406064.96,
   "boe": 1870397.4724137932,
   "share_boe": 0.003091706334210209,
   "share_oil": 0.00364450988874473,
   "share_gas": 0.002530498412151015,
   "oil_value_usd": 85506455.98610002,
   "gas_value_usd": 0,
   "gross_value_usd": 85506455.98610002,
   "gross_value_annualized_usd": 85506455.98610002,
   "attributed_exports_usd": 40221893.834321186,
   "royalties_usd": 10260774.718332002,
   "value_share_of_gdp": 0.00013394593217854034
  },
  {
   "operator_slug": "bentia_energy_sa",
   "operator_name": "BENTIA ENERGY S.A.",
   "oil_bbl": 1105813.7899999998,
   "gas_mcf": 5849327.18,
   "boe": 2114318.4762068964,
   "share_boe": 0.0034948998391184593,
   "share_oil": 0.0036283753041265227,
   "share_gas": 0.003359395123657408,
   "oil_value_usd": 82730542.2014,
   "gas_value_usd": 0,
   "gross_value_usd": 82730542.2014,
   "gross_value_annualized_usd": 82730542.2014,
   "attributed_exports_usd": 45467284.11271264,
   "royalties_usd": 9927665.064167999,
   "value_share_of_gdp": 0.00012959746099878113
  },
  {
   "operator_slug": "petrolera_santa_maria_sau",
   "operator_name": "PETROLERA SANTA MARIA SAU",
   "oil_bbl": 716385.28,
   "gas_mcf": 17748239.75,
   "boe": 3776426.6162068965,
   "share_boe": 0.006242310665090474,
   "share_oil": 0.0023505898386307557,
   "share_gas": 0.010193197992671113,
   "oil_value_usd": 52912949.558699995,
   "gas_value_usd": 0,
   "gross_value_usd": 52912949.558699995,
   "gross_value_annualized_usd": 52912949.558699995,
   "attributed_exports_usd": 81210027.63875337,
   "royalties_usd": 6349553.947043999,
   "value_share_of_gdp": 8.288817810561929e-05
  },
  {
   "operator_slug": "tango_energy_argentina_sa",
   "operator_name": "TANGO ENERGY ARGENTINA S.A.",
   "oil_bbl": 461412.3799999999,
   "gas_mcf": 863218.1299999999,
   "boe": 610243.0920689654,
   "share_boe": 0.0010087120309903016,
   "share_oil": 0.0015139775790011106,
   "share_gas": 0.0004957648439447811,
   "oil_value_usd": 51811996.150199994,
   "gas_value_usd": 0,
   "gross_value_usd": 51811996.150199994,
   "gross_value_annualized_usd": 51811996.150199994,
   "attributed_exports_usd": 13122950.188041972,
   "royalties_usd": 6217439.538023999,
   "value_share_of_gdp": 8.116353370437493e-05
  },
  {
   "operator_slug": "venoil_sa",
   "operator_name": "VENOIL S.A.",
   "oil_bbl": 548127.37,
   "gas_mcf": 2248079.5300000003,
   "boe": 935727.2889655172,
   "share_boe": 0.001546726847665463,
   "share_oil": 0.0017985051649824526,
   "share_gas": 0.0012911207012831242,
   "oil_value_usd": 38298570.706199996,
   "gas_value_usd": 0,
   "gross_value_usd": 38298570.706199996,
   "gross_value_annualized_usd": 38298570.706199996,
   "attributed_exports_usd": 20122313.160569616,
   "royalties_usd": 4595828.484743999,
   "value_share_of_gdp": 5.9994741861148144e-05
  },
  {
   "operator_slug": "oilstone_energia_sa",
   "operator_name": "OILSTONE ENERGIA S.A.",
   "oil_bbl": 512260.29999999993,
   "gas_mcf": 6275380.210000001,
   "boe": 1594222.405172414,
   "share_boe": 0.002635197908950638,
   "share_oil": 0.0016808188129074097,
   "share_gas": 0.003604086594549188,
   "oil_value_usd": 35576828.96509999,
   "gas_value_usd": 0,
   "gross_value_usd": 35576828.96509999,
   "gross_value_annualized_usd": 35576828.96509999,
   "attributed_exports_usd": 34282897.23167193,
   "royalties_usd": 4269219.475811998,
   "value_share_of_gdp": 5.57311312313245e-05
  },
  {
   "operator_slug": "brest_sa_de_servicios_petroleros",
   "operator_name": "BREST S.A. DE SERVICIOS PETROLEROS",
   "oil_bbl": 268639.77,
   "gas_mcf": 323974.94,
   "boe": 324497.5182758621,
   "share_boe": 0.0005363838689293437,
   "share_oil": 0.0008814557351235684,
   "share_gas": 0.00018606581579921154,
   "oil_value_usd": 22484799.578999996,
   "gas_value_usd": 0,
   "gross_value_usd": 22484799.578999996,
   "gross_value_annualized_usd": 22484799.578999996,
   "attributed_exports_usd": 6978144.978323043,
   "royalties_usd": 2698175.9494799995,
   "value_share_of_gdp": 3.522245665223685e-05
  },
  {
   "operator_slug": "hattrick_energy_sas",
   "operator_name": "HATTRICK ENERGY SAS",
   "oil_bbl": 319571.60000000003,
   "gas_mcf": 0,
   "boe": 319571.60000000003,
   "share_boe": 0.0005282414858477249,
   "share_oil": 0.0010485722929356846,
   "share_gas": 0,
   "oil_value_usd": 22235398.272899996,
   "gas_value_usd": 0,
   "gross_value_usd": 22235398.272899996,
   "gross_value_annualized_usd": 22235398.272899996,
   "attributed_exports_usd": 6872215.7494556755,
   "royalties_usd": 2668247.7927479995,
   "value_share_of_gdp": 3.4831769305335926e-05
  },
  {
   "operator_slug": "geopark",
   "operator_name": "GEOPARK ARGENTINA S.A.",
   "oil_bbl": 177704.04000000004,
   "gas_mcf": 86804.85999999999,
   "boe": 192670.39517241382,
   "share_boe": 0.0003184779117566899,
   "share_oil": 0.000583079136840491,
   "share_gas": 4.985390873515199e-05,
   "oil_value_usd": 17530564.4604,
   "gas_value_usd": 0,
   "gross_value_usd": 17530564.4604,
   "gross_value_annualized_usd": 17530564.4604,
   "attributed_exports_usd": 4143273.4453177657,
   "royalties_usd": 2103667.735248,
   "value_share_of_gdp": 2.7461643348263484e-05
  },
  {
   "operator_slug": "recursos_y_energia_formosa_sa",
   "operator_name": "RECURSOS Y ENERGIA FORMOSA S.A.",
   "oil_bbl": 176863.11,
   "gas_mcf": 132429.44999999998,
   "boe": 199695.77379310344,
   "share_boe": 0.00033009063466835016,
   "share_oil": 0.0005803198932209126,
   "share_gas": 7.605709765727834e-05,
   "oil_value_usd": 12961062.535799999,
   "gas_value_usd": 0,
   "gross_value_usd": 12961062.535799999,
   "gross_value_annualized_usd": 12961062.535799999,
   "attributed_exports_usd": 4294350.442156635,
   "royalties_usd": 1555327.5042959999,
   "value_share_of_gdp": 2.0303514902597588e-05
  },
  {
   "operator_slug": "colhue_huapi_sa",
   "operator_name": "COLHUE HUAPI S.A.",
   "oil_bbl": 128458.43000000002,
   "gas_mcf": 52661.26,
   "boe": 137537.9575862069,
   "share_boe": 0.00022734578127655682,
   "share_oil": 0.0004214953722171124,
   "share_gas": 3.0244500710191927e-05,
   "oil_value_usd": 9438873.8825,
   "gas_value_usd": 0,
   "gross_value_usd": 9438873.8825,
   "gross_value_annualized_usd": 9438873.8825,
   "attributed_exports_usd": 2957679.963651018,
   "royalties_usd": 1132664.8659,
   "value_share_of_gdp": 1.4786003540044577e-05
  },
  {
   "operator_slug": "edhipsa",
   "operator_name": "EDHIPSA",
   "oil_bbl": 118930.72,
   "gas_mcf": 33781.8,
   "boe": 124755.16827586206,
   "share_boe": 0.0002062162453022244,
   "share_oil": 0.0003902332302710625,
   "share_gas": 1.9401618459025887e-05,
   "oil_value_usd": 8469989.751,
   "gas_value_usd": 0,
   "gross_value_usd": 8469989.751,
   "gross_value_annualized_usd": 8469989.751,
   "attributed_exports_usd": 2682792.9398337407,
   "royalties_usd": 1016398.77012,
   "value_share_of_gdp": 1.3268245767603865e-05
  },
  {
   "operator_slug": "ingenieria_alpa_sa",
   "operator_name": "INGENIERIA ALPA S.A.",
   "oil_bbl": 104439.79,
   "gas_mcf": 53949.42,
   "boe": 113741.41413793103,
   "share_boe": 0.0001880108670690453,
   "share_oil": 0.0003426858646826607,
   "share_gas": 3.0984318861805476e-05,
   "oil_value_usd": 7573040.3425,
   "gas_value_usd": 0,
   "gross_value_usd": 7573040.3425,
   "gross_value_annualized_usd": 7573040.3425,
   "attributed_exports_usd": 2445948.067988676,
   "royalties_usd": 908764.8411,
   "value_share_of_gdp": 1.18631737966868e-05
  },
  {
   "operator_slug": "geopark_argentina_ltd_sucursal_argentina",
   "operator_name": "GEOPARK ARGENTINA LTD. (SUCURSAL ARGENTINA)",
   "oil_bbl": 119017.10999999999,
   "gas_mcf": 61069.66,
   "boe": 129546.36172413794,
   "share_boe": 0.00021413593261518065,
   "share_oil": 0.0003905166915059992,
   "share_gas": 3.50736267085364e-05,
   "oil_value_usd": 7033019.428400001,
   "gas_value_usd": 0,
   "gross_value_usd": 7033019.428400001,
   "gross_value_annualized_usd": 7033019.428400001,
   "attributed_exports_usd": 2785824.9835883495,
   "royalties_usd": 843962.3314080001,
   "value_share_of_gdp": 1.1017230599756844e-05
  },
  {
   "operator_slug": "patagonia_energy_sa",
   "operator_name": "PATAGONIA ENERGY S.A.",
   "oil_bbl": 97326.97,
   "gas_mcf": 209236.53999999998,
   "boe": 133402.23551724138,
   "share_boe": 0.00022050956688590516,
   "share_oil": 0.0003193474141550206,
   "share_gas": 0.00012016907082413335,
   "oil_value_usd": 6631855.0676,
   "gas_value_usd": 0,
   "gross_value_usd": 6631855.0676,
   "gross_value_annualized_usd": 6631855.0676,
   "attributed_exports_usd": 2868743.480128339,
   "royalties_usd": 795822.6081119999,
   "value_share_of_gdp": 1.0388806305421696e-05
  },
  {
   "operator_slug": "pampetrol_sapem",
   "operator_name": "PAMPETROL S.A.P.E.M",
   "oil_bbl": 87507.99,
   "gas_mcf": 47829.09999999999,
   "boe": 95754.38655172414,
   "share_boe": 0.0001582788940835799,
   "share_oil": 0.0002871295625909592,
   "share_gas": 2.7469286699897425e-05,
   "oil_value_usd": 6457783.580399999,
   "gas_value_usd": 0,
   "gross_value_usd": 6457783.580399999,
   "gross_value_annualized_usd": 6457783.580399999,
   "attributed_exports_usd": 2059146.6930735563,
   "royalties_usd": 774934.0296479999,
   "value_share_of_gdp": 1.0116123180506552e-05
  },
  {
   "operator_slug": "flxs_oge_sa",
   "operator_name": "FLXS OGE S.A",
   "oil_bbl": 68261.65,
   "gas_mcf": 9595525.930000002,
   "boe": 1722662.6724137932,
   "share_boe": 0.0028475055032746175,
   "share_oil": 0.00022397883560389337,
   "share_gas": 0.00551091809813419,
   "oil_value_usd": 5147827.171999999,
   "gas_value_usd": 0,
   "gross_value_usd": 5147827.171999999,
   "gross_value_annualized_usd": 5147827.171999999,
   "attributed_exports_usd": 37044936.24703031,
   "royalties_usd": 617739.2606399999,
   "value_share_of_gdp": 8.064075411564823e-06
  },
  {
   "operator_slug": "pilgrim_energy_sa",
   "operator_name": "Pilgrim Energy S.A.",
   "oil_bbl": 68863.34,
   "gas_mcf": 528907.37,
   "boe": 160054.26586206898,
   "share_boe": 0.0002645645082831081,
   "share_oil": 0.00022595308945791691,
   "share_gas": 0.0003037629431500641,
   "oil_value_usd": 4817405.7363,
   "gas_value_usd": 0,
   "gross_value_usd": 4817405.7363,
   "gross_value_annualized_usd": 4817405.7363,
   "attributed_exports_usd": 3441881.089010651,
   "royalties_usd": 578088.688356,
   "value_share_of_gdp": 7.546469966382968e-06
  },
  {
   "operator_slug": "emesa",
   "operator_name": "E.M.E.S.A",
   "oil_bbl": 62957.07000000001,
   "gas_mcf": 24068.370000000003,
   "boe": 67106.78896551723,
   "share_boe": 0.00011092534478537684,
   "share_oil": 0.00020657354798240022,
   "share_gas": 1.3822985503160427e-05,
   "oil_value_usd": 4652819.242000001,
   "gas_value_usd": 0,
   "gross_value_usd": 4652819.242000001,
   "gross_value_annualized_usd": 4652819.242000001,
   "attributed_exports_usd": 1443095.4816517672,
   "royalties_usd": 558338.3090400001,
   "value_share_of_gdp": 7.288645090485934e-06
  },
  {
   "operator_slug": "jujuy_hidrocarburos_sau",
   "operator_name": "JUJUY HIDROCARBUROS SAU",
   "oil_bbl": 62907.07,
   "gas_mcf": 110339.69999999998,
   "boe": 81931.15620689654,
   "share_boe": 0.0001354295428378275,
   "share_oil": 0.00020640948892756934,
   "share_gas": 6.337047641876331e-05,
   "oil_value_usd": 4626728.7127,
   "gas_value_usd": 0,
   "gross_value_usd": 4626728.7127,
   "gross_value_annualized_usd": 4626728.7127,
   "attributed_exports_usd": 1761885.543196415,
   "royalties_usd": 555207.445524,
   "value_share_of_gdp": 7.247774255321298e-06
  },
  {
   "operator_slug": "velitec_sa",
   "operator_name": "VELITEC S.A.",
   "oil_bbl": 40101.79000000001,
   "gas_mcf": 745800.9199999999,
   "boe": 168688.1555172414,
   "share_boe": 0.0002788360477443543,
   "share_oil": 0.0001315812352885091,
   "share_gas": 0.0004283296004425604,
   "oil_value_usd": 4503029.9991000015,
   "gas_value_usd": 0,
   "gross_value_usd": 4503029.9991000015,
   "gross_value_annualized_usd": 4503029.9991000015,
   "attributed_exports_usd": 3627548.252386052,
   "royalties_usd": 540363.5998920002,
   "value_share_of_gdp": 7.054000120826336e-06
  },
  {
   "operator_slug": "madalena_energy_argentina_srl",
   "operator_name": "MADALENA ENERGY ARGENTINA SRL",
   "oil_bbl": 66051.49,
   "gas_mcf": 306937.92,
   "boe": 118971.82103448277,
   "share_boe": 0.0001966565599611004,
   "share_oil": 0.00021672690039139413,
   "share_gas": 0.00017628108669304212,
   "oil_value_usd": 4431170.0793,
   "gas_value_usd": 0,
   "gross_value_usd": 4431170.0793,
   "gross_value_annualized_usd": 4431170.0793,
   "attributed_exports_usd": 2558425.1612302046,
   "royalties_usd": 531740.4095160001,
   "value_share_of_gdp": 6.9414314985757425e-06
  },
  {
   "operator_slug": "enap_sipetrol_argentina_sa",
   "operator_name": "ENAP SIPETROL ARGENTINA S.A.",
   "oil_bbl": 64946.8,
   "gas_mcf": 1809092.3,
   "boe": 376859.2655172414,
   "share_boe": 0.0006229361381684414,
   "share_oil": 0.00021310221244577216,
   "share_gas": 0.0010390008395574422,
   "oil_value_usd": 4315065.392,
   "gas_value_usd": 0,
   "gross_value_usd": 4315065.392,
   "gross_value_annualized_usd": 4315065.392,
   "attributed_exports_usd": 8104156.251105807,
   "royalties_usd": 517807.84703999996,
   "value_share_of_gdp": 6.759553412396793e-06
  },
  {
   "operator_slug": "president_petroleum",
   "operator_name": "PRESIDENT PETROLEUM S.A.",
   "oil_bbl": 57828.93,
   "gas_mcf": 15639.069999999998,
   "boe": 60525.32137931035,
   "share_boe": 0.00010004639241039557,
   "share_oil": 0.00018974719195359412,
   "share_gas": 8.98185618273739e-06,
   "oil_value_usd": 3831330.3972000005,
   "gas_value_usd": 0,
   "gross_value_usd": 3831330.3972000005,
   "gross_value_annualized_usd": 3831330.3972000005,
   "attributed_exports_usd": 1301564.5533700832,
   "royalties_usd": 459759.64766400005,
   "value_share_of_gdp": 6.001782153389165e-06
  },
  {
   "operator_slug": "copesa_cia_constructora_petrolera_sa",
   "operator_name": "COPESA CIA CONSTRUCTORA PETROLERA SA",
   "oil_bbl": 31061.840000000004,
   "gas_mcf": 171922.99,
   "boe": 60703.73482758622,
   "share_boe": 0.00010034130405151906,
   "share_oil": 0.00010191952223414524,
   "share_gas": 9.87390919464008e-05,
   "oil_value_usd": 3029277.6752,
   "gas_value_usd": 0,
   "gross_value_usd": 3029277.6752,
   "gross_value_annualized_usd": 3029277.6752,
   "attributed_exports_usd": 1305401.2388238471,
   "royalties_usd": 363513.321024,
   "value_share_of_gdp": 4.7453659183145895e-06
  },
  {
   "operator_slug": "high_luck_group_ltd___sucursal_argentina",
   "operator_name": "HIGH LUCK GROUP LTD. - SUCURSAL ARGENTINA",
   "oil_bbl": 40455.58,
   "gas_mcf": 1915.34,
   "boe": 40785.81103448276,
   "share_boe": 6.741762228671042e-05,
   "share_oil": 0.00013274208434868126,
   "share_gas": 1.1000211918639812e-06,
   "oil_value_usd": 2942334.9799,
   "gas_value_usd": 0,
   "gross_value_usd": 2942334.9799,
   "gross_value_annualized_usd": 2942334.9799,
   "attributed_exports_usd": 877076.9772579776,
   "royalties_usd": 353080.197588,
   "value_share_of_gdp": 4.609170116093919e-06
  },
  {
   "operator_slug": "interoil",
   "operator_name": "INTEROIL ARGENTINA S A",
   "oil_bbl": 38545.57,
   "gas_mcf": 1563705.68,
   "boe": 308149.9975862069,
   "share_boe": 0.0005093619476477596,
   "share_oil": 0.00012647499564233158,
   "share_gas": 0.000898069995843076,
   "oil_value_usd": 2749839.3447,
   "gas_value_usd": 0,
   "gross_value_usd": 2749839.3447,
   "gross_value_annualized_usd": 2749839.3447,
   "attributed_exports_usd": 6626600.319323304,
   "royalties_usd": 329980.72136399994,
   "value_share_of_gdp": 4.307625548495939e-06
  },
  {
   "operator_slug": "medanito",
   "operator_name": "MEDANITO S.A.",
   "oil_bbl": 28613.519999999997,
   "gas_mcf": 41033.52999999999,
   "boe": 35688.26655172413,
   "share_boe": 5.899154665374651e-05,
   "share_oil": 9.38861409316756e-05,
   "share_gas": 2.3566443856958255e-05,
   "oil_value_usd": 1992397.7249,
   "gas_value_usd": 0,
   "gross_value_usd": 1992397.7249,
   "gross_value_annualized_usd": 1992397.7249,
   "attributed_exports_usd": 767457.018920113,
   "royalties_usd": 239087.72698799998,
   "value_share_of_gdp": 3.1210926409523577e-06
  },
  {
   "operator_slug": "fomicruz",
   "operator_name": "FOMICRUZ S.E.",
   "oil_bbl": 27240.52,
   "gas_mcf": 19334.77,
   "boe": 30574.101034482752,
   "share_boe": 5.053799699007557e-05,
   "share_oil": 8.938107928602033e-05,
   "share_gas": 1.1104376632773267e-05,
   "oil_value_usd": 1965194.7412000003,
   "gas_value_usd": 0,
   "gross_value_usd": 1965194.7412000003,
   "gross_value_annualized_usd": 1965194.7412000003,
   "attributed_exports_usd": 657479.6341559181,
   "royalties_usd": 235823.36894400002,
   "value_share_of_gdp": 3.0784791450740297e-06
  },
  {
   "operator_slug": "azruge_sa",
   "operator_name": "AZRUGE S.A.",
   "oil_bbl": 14899.98,
   "gas_mcf": 16901.1,
   "boe": 17813.962758620688,
   "share_boe": 2.9445902440798335e-05,
   "share_oil": 4.888953271597301e-05,
   "share_gas": 9.706667310144586e-06,
   "oil_value_usd": 1213348.9189,
   "gas_value_usd": 0,
   "gross_value_usd": 1213348.9189,
   "gross_value_annualized_usd": 1213348.9189,
   "attributed_exports_usd": 383079.7086787748,
   "royalties_usd": 145601.870268,
   "value_share_of_gdp": 1.9007120588216694e-06
  },
  {
   "operator_slug": "g_y_g_oil_service_srl",
   "operator_name": "G Y G OIL SERVICE SRL",
   "oil_bbl": 15327.08,
   "gas_mcf": 35859.98,
   "boe": 21509.835172413794,
   "share_boe": 3.555505962299377e-05,
   "share_oil": 5.029092516233818e-05,
   "share_gas": 2.059516218520917e-05,
   "oil_value_usd": 1110553.8220000002,
   "gas_value_usd": 0,
   "gross_value_usd": 1110553.8220000002,
   "gross_value_annualized_usd": 1110553.8220000002,
   "attributed_exports_usd": 462557.46142666525,
   "royalties_usd": 133266.45864000003,
   "value_share_of_gdp": 1.7396834567253302e-06
  },
  {
   "operator_slug": "geopetrol_drilling_sa",
   "operator_name": "GEOPETROL DRILLING S.A.",
   "oil_bbl": 3192.5699999999997,
   "gas_mcf": 14366.48,
   "boe": 5669.549310344828,
   "share_boe": 9.371581053458743e-06,
   "share_oil": 1.0475400333626887e-05,
   "share_gas": 8.25098021891155e-06,
   "oil_value_usd": 252962.9245,
   "gas_value_usd": 0,
   "gross_value_usd": 252962.9245,
   "gross_value_annualized_usd": 252962.9245,
   "attributed_exports_usd": 121920.61517001914,
   "royalties_usd": 30355.550939999997,
   "value_share_of_gdp": 3.962666249934428e-07
  },
  {
   "operator_slug": "petrofaro_sa",
   "operator_name": "PETROFARO S.A.",
   "oil_bbl": 2295.73,
   "gas_mcf": 201252.46,
   "boe": 36994.43000000001,
   "share_boe": 6.11505924534272e-05,
   "share_oil": 7.532705878936799e-06,
   "share_gas": 0.00011558364098006527,
   "oil_value_usd": 169310.5965,
   "gas_value_usd": 0,
   "gross_value_usd": 169310.5965,
   "gross_value_annualized_usd": 169310.5965,
   "attributed_exports_usd": 795545.3628799793,
   "royalties_usd": 20317.27158,
   "value_share_of_gdp": 2.65225185798647e-07
  },
  {
   "operator_slug": "alianza_petrolera_argentina_sa",
   "operator_name": "ALIANZA PETROLERA ARGENTINA S.A.",
   "oil_bbl": 1206.09,
   "gas_mcf": 639249.25,
   "boe": 111421.47793103449,
   "share_boe": 0.00018417608779265477,
   "share_oil": 3.957399708818931e-06,
   "share_gas": 0.000367134671589982,
   "oil_value_usd": 99084.9535,
   "gas_value_usd": 0,
   "gross_value_usd": 99084.9535,
   "gross_value_annualized_usd": 99084.9535,
   "attributed_exports_usd": 2396059.0849289587,
   "royalties_usd": 11890.19442,
   "value_share_of_gdp": 1.5521665947168167e-07
  },
  {
   "operator_slug": "petrolsur_energia_sa",
   "operator_name": "PETROLSUR ENERGIA S.A.",
   "oil_bbl": 1248.48,
   "gas_mcf": 351397.28,
   "boe": 61834.217931034495,
   "share_boe": 0.00010220995594139685,
   "share_oil": 4.09648897550453e-06,
   "share_gas": 0.00020181505882159887,
   "oil_value_usd": 96230.87289999999,
   "gas_value_usd": 0,
   "gross_value_usd": 96230.87289999999,
   "gross_value_annualized_usd": 96230.87289999999,
   "attributed_exports_usd": 1329711.6712527953,
   "royalties_usd": 11547.704747999998,
   "value_share_of_gdp": 1.5074573991279087e-07
  }
 ]
}

export const DAY_VALUE_INPUTS = {
 "oilBbl": 304768304.6299997,
 "grossValueUsd": 22280455848.980392,
 "brentAvgUsd": 78.70166666666667,
 "oilDiscountUsd": 5,
 "months": 12,
 "gdpUsd": 638365455340.04,
 "gdpYear": 2024,
 "brentSpotUsd": 81.89,
 "breakevenUsd": 45
}
