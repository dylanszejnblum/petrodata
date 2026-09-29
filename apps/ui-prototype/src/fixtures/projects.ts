/* PROYECTOS MINEROS REALES de vacamuerta.io/minerals (2026-08-05).
   Catálogo, precios en vivo, rollups y capex del sitio real.
   Coordenadas: aproximadas por provincia (el sitio no las expone en texto);
   solo para el mapa ilustrativo. */

export type MineralCommodity = 'copper' | 'gold' | 'lithium' | 'silver' | 'uranium'

export type MineralProject = {
  slug: string
  name: string
  commodity: MineralCommodity
  province: string
  stage: string
  operator: string
  ley?: string
  recurso?: string
  capexMUSD?: number
  lat: number
  lng: number
}

export const COMMODITY_LABEL: Record<MineralCommodity, string> = {
  copper: 'Cobre',
  gold: 'Oro',
  lithium: 'Litio',
  silver: 'Plata',
  uranium: 'Uranio',
}

/** Rollups reales del hub */
export const COMMODITY_STATS: Record<
  MineralCommodity,
  { projects: number; producing: number; measured: string }
> = {
  copper: { projects: 8, producing: 0, measured: '999K Cu/klb' },
  gold: { projects: 13, producing: 9, measured: '1.33K Au/kOz' },
  lithium: { projects: 20, producing: 5, measured: '54.8M LCE/t' },
  silver: { projects: 6, producing: 3, measured: '97.6K Ag/kOz' },
  uranium: { projects: 4, producing: 0, measured: '23.3 U3O8/MLbs' },
}

export const MINERALS_TOTALS = { projects: 51, commodities: 5, inOperation: 16, sources: 5 }

/** Precios en vivo del sitio (Yahoo Finance · 5-min cache) */
export const LIVE_PRICES = [
  { name: 'Silver', value: 62.3, unit: 'USD/oz', changePct: 8.18 },
  { name: 'Gold', value: 4_313, unit: 'USD/oz', changePct: 6.52 },
  { name: 'Copper', value: 6.75, unit: 'USD/lb', changePct: 4.8 },
  { name: 'Uranium (ETF)', value: 43.01, unit: 'USD/share', changePct: 14.63 },
  { name: 'Lithium (ETF)', value: 72.8, unit: 'USD/share', changePct: 9.08 },
]

const PROV_COORD: Record<string, [number, number]> = {
  Catamarca: [-27.3, -67.0],
  Salta: [-24.8, -66.8],
  'San Juan': [-30.4, -69.5],
  'Santa Cruz': [-48.2, -69.3],
  Jujuy: [-23.3, -66.4],
  Chubut: [-43.8, -68.6],
  Mendoza: [-34.6, -68.9],
  'Río Negro': [-40.6, -67.2],
  'Buenos Aires': [-36.8, -59.2],
  Neuquén: [-38.7, -69.8],
}

let seq = 0
const p = (
  name: string,
  commodity: MineralCommodity,
  stage: string,
  province: string,
  operator: string,
  extra?: Partial<MineralProject>,
): MineralProject => {
  const base = PROV_COORD[province] ?? [-34, -66]
  seq += 1
  return {
    slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    name,
    commodity,
    stage,
    province,
    operator,
    lat: base[0] + Math.sin(seq * 2.7) * 0.9,
    lng: base[1] + Math.cos(seq * 1.9) * 0.9,
    ...extra,
  }
}

