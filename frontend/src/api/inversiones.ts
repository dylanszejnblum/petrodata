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
  source: InvSource
  referenceSource: { label: string; url?: string }
}

export interface InvActividad {
  unit: string
  source: InvSource
  points: { period: string; nuevosPozos: number; preliminary: boolean }[]
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
}

export async function fetchInversiones(): Promise<InversionesData | null> {
  try {
    const { data, error } = await api.GET('/api/v2/inversiones', { cache: 'no-store' })
    if (error || !data) return null
    const body = (data as unknown as { data: InversionesData }).data
    if (!body || !body.asOf) return null
    return body
  } catch {
    return null
  }
}
