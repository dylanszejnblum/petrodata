import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { StatCard } from '@/components/Nothing/StatCard'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { CommodityRollupCard } from '@/components/Petrodata/minerals/CommodityRollupCard'
import { ProjectsTable } from '@/components/Petrodata/minerals/ProjectsTable'
import type { MineralsFeatureCollection } from '@/components/Petrodata/minerals/MineralsMap'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { LivePrices } from '@/components/Petrodata/minerals/PriceCard'
import { ProvinceBarChart } from '@/components/Petrodata/minerals/ProvinceBarChart'
import { StatusGroupChart } from '@/components/Petrodata/minerals/StatusGroupChart'
import { CapexChart } from '@/components/Petrodata/minerals/CapexChart'

const MineralsMap = nextDynamic(
  () =>
    import('@/components/Petrodata/minerals/MineralsMap').then((m) => ({ default: m.MineralsMap })),
  {
    loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" />,
  },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav')
  return {
    title: t('mineralsFull'),
    alternates: buildAlternates('/minerals'),
  }
}

type Summary = ApiSchemas['SummaryDto']
type Rollup = ApiSchemas['CommodityRollupDto']
type Project = ApiSchemas['ProjectListItemDto']
type Price = ApiSchemas['CommodityPriceDto']

const EMPTY_FC: MineralsFeatureCollection = { type: 'FeatureCollection', features: [] }

async function getSummary(): Promise<Summary | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/summary', { cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function getCommodities(): Promise<Rollup[]> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/commodities', { cache: 'no-store' })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getPrices(): Promise<Price[]> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/prices', { cache: 'no-store' })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/projects', {
      params: { query: { limit: 50, sort: 'project_name', order: 'asc' } },
      cache: 'no-store',
    })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getProjectCapex(
  name: string,
): Promise<string | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/projects/{name}', {
      params: { path: { name } },
      cache: 'no-store',
    })
    if (error || !data) return null
    const techEcon = data.data.technical_economic as Record<string, unknown> | null
    const raw = techEcon?.capex
    return typeof raw === 'string' ? raw : null
  } catch {
    return null
  }
}

async function getMap(): Promise<MineralsFeatureCollection> {
  // The OpenAPI spec leaves /minerals/map response untyped (content?: never),
  // so we hit the raw URL ourselves to grab the GeoJSON FeatureCollection.
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  try {
    const res = await fetch(`${baseUrl}/api/v2/minerals/map`, { cache: 'no-store' })
    if (!res.ok) return EMPTY_FC
    const json = (await res.json()) as MineralsFeatureCollection
    return json
  } catch {
    return EMPTY_FC
  }
}