export const PROJECTS: MineralProject[] = [
  p('Altar', 'copper', 'PEA', 'San Juan', 'Aldebaran Resources Inc.', { ley: '0.43 %', recurso: '7.85K MIbs', capexMUSD: 1600 }),
  p('Arizaro', 'lithium', 'Pre Feasibility', 'Salta', 'Minera Arli SA', { recurso: '261K t', capexMUSD: 1100 }),
  p('Calcatreu', 'gold', 'Construction', 'Río Negro', 'Minera Calcatreu SAU', { ley: '2.1 g/t', recurso: '669 kOz' }),
  p('Candelas', 'lithium', 'Preliminary Economic Evaluation', 'Catamarca', 'Galan Exploraciones S.A', { recurso: '1.28K t', capexMUSD: 408 }),
  p('Casposo', 'gold', 'Operation', 'San Juan', 'Casposo Argentina Ltd.', { ley: '1.5 g/t', recurso: '42 kOz' }),
  p('Cauchari', 'lithium', 'Pre Feasibility', 'Jujuy', 'Minerales Australes S.A.'),
  p('Cauchari - Olaroz', 'lithium', '—', 'Jujuy', '—', { recurso: '4.72M t' }),
  p('Cauchari Jv', 'lithium', 'Pre Feasibility', 'Jujuy', 'South American Salars', { recurso: '1.9M t', capexMUSD: 659 }),
  p('Centenario-Ratones', 'lithium', 'Operation', 'Salta', 'Eramine Sudamerica S.A.', { recurso: '6.21M t' }),
  p('Cerro Moro', 'gold', 'Operation', 'Santa Cruz', 'Estelar Resources Limited S.A', { ley: '4.9 g/t', recurso: '39.2 kOz' }),
  p('Cerro Negro', 'gold', 'Operation', 'Santa Cruz', 'OroPlata S.A.', { ley: '3.7 g/t', recurso: '200 kOz' }),
  p('Cerro Vanguardia', 'gold', 'Operation', 'Santa Cruz', 'Cerro Vanguardia S.A.', { ley: '2.5 g/t', recurso: '560 kOz' }),
  p('Cu Los Azules', 'copper', 'Feasibility', 'San Juan', 'Minera Andes Inc.', { recurso: '20 Blbs', capexMUSD: 3200 }),
  p('Cu PSJ Cobre Mendocino', 'copper', 'Prefeasibility', 'Mendoza', 'Minera San Jorge S.A.', { ley: '0.57 %', recurso: '999K klb', capexMUSD: 560 }),
  p('Cu Pachón', 'copper', 'Feasibility', 'San Juan', 'El Pachón S.A', { ley: '0.66 %', capexMUSD: 9500 }),
  p('Cu Taca Taca', 'copper', 'Feasibility', 'Salta', 'Corriente Argentina S.A.', { ley: '0.42 %', recurso: '389 kt' }),
  p('Diablillos', 'silver', 'Feasibility', 'Catamarca', 'AbraSilver Resource Corp.', { ley: '59.0 g/t', recurso: '13.4K kOz', capexMUSD: 620 }),
  p('Don Nicolás-Las Calandrias', 'gold', 'Operation', 'Santa Cruz', 'Cerrado Gold Inc.', { ley: '1.0 g/t' }),
  p('Don Otto', 'uranium', 'Feasibility', 'Salta', 'CNEA', { recurso: '180 t' }),
  p('El Quevar', 'silver', 'PEA', 'Salta', 'Argenta Silver Corp. / SILEX Argentina S.A.', { capexMUSD: 97 }),
  p('Farallón Negro', 'gold', 'Operation', 'Catamarca', 'YMAD'),
  p('Fenix', 'lithium', '—', 'Catamarca', '—', { recurso: '2.7M t' }),
  p('Gualcamayo - Carbonatos Profundos', 'gold', 'Operation', 'San Juan', 'Minas Argentinas S.A', { ley: '3.3 g/t', recurso: '376 kOz' }),
  p('Hombre Muerto Norte', 'lithium', 'Preliminary Economic Evaluation', 'Catamarca', 'Nrg Metals Argentina S.A.', { recurso: '1.46M t' }),
  p('Hombre Muerto Oeste', 'lithium', 'Construction', 'Catamarca', 'Galan Litio S.A', { recurso: '4.74M t' }),
  p('Hualilán', 'gold', 'Prefeasibility', 'San Juan', 'Golden Mining S.A.', { ley: '1.1 g/t' }),
  p('Ivana', 'uranium', 'Preliminary Economic Assessments', 'Río Negro', 'Ivana Minerales S.A.', { recurso: '17 MLbs' }),
  p('Kachi', 'lithium', 'Feasibility', 'Catamarca', 'Lake Resources / Lilac Solutions', { recurso: '4.19M t' }),
  p('La Providencia', 'silver', 'Operation', 'Jujuy', 'Hanaq Argentina S.A.'),
  p('Laguna Salada', 'uranium', 'Preliminary Economic Assessments', 'Chubut', 'Jaguar Uranium Corp.', { recurso: '6.3 MLbs' }),
  p('Sal de Oro', 'lithium', 'Operation', 'Buenos Aires', 'POSCO Argentina S.A.'),
  p('Sal de Vida', 'lithium', 'Construction', 'Catamarca', 'Galaxy Lithium Sal de Vida S.A.', { recurso: '3.5M t' }),
  p('Sal de los Ángeles', 'lithium', 'Construction', 'Salta', 'Potasio y Litio Argentina S.A.', { recurso: '1.04M t' }),
  p('Lindero', 'gold', 'Operation', 'Salta', 'Mansfield Minera S.A', { ley: '0.5 g/t' }),
  p('Tres Quebradas', 'lithium', 'Operation', 'Catamarca', 'LIEX S.A.', { recurso: '2.33M t' }),
  p('Mara - Agua Rica', 'copper', 'Feasibility', 'Catamarca', 'Minera Agua Rica', { recurso: '0.8 kt' }),
  p('Mariana', 'lithium', 'Operation', 'Salta', 'Litio Minera Argentina', { recurso: '4.44M t' }),
  p('Navidad', 'silver', 'PEA', 'Chubut', 'Pan American Silver Corp.', { recurso: '67K kOz' }),
  p('Olaroz', 'lithium', 'Operation', 'Jujuy', 'Sales de Jujuy SA', { recurso: '8.5M t' }),
  p('Pozuelos', 'lithium', 'Feasibility', 'Salta', 'Lithea Inc.', { recurso: '13.2M t' }),
  p('Puna Operation', 'silver', 'Operation', 'Jujuy', 'SSR Mining Inc. / Mina Pirquitas S.A', { ley: '239.0 g/t', recurso: '18K kOz' }),
  p('Río Grande', 'lithium', '—', 'Salta', '—', { recurso: '2.09M t' }),
  p('Salar Tolillar', 'lithium', 'Preliminary Economic Evaluation', 'Salta', 'Alpha Lithium Argentina S.A.', { recurso: '3.63M t' }),
  p('Salar del Rincón', 'lithium', 'Construction', 'Catamarca', 'Rincon Mining Ltda.', { recurso: '1.54M t' }),
  p('San José', 'silver', 'Operation', 'Santa Cruz', 'Hochschild / McEwen · Minera Santa Cruz S.A.', { ley: '412.0 g/t', recurso: '12.6K kOz' }),
  p('Sierra Pintada', 'uranium', '—', 'Mendoza', '—', { recurso: '3.9K t' }),
  p('Suyai', 'gold', 'Feasibility', 'Chubut', 'Suyai Del Sur S.A.', { ley: '15.1 g/t', recurso: '274 kOz' }),
  p('Taguas', 'gold', 'PEA', 'San Juan', 'Compañía Minera Piuquenes S.A.', { ley: '0.4 g/t' }),
  p('Veladero', 'gold', 'Operation Ampliation', 'San Juan', 'Minera Andina Del Sol', { ley: '0.7 g/t', recurso: '530 kOz' }),
  p('Vicuña (Filo del Sol)', 'copper', 'Prefeasibility', 'San Juan', '—'),
]

