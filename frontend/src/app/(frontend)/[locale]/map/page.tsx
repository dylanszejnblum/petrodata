import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'

const MapExperience = nextDynamic(
  () => import('@/components/Petrodata/MapExperience').then((m) => ({ default: m.MapExperience })),
  {
    loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" />,
  },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav')
  return {
    title: t('oilGasFull'),
    alternates: buildAlternates('/map'),
  }
}

type WellFeatureCollection = ApiSchemas['GeoWellFeatureCollectionDto']
type LatestSummary = ApiSchemas['LatestSummaryDto']
type OperatorItem = ApiSchemas['OperatorListItemDto']
type OperatorPoint = ApiSchemas['OperatorTimeSeriesPointDto']

const EMPTY_WELLS: WellFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
} as WellFeatureCollection

async function getInitialWells(operator?: string): Promise<WellFeatureCollection> {
  try {
    const { data, error } = await api.GET('/api/v1/geo/wells', {
      params: { query: operator ? { limit: 1000, operator } : { limit: 1000 } },
      cache: 'no-store',
    })
    if (error || !data) return EMPTY_WELLS
    return data
  } catch {
    return EMPTY_WELLS
  }
}

async function getLatest(): Promise<LatestSummary | null> {
  try {
    const { data, error } = await api.GET('/api/v1/production/latest', { cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function getOperators(): Promise<OperatorItem[]> {
  try {
    const { data, error } = await api.GET('/api/v1/operators', {
      params: { query: { sort: 'boe', order: 'desc' } },
      cache: 'no-store',
    })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getOperatorSeries(slug: string): Promise<OperatorPoint[]> {
  try {
    const { data, error } = await api.GET('/api/v1/operators/{slug}/production', {
      params: { path: { slug } },
      cache: 'no-store',
    })
    if (error || !data) return []
    return data.data.slice(-12)
  } catch {
    return []
  }
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ operator?: string }>
}) {
  const { operator } = await searchParams
  const [tCommon, wells, latest, operators] = await Promise.all([
    getTranslations('common'),
    getInitialWells(operator),
    getLatest(),
    getOperators(),
  ])
  const topSlug = operators[0]?.operator_slug
  const topSeries = topSlug ? await getOperatorSeries(topSlug) : []

  if (!latest || operators.length === 0) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <NothingHeader />
        <main className="flex flex-1 min-h-0 items-center justify-center text-nd-text-disabled text-sm font-mono">
          {tCommon('backendOffline', {
            url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
          })}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <NothingHeader />
      <main className="flex-1 min-h-0 w-full">
        <MapExperience
          initialWells={wells}
          latest={latest}
          operators={operators}
          topOperatorTimeSeries={topSeries}
          initialOperator={operator ?? null}
        />
      </main>
    </div>
  )
}