export default async function MineralsOverviewPage() {
  const [t, tCommon, summary, commodities, projects, geojson, prices] = await Promise.all([
    getTranslations('mineralsPage'),
    getTranslations('common'),
    getSummary(),
    getCommodities(),
    getProjects(),
    getMap(),
    getPrices(),
  ])

  if (!summary) {
    return (
      <>
        <NothingHeader />
        <main
          className="flex-1 flex items-center justify-center text-nd-text-disabled text-sm"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {tCommon('backendOffline', {
            url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
          })}
        </main>
      </>
    )
  }

  const commodityCount = Object.keys(summary.by_commodity).length
  const producingCount = summary.by_status['Operation'] ?? 0
  const topProvinces = Object.entries(summary.by_province).sort(([, a], [, b]) => b - a).slice(0, 6)
  const topStatuses = Object.entries(summary.by_status).sort(([, a], [, b]) => b - a)

  // Fetch CAPEX strings for the first 20 projects in parallel so the CapexChart
  // can rank them. This is the only place we hit /projects/{name} from the
  // overview, so the extra calls are amortized over a single page render.
  const capexCandidates = projects.slice(0, 20)
  const capexTexts = await Promise.all(
    capexCandidates.map((p) => getProjectCapex(p.project_name)),
  )
  const capexRows = capexCandidates.map((p, i) => ({
    name: p.project_name,
    commodity: p.primary_commodity,
    capexText: capexTexts[i],
  }))

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="container pt-12 pb-8 md:pt-20 md:pb-10">
          <span
            className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {t('eyebrow')}
          </span>
          <h1
            className="mt-3 max-w-3xl text-balance text-4xl leading-none md:text-6xl"
            style={{
              fontFamily: 'Doto, var(--font-space-grotesk)',
              color: 'var(--nd-text-display)',
            }}
          >
            {t('heroTitle')}
          </h1>
          <p
            className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {t('heroBlurb', {
              total: summary.total_projects,
              commodities: commodityCount,
              sources: summary.data_sources.length,
            })}
          </p>
        </section>

        {/* Live prices */}
        <LivePrices quotes={prices} />

        {/* KPI strip */}
        <section className="container pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border">
            <StatCard
              label={t('kpi.totalProjects')}
              value={summary.total_projects.toString()}
              statusColor="neutral"
            />
            <StatCard
              label={t('kpi.commodities')}
              value={commodityCount.toString()}
              statusColor="neutral"
            />
            <StatCard
              label={t('kpi.inOperation')}
              value={producingCount.toString()}
              statusColor="success"
            />
            <StatCard
              label={t('kpi.dataSources')}
              value={summary.data_sources.length.toString()}
              statusColor="neutral"
            />
          </div>
        </section>

        {/* Commodity grid */}
        <section className="container pb-12">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span
                className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {t('commoditiesSection.eyebrow')}
              </span>
              <h2
                className="mt-2 text-balance text-3xl leading-none text-nd-text-display md:text-4xl"
                style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
              >
                {t('commoditiesSection.title')}
              </h2>
            </div>
            <p
              className="text-pretty text-sm leading-6 text-nd-text-secondary max-w-md"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {t('commoditiesSection.blurb')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-nd-border">
            {commodities.map((c) => (
              <CommodityRollupCard key={c.commodity} rollup={c} />
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="container pb-12">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span
                className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {t('mapSection.eyebrow')}
              </span>
              <h2
                className="mt-2 text-balance text-3xl leading-none text-nd-text-display md:text-4xl"
                style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
              >
                {t('mapSection.title')}
              </h2>
            </div>
            <Legend commodities={commodities.map((c) => c.commodity)} />
          </div>
          <div className="h-[60vh] min-h-[420px] overflow-hidden border border-nd-border bg-nd-surface">
            <MineralsMap
              data={geojson}
              legendCommodities={commodities.map((c) => c.commodity)}
            />
          </div>
        </section>

        {/* Provinces + status breakdown */}
        <section className="container pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-nd-border">
            <BreakdownCard title={t('breakdownTopProvinces')} rows={topProvinces} />
            <BreakdownCard title={t('breakdownByStatus')} rows={topStatuses} />
          </div>
        </section>

        {/* Charts panel */}
        <section className="container pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-nd-border">
            <ProvinceBarChart byProvince={summary.by_province} topN={8} />
            <StatusGroupChart byStatus={summary.by_status} />
            <CapexChart rows={capexRows} />
          </div>
        </section>

        {/* Project list */}
        <section className="container pb-20">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span
                className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {t('projectsSection.eyebrow')}
              </span>
              <h2
                className="mt-2 text-balance text-3xl leading-none text-nd-text-display md:text-4xl"
                style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
              >
                {t('projectsSection.title')}
              </h2>
            </div>
            <span
              className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('projectsSection.subtitle', { n: projects.length })}
            </span>
          </div>
          <ProjectsTable projects={projects} />
        </section>

        {/* Data freshness bar */}
        <section className="container pb-20">
          <div
            className="border border-nd-border bg-nd-surface px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <span>{summary.data_sources.join(' · ')}</span>
            <span>datos.energia.gob.ar · CC-BY 4.0</span>
          </div>
        </section>
      </main>
      <NothingFooter />
    </>
  )
}

function Legend({ commodities }: { commodities: string[] }) {
  if (commodities.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-3">
      {commodities.map((c) => {
        const { color } = commodityColor(c)
        return (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 text-nd-text-secondary text-[11px]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {c}
          </span>
        )
      })}
    </div>
  )
}

function BreakdownCard({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = rows.reduce((acc, [, v]) => Math.max(acc, v), 0)
  return (
    <div className="bg-nd-surface p-6">
      <span
        className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-4"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {title}
      </span>
      <ul className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <span
                className="text-nd-text-display truncate"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {label}
              </span>
              <span
                className="text-nd-text-secondary tabular-nums"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {value}
              </span>
            </div>
            <div className="h-[3px] bg-nd-surface-raised">
              <div
                className="h-full"
                style={{
                  width: `${Math.max(2, max === 0 ? 0 : (value / max) * 100)}%`,
                  backgroundColor: 'var(--nd-text-display)',
                  opacity: 0.6,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
