import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { RefreshCw } from 'lucide-react'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { formatMonth } from '@/utilities/formatNumber'
import { getSocialImageURL } from '@/utilities/getSocialImageURL'
import { buildAlternates } from '@/i18n/alternates'
import { AnimatedCounter } from '@/components/Petrodata/dashboard/AnimatedCounter'
import { HeroCards, type StatCardData } from '@/components/Petrodata/dashboard/HeroCards'
import { VmShareDonut } from '@/components/Petrodata/dashboard/VmShareDonut'
import { TopOperatorsMini } from '@/components/Petrodata/dashboard/TopOperatorsMini'
import {
  operatorColor,
  type ChartRow,
  type OperatorSeriesMeta,
} from '@/components/Petrodata/dashboard/operatorPalette'
import type { SparkPoint } from '@/components/Petrodata/dashboard/Sparkline'

const ProductionChart = nextDynamic(
  () =>
    import('@/components/Petrodata/dashboard/ProductionChart').then((m) => ({
      default: m.ProductionChart,
    })),
  { loading: () => <div className="h-[280px] md:h-[400px] w-full animate-pulse bg-nd-surface-raised" /> },
)

const MapPreview = nextDynamic(
  () =>
    import('@/components/Petrodata/dashboard/MapPreview').then((m) => ({ default: m.MapPreview })),
  { loading: () => <div className="h-[280px] w-full animate-pulse bg-nd-surface-raised" /> },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: buildAlternates('/'),
    openGraph: {
      images: [{ url: getSocialImageURL(), width: 1200, height: 630, alt: 'Vaca Muerta dashboard' }],
    },
  }
}

type LatestSummary = ApiSchemas['LatestSummaryDto']
type OperatorListItem = ApiSchemas['OperatorListItemDto']
type OperatorPoint = ApiSchemas['OperatorTimeSeriesPointDto']
type WellFC = ApiSchemas['GeoWellFeatureCollectionDto']
type DataFreshness = ApiSchemas['DataFreshnessDto']

const EMPTY_FC: WellFC = { type: 'FeatureCollection', features: [] } as WellFC
const TOP_N_OPERATORS = 5

