import { api } from './client'

// The NestJS endpoint does not emit a response schema into openapi.json, so the
// generated types leave this payload untyped. We model the getPage() output here.

export interface InvSource {
  label: string
  url: string
  asOf: string
}

export interface InvKpi {
  id: string
  label: string
  tier: string
  figure: { kind: 'point'; value: number }
  delta?: { pct: number; base: 'YoY' }
  format: { prefix?: string; suffix?: string; decimals: number }
  source: InvSource
}

export interface InvSeriePoint {
  period: string
  oilBblD: number
  gasMm3D: number
  preliminary: boolean
}

export interface InvSerie {
  id: string
  title: string
  unit: string
  source: InvSource
  points: InvSeriePoint[]
}

export interface InvOperador {
  slug: string
  name: string
  oilBblD: number
  boe: number
  sharePct: number
}

export interface InvExportaciones {
  energiaUsd: number
  porSector: { sector: string; usd: number }[]
  source: InvSource
}

export interface InvBreakeven {
  brentUsd: number
  brentAsOf: string
  referenceUsd: number
  headroomUsd: number
  tier: string
  // Trailing window of measured Brent for the trend chart. Optional: absent
  // until the backend deploys the series; the component degrades gracefully.
  series?: { date: string; value: number }[]
  source: InvSource
  referenceSource: { label: string; url?: string }
}

export interface InvActividad {
  unit: string
  source: InvSource
  points: { period: string; nuevosPozos: number; preliminary: boolean }[]
}

export interface InvCrucePoint {
  period: string
  agroUsd: number | null
  energiaUsd: number | null
  gdpUsd: number | null
  agroPctGdp: number | null
  energiaPctGdp: number | null
  tier: string
}

export interface InvCruce {
  id: string
  title: string
  unit: string
  source: InvSource
  gdpSource: { label: string; url: string } | null
  points: InvCrucePoint[]
}

// "Argentina en el mundo" — world-stage ranking block (EIA International).
export interface InvMundoRankRow {
  rank: number
  iso3: string
  country: string
  value: number
  isArgentina: boolean
}

export interface InvMundoHistory {
  year: number
  rank: number
  value: number
  countries: number
}

export interface InvMundoRanking {
  product: 'oil' | 'gas'
  label: string
  unit: string
  year: number
  countries: number
  source: InvSource
  argentina: { rank: number; value: number } | null
  projected: { value: number; rank: number; year: number; tier: string }
  top: InvMundoRankRow[]
  history: InvMundoHistory[]
}

export interface InvMundoGrowthLeader {
  iso3: string
  country: string
  from: number
  to: number
  growthPct: number
  isArgentina: boolean
}

export interface InvMundoGrowth {
  product: 'oil' | 'gas'
  label: string
  unit: string
  sinceYear: number
  toYear: number
  leaders: InvMundoGrowthLeader[]
  argentinaRank: number | null
  source: InvSource
}

// Política → impacto — policy levers, each with a measurable indicator, plus the
// computed GDP payoff of reaching the production target.
export interface InvPolicyIndicator {
  label: string
  value: number
  format: { prefix?: string; suffix?: string; decimals: number }
  delta?: { pct: number; base: 'YoY' }
  tier: string
  source: InvSource
}

export interface InvPolicyLever {
  tag: string
  title: string
  indicator: InvPolicyIndicator | null
  chartId?: string
  milestone?: string
  source?: InvSource
}

export interface InvPolicyChart {
  id: string
  title: string
  unit: string
  kind: 'line' | 'area' | 'bar'
  source: InvSource
  points: { period: string; value: number }[]
}

export interface InvPoliticaImpacto {
  headline: string
  items: {
    label: string
    value: number
    format: { prefix?: string; suffix?: string; decimals: number }
    tier: string
  }[]
  assumptions: {
    priceUsd: number | null
    priceBasis: string
    todayBblD: number | null
    targetBblD: number | null
    gdpUsd: number | null
    gdpYear: number | null
  }
  source: InvSource
}

export interface InvRigiProject {
  name: string
  sector: string // 'petroleo' | 'gas'
  operator: string | null
  province: string | null
  investmentMusd: number | null
  approvalDate: string | null
  sourceUrl: string | null
}

export interface InvRigi {
  title: string
  subtitle: string
  count: number
  totalMusd: number
  projects: InvRigiProject[]
  source: InvSource
}

export interface InvPolitica {
  intro: { title: string; text: string }
  levers: InvPolicyLever[]
  charts: InvPolicyChart[]
  rigi?: InvRigi
  impacto?: InvPoliticaImpacto
}

export interface InvMundo {
  source: { label: string; url: string }
  rankings: InvMundoRanking[]
  fastestGrowing: InvMundoGrowth[]
  shale: {
    oilRank: number
    gasRank: number
    note: string
    tier: string
    source: { label: string; url: string }
  }
  politica?: InvPolitica
}

export interface InversionesData {
  asOf: string | null
  latestMonth?: string
  tier?: string
  note?: string
  headline: string
  kpis: InvKpi[]
  serie: InvSerie | null
  operadores: InvOperador[]
  exportaciones: InvExportaciones | null
  breakeven?: InvBreakeven
  actividad?: InvActividad
  cruce?: InvCruce
  mundo?: InvMundo
}

export async function fetchInversiones(
  lang: 'es' | 'en' = 'es',
): Promise<InversionesData | null> {
  try {
    // ISR: the underlying figures update monthly, so a 1h revalidate makes the
    // page near-instant while staying fresh. Tagged so we can on-demand purge
    // via `revalidateTag('inversiones')` from an admin hook if needed. The lang is
    // sent via Accept-Language (the backend localizes the payload) and folded into
    // a per-locale tag so each language caches separately.
    const { data, error } = await api.GET('/api/v2/inversiones', {
      headers: { 'Accept-Language': lang },
      next: { revalidate: 3600, tags: ['inversiones', `inversiones-${lang}`] },
    })
    if (error || !data) return null
    const body = (data as unknown as { data: InversionesData }).data
    if (!body || !body.asOf) return null
    return body
  } catch {
    return null
  }
}