/** Provincias principales (conteo real del hub) */
export const PROJECTS_BY_PROVINCE = [
  { name: 'Catamarca', count: 11 },
  { name: 'Salta', count: 11 },
  { name: 'San Juan', count: 10 },
  { name: 'Santa Cruz', count: 5 },
  { name: 'Jujuy', count: 5 },
  { name: 'Chubut', count: 3 },
  { name: 'Mendoza', count: 2 },
  { name: 'Río Negro', count: 2 },
]

/* ============ URANIO — vacamuerta.io/minerals/uranium (real) ============ */

export const URANIUM_STATS = {
  priceUsdLb: 86.35,
  priceChangePct: 2.49,
  priceAsOf: 'abr 2026',
  rangeMin: { value: 7.1, when: 'ene 2001' },
  rangeMax: { value: 136.22, when: 'jun 2007' },
  resourcesTU: 33_650,
  historicTU: 2_600,
  projects: 21,
  provinces: 6,
  companies: 7,
  advanced: 8,
}

export type UraniumProject = {
  name: string
  province: string
  stage: string
  company: string
  origin: string
}

export const URANIUM_PROJECTS: UraniumProject[] = [
  { name: 'Amarillo Grande (Anit, Sta. Bárbara)', province: 'Río Negro', stage: 'Exploración avanzada', company: 'Blue Sky Uranium Corp.', origin: 'Canadá' },
  { name: 'Arroyo Perdido', province: 'Chubut', stage: 'Exploración inicial', company: 'CNEA', origin: 'Argentina' },
  { name: 'Cateos', province: 'Neuquén', stage: 'Prospección', company: '—', origin: '—' },
  { name: 'Catriel (Mari)', province: 'Río Negro', stage: 'Exploración inicial', company: 'CNEA', origin: 'Argentina' },
  { name: 'Cerro Solo', province: 'Chubut', stage: 'Exploración avanzada', company: 'CNEA', origin: 'Argentina' },
  { name: 'Chihuidos', province: 'Neuquén', stage: 'Exploración inicial', company: 'Blue Sky Uranium Corp.', origin: 'Canadá' },
  { name: 'Corcovo', province: 'Mendoza', stage: 'Exploración inicial', company: 'Blue Sky Uranium Corp.', origin: 'Canadá' },
  { name: 'Don Otto', province: 'Salta', stage: 'Factibilidad', company: 'CNEA', origin: 'Argentina' },
  { name: 'Hope', province: 'Chubut', stage: 'Prospección', company: '—', origin: '—' },
  { name: 'Huemules', province: 'Mendoza', stage: 'Exploración inicial', company: 'Jaguar Uranium Corp.', origin: 'Canadá' },
  { name: 'Ivana (Amarillo Grande)', province: 'Río Negro', stage: 'Evaluación Económica Preliminar', company: 'Blue Sky Uranium Corp.', origin: 'Canadá' },
  { name: 'Kaia', province: 'Río Negro', stage: 'Prospección', company: '—', origin: '—' },
  { name: 'Lago Seco', province: 'Chubut', stage: 'Prospección', company: '—', origin: '—' },
  { name: 'Laguna Colorada', province: 'Chubut', stage: 'Exploración avanzada', company: 'CNEA', origin: 'Argentina' },
  { name: 'Laguna Salada', province: 'Chubut', stage: 'Evaluación Económica Preliminar', company: 'Jaguar Uranium Corp.', origin: 'Canadá' },
  { name: 'Lucho U', province: 'Río Negro', stage: 'Prospección', company: 'Lucero Claudio Guillermo-Unipersonal', origin: '—' },
  { name: 'Meseta Central', province: 'Chubut', stage: 'Exploración avanzada', company: 'UrAmérica Ltd.', origin: 'Reino Unido' },
  { name: 'Meseta Sirven (Laguna Sirve)', province: 'Santa Cruz', stage: 'Exploración inicial', company: 'CNEA', origin: 'Argentina' },
  { name: 'Sierra Cuadrada', province: 'Chubut', stage: 'Prospección', company: 'CNEA', origin: 'Argentina' },
  { name: 'Sierra Pintada', province: 'Mendoza', stage: 'Factibilidad', company: 'CNEA', origin: 'Argentina' },
  { name: 'Sofia', province: 'Santa Cruz', stage: 'Exploración inicial', company: 'Fomicruz S.E', origin: 'Argentina' },
]

/** Distribución real por etapa */
export const URANIUM_BY_STAGE = [
  { stage: 'Exploración inicial', count: 7 },
  { stage: 'Prospección', count: 6 },
  { stage: 'Exploración avanzada', count: 4 },
  { stage: 'Evaluación Económica Preliminar', count: 2 },
  { stage: 'Factibilidad', count: 2 },
]

/** Serie ilustrativa (la real tiene 436 puntos 1990–2026): termina en el precio real */
export const URANIUM_PRICE_SERIES = Array.from({ length: 24 }, (_, i) => {
  const year = 2024 + Math.floor((5 + i) / 12)
  const month = ((5 + i) % 12) + 1
  const t = i / 23
  const v = 62 + (URANIUM_STATS.priceUsdLb - 62) * t + Math.sin(i / 2.4) * 4
  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    usdLb: Math.round((i === 23 ? URANIUM_STATS.priceUsdLb : v) * 100) / 100,
  }
})