async function getLatest(): Promise<LatestSummary | null> {
  try {
    const { data, error } = await api.GET('/api/v1/production/latest', { cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function getOperators(): Promise<OperatorListItem[]> {
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
    return data.data
  } catch {
    return []
  }
}

async function getWells(): Promise<WellFC> {
  try {
    const { data, error } = await api.GET('/api/v1/geo/wells', {
      params: { query: { formation: 'vaca_muerta', limit: 1000 } },
      cache: 'no-store',
    })
    if (error || !data) return EMPTY_FC
    return data
  } catch {
    return EMPTY_FC
  }
}

async function getFreshness(): Promise<DataFreshness | null> {
  try {
    const { data, error } = await api.GET('/api/v1/data-freshness', { cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

/**
 * Build the union of monthly buckets across the top-N operators.
 * Returns last 12 months sorted ascending.
 */
function buildChartRows(
  series: { slug: string; points: OperatorPoint[] }[],
): ChartRow[] {
  const bucket = new Map<string, ChartRow>()
  for (const { slug, points } of series) {
    for (const p of points) {
      const row = bucket.get(p.date_month) ?? ({ date_month: p.date_month } as ChartRow)
      row[slug] = (row[slug] ?? 0) + p.boe
      bucket.set(p.date_month, row)
    }
  }
  return [...bucket.values()]
    .sort((a, b) => a.date_month.localeCompare(b.date_month))
    .slice(-12)
}

/** national-ish monthly totals derived from the top-N series (proxy). */
function buildNationalSeries(rows: ChartRow[], slugs: string[]) {
  return rows.map((row) => {
    let boe = 0
    let oilBblD = 0
    let gasMmcfD = 0
    let wells = 0
    for (const slug of slugs) {
      boe += row[slug] ?? 0
    }
    return { date_month: row.date_month, boe, oilBblD, gasMmcfD, wells }
  })
}

function computeMoM(values: number[]): number | null {
  if (values.length < 2) return null
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  if (!Number.isFinite(prev) || prev === 0) return null
  return (last - prev) / prev
}

function toSparkPoints(values: number[]): SparkPoint[] {
  return values.map((y, i) => ({ x: String(i), y }))
}

export default async function DashboardPage() {
  const [t, tCommon, latest, operators, wells, freshness] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('common'),
    getLatest(),
    getOperators(),
    getWells(),
    getFreshness(),
  ])

  const topOperators = operators.slice(0, TOP_N_OPERATORS)
  const series = await Promise.all(
    topOperators.map(async (op) => ({
      slug: op.operator_slug,
      name: op.operator_name,
      points: await getOperatorSeries(op.operator_slug),
    })),
  )

  const chartRows = buildChartRows(series)
  const slugs = topOperators.map((op) => op.operator_slug)
  const nationalSeries = buildNationalSeries(chartRows, slugs)

  const operatorMeta: OperatorSeriesMeta[] = topOperators.map((op, i) => ({
    slug: op.operator_slug,
    name: op.operator_name,
    color: operatorColor(op.operator_slug, i),
  }))

  if (!latest) {
    return (
      <>
        <NothingHeader />
        <main className="flex-1 flex items-center justify-center text-nd-text-disabled text-sm font-mono">
          {tCommon('backendOffline', {
            url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
          })}
        </main>
      </>
    )
  }

  // MoM derivations off the top-N national proxy series.
  const boeSpark = toSparkPoints(nationalSeries.slice(-4).map((r) => r.boe))
  const boeMoM = computeMoM(nationalSeries.map((r) => r.boe))

  // For oil/gas/wells MoM we need per-operator oil/gas time series too. The
  // /operators/{slug}/production endpoint returns those fields. Re-aggregate:
  const oilSeries = chartRows.map((row) => {
    let v = 0
    for (const { points } of series) {
      const p = points.find((pp) => pp.date_month === row.date_month)
      if (p) v += p.oil_bbl_d
    }
    return v
  })
  const gasSeries = chartRows.map((row) => {
    let v = 0
    for (const { points } of series) {
      const p = points.find((pp) => pp.date_month === row.date_month)
      if (p) v += p.gas_mmcf_d
    }
    return v
  })
  const wellsSeries = chartRows.map((row) => {
    let v = 0
    for (const { points } of series) {
      const p = points.find((pp) => pp.date_month === row.date_month)
      if (p) v += p.active_wells
    }
    return v
  })
  const oilMoM = computeMoM(oilSeries)
  const gasMoM = computeMoM(gasSeries)
  const wellsMoM = computeMoM(wellsSeries)

  const heroCards: StatCardData[] = [
    {
      label: t('kpi.oilLatest'),
      value: latest.oil_bbl_d,
      format: 'compact',
      unit: 'bbl/d',
      mom: oilMoM,
      momSuffix: t('kpi.momSuffix'),
      sparkline: toSparkPoints(oilSeries.slice(-4)),
      accent: 'var(--nd-accent)',
    },
    {
      label: t('kpi.gasLatest'),
      value: latest.gas_mmcf_d,
      format: 'compact',
      unit: 'MMcf/d',
      mom: gasMoM,
      momSuffix: t('kpi.momSuffix'),
      sparkline: toSparkPoints(gasSeries.slice(-4)),
      accent: 'var(--nd-accent)',
    },
    {
      label: t('kpi.vmShare'),
      value: latest.vm_share.boe * 100,
      format: 'percent',
      mom: null,
      momSuffix: t('kpi.momSuffix'),
      sparkline: boeSpark,
      accent: 'var(--nd-accent)',
    },
    {
      label: t('kpi.activeWells'),
      value: latest.active_wells,
      format: 'integer',
      mom: wellsMoM,
      momSuffix: t('kpi.momSuffix'),
      sparkline: toSparkPoints(wellsSeries.slice(-4)),
      accent: 'var(--nd-accent)',
    },
  ]

  const totalWellsCount = freshness?.tables.dim_well?.rows ?? null
  const headlineBoe = nationalSeries.length > 0 ? nationalSeries[nationalSeries.length - 1].boe : latest.boe
  const monthLabel = formatMonth(latest.date_month as string | null | undefined)

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        {/* HERO */}
        <section className="container pt-12 md:pt-20 pb-8 md:pb-10">
          <div className="flex flex-col gap-2">
            <span
              className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase font-mono"
            >
              {t('eyebrow', { month: monthLabel.toUpperCase() })}
            </span>
            <h1
              className="mt-2 text-balance text-[2rem] sm:text-5xl md:text-7xl lg:text-8xl leading-none tabular-nums font-display break-words"
              style={{
                color: 'var(--nd-text-display)',
              }}
            >
              <AnimatedCounter to={headlineBoe} kind="integer" duration={1600} />{' '}
              <span
                className="text-nd-text-disabled text-lg sm:text-2xl md:text-3xl font-mono"
              >
                {t('boeSuffix')}
              </span>
            </h1>
            <p
              className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans"
            >
              {t('tagline')}
            </p>
          </div>

          <div className="mt-10">
            <HeroCards cards={heroCards} />
          </div>
        </section>

        {/* THREE-PANEL */}
        <section className="container pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-nd-border">
            <VmShareDonut shareBoe={latest.vm_share.boe} />
            <TopOperatorsMini
              rows={topOperators.map((op) => ({
                slug: op.operator_slug,
                name: op.operator_name,
                boe: op.boe,
              }))}
            />
            <MapPreview wells={wells} totalWells={totalWellsCount} />
          </div>
        </section>

        {/* PRODUCTION CHART */}
        <section className="container pb-10">
          <div className="bg-nd-surface border border-nd-border p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <span
                  className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block font-mono"
                >
                  {t('chart.eyebrow')}
                </span>
                <h2
                  className="mt-2 text-balance text-2xl md:text-3xl leading-none text-nd-text-display font-display"
                >
                  {t('chart.title')}
                </h2>
              </div>
              <span
                className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono"
              >
                {t('chart.topStacked', { n: topOperators.length })}
              </span>
            </div>
            <ProductionChart rows={chartRows} operators={operatorMeta} />
          </div>
        </section>

        {/* DATA FRESHNESS BAR */}
        <section className="container pb-10">
          <div
            className="border border-nd-border bg-nd-surface px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={11} />
              {t('freshness.dataThrough', { month: monthLabel })}
            </span>
            <span>{t('freshness.source')}</span>
          </div>
        </section>

      </main>
      <NothingFooter />
    </>
  )
}
