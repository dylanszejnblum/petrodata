/* Tipos de la API de inversiones (espejo de frontend/src/api/inversiones.ts
   y del OperatorContributionDto), acotados a lo que la página consume. */

type InvSource = { label: string; url?: string; asOf: string }

export type InvKpi = {
  id: string
  label: string
  tier: string
  figure: { kind: string; value: number }
  delta?: { pct: number; base: string } | null
  format: { prefix?: string; suffix?: string; decimals: number }
  source: InvSource
}

export type InvSeriePoint = {
  period: string
  oilBblD: number
  gasMm3D?: number | null
  preliminary: boolean
}

export type InvBreakeven = {
  brentUsd: number
  brentAsOf?: string
  referenceUsd: number
  headroomUsd: number
  tier?: string
  series?: { date: string; value: number }[]
  source: InvSource
  referenceSource: { label: string; url?: string }
}

export type InvActividad = {
  unit: string
  source: InvSource
  points: { period: string; nuevosPozos: number; preliminary: boolean }[]
}

export type InvCruce = {
  id: string
  title: string
  unit: string
  source: InvSource
  gdpSource?: { label: string; url?: string } | null
  points: {
    period: string
    agroUsd: number | null
    energiaUsd: number | null
    gdpUsd?: number | null
    agroPctGdp: number | null
    energiaPctGdp: number | null
    tier?: string
  }[]
}

export type InvOperador = {
  slug: string
  name: string
  oilBblD: number
  boe?: number
  sharePct: number
}

export type InvMundoRanking = {
  product: string
  label: string
  unit: string
  year: number
  countries: number
  source: InvSource
  argentina: { rank: number; value: number } | null
  projected: { value: number; rank: number; year: number; tier?: string }
  top: { rank: number; iso3: string; country: string; value: number; isArgentina: boolean }[]
  /* El puesto de Argentina año a año. Estaba como `unknown` y por eso nadie lo
     usaba: son veintiséis puntos que cuentan que el país cayó del 20.º al 29.º
     y recuperó ocho desde 2019, que es lo que le da sentido al #21 de hoy. */
  history?: { year: number; rank: number; value: number; countries: number }[]
}

export type InvMundoGrowth = {
  product: string
  label: string
  unit: string
  sinceYear: number
  toYear: number
  leaders: {
    iso3: string
    country: string
    from: number
    to: number
    growthPct: number
    isArgentina: boolean
  }[]
  argentinaRank: number | null
  source: InvSource
}

export type InvPolicyChart = {
  id: string
  title: string
  unit: string
  kind: 'area' | 'line' | 'bar'
  source: InvSource
  points: { period: string; value: number }[]
}

export type InvRigi = {
  title: string
  subtitle: string
  count: number
  totalMusd: number
  projects: {
    name: string
    sector: string
    operator?: string | null
    province?: string | null
    investmentMusd: number | null
    approvalDate?: string | null
    sourceUrl?: string | null
  }[]
  source: InvSource
}

export type InvPolitica = {
  intro: { title: string; text: string }
  charts: InvPolicyChart[]
  rigi?: InvRigi | null
  impacto?: {
    headline: string
    items: { label: string; value: number; format: InvKpi['format']; tier: string }[]
    assumptions: {
      priceUsd?: number | null
      priceBasis?: string | null
      todayBblD?: number | null
      targetBblD?: number | null
      gdpUsd?: number | null
      gdpYear?: number | null
    }
    source: InvSource
  } | null
}

export type InvMundo = {
  source: { label: string; url?: string; asOf?: string }
  rankings: InvMundoRanking[]
  fastestGrowing: InvMundoGrowth[]
  shale?: unknown
  politica?: InvPolitica
}

/* — Mini-viz del bento de KPIs (construido en _lib/kpiViz.ts, consumido
     por el componente KpiBento) — */

/* Cómo se lee el valor de la serie en el tooltip de hover:
   number → entero es-AR + sufijo ("620.249 bbl/d") · usd → compacto
   ("US$1,1B"), con scale para series guardadas en otra unidad (MM). */
export type MiniTipSpec =
  | { kind: 'number'; suffix?: string }
  | { kind: 'usd'; scale?: number }

/* Fila del desglose VM vs resto: valor absoluto derivado (nacional =
   VM ÷ participación) + % — receta del 06 en 2 filas */
export type ShareRow = { label: string; value: string; pct: number }

/* Mini-viz por KPI: SIEMPRE con series reales ya scrapeadas (nada
   simulado); share usa el desglose de filas en lugar de serie. */
export type KpiViz =
  | {
      kind: 'area' | 'line' | 'bars' | 'signed-bars'
      color: string
      data: { x: string; y: number }[]
      tip: MiniTipSpec
    }
  | { kind: 'share'; color: string; rows: ShareRow[] }

export type Contribution = {
  window: { from: string; to: string; months: number }
  totals: {
    oil_bbl: number
    gas_mcf: number
    boe: number
    gross_value_usd: number
    gross_value_annualized_usd: number
    royalties_usd: number
    energy_exports_usd: number | null
    gdp_usd: number | null
    gdp_year: number | null
    value_share_of_gdp: number | null
  }
  assumptions: {
    brent_avg_usd_bbl: number | null
    oil_discount_usd_bbl: number
    gas_pist_avg_usd_mmbtu: number | null
    mcf_to_mmbtu: number
    royalty_rate: number
  }
  operators: {
    operator_slug: string
    operator_name: string
    oil_bbl: number
    gas_mcf: number
    boe: number
    share_boe: number
    share_oil: number
    share_gas: number
    oil_value_usd: number
    gas_value_usd: number
    gross_value_usd: number
    gross_value_annualized_usd: number
    attributed_exports_usd: number | null
    royalties_usd: number
    value_share_of_gdp: number | null
  }[]
}
