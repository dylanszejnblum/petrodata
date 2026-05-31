import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { StatCard } from '@/components/Nothing/StatCard'
import { api, type ApiSchemas } from '@/api/client'
import { ProjectsTable } from '@/components/Petrodata/minerals/ProjectsTable'
import { commodityColor, commodityLabel } from '@/components/Petrodata/minerals/commodityColors'
import type { MineralsFeatureCollection } from '@/components/Petrodata/minerals/MineralsMap'
import { PriceDetailCard } from '@/components/Petrodata/minerals/PriceCard'
import { UraniumSection } from '@/components/Petrodata/minerals/UraniumSection'
import { formatCompact } from '@/utilities/formatNumber'
import { buildAlternates } from '@/i18n/alternates'

const MineralsMap = nextDynamic(
  () =>
    import('@/components/Petrodata/minerals/MineralsMap').then((m) => ({ default: m.MineralsMap })),
  {
    loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" />,
  },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Rollup = ApiSchemas['CommodityRollupDto']
type Project = ApiSchemas['ProjectListItemDto']
type Price = ApiSchemas['CommodityPriceDto']

const EMPTY_FC: MineralsFeatureCollection = { type: 'FeatureCollection', features: [] }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ commodity: string }>
}): Promise<Metadata> {
  const { commodity } = await params
  const label = commodityLabel(commodity)
  return {
    title: `${label} — Argentina mining projects`,
    alternates: buildAlternates(`/minerals/${commodity}`),
  }
}

async function getRollup(commodity: string): Promise<Rollup | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/commodities', { cache: 'no-store' })
    if (error || !data) return null
    const target = commodity.toLowerCase()
    return data.data.find((r) => r.commodity.toLowerCase() === target) ?? null
  } catch {
    return null
  }
}

async function getCommodityProjects(commodity: string): Promise<Project[]> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/projects', {
      params: {
        query: {
          commodity,
          limit: 500,
          sort: 'project_name',
          order: 'asc',
        },
      },
      cache: 'no-store',
    })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getCommodityPrice(commodity: string): Promise<Price | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/prices/{commodity}', {
      params: { path: { commodity } },
      cache: 'no-store',
    })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function getCommodityMap(commodity: string): Promise<MineralsFeatureCollection> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  try {
    const res = await fetch(
      `${baseUrl}/api/v2/minerals/map?commodity=${encodeURIComponent(commodity)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return EMPTY_FC
    return (await res.json()) as MineralsFeatureCollection
  } catch {
    return EMPTY_FC
  }
}

function bestResourceHeadlines(
  totals: Record<string, number> | null | undefined,
): { label: string; value: number; unit: string }[] {
  if (!totals) return []
  return Object.entries(totals)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => priorityRank(a[0]) - priorityRank(b[0]))
    .slice(0, 3)
    .map(([key, value]) => {
      const [cat, ...rest] = key.split('_')
      return {
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value,
        unit: rest.join('/').replace('_', '/'),
      }
    })
}

function priorityRank(key: string): number {
  const k = key.toLowerCase()
  if (k.startsWith('measured')) return 0
  if (k.startsWith('indicated')) return 1
  if (k.startsWith('proven')) return 2
  if (k.startsWith('probable')) return 3
  if (k.startsWith('inferred')) return 4
  return 9
}

export default async function CommodityPage({
  params,
}: {
  params: Promise<{ commodity: string }>
}) {
  const { commodity } = await params
  const label = commodityLabel(commodity)
  const { color } = commodityColor(label)

  const [t, rollup, projects, geojson, price] = await Promise.all([
    getTranslations('commodityPage'),
    getRollup(commodity),
    getCommodityProjects(label),
    getCommodityMap(label),
    getCommodityPrice(label),
  ])

  if (!rollup) {
    notFound()
  }

  const headlines = bestResourceHeadlines(rollup.resource_totals)
  const reserveHeadlines = bestResourceHeadlines(rollup.reserve_totals)
  const byProvince = projects.reduce<Map<string, number>>((acc, p) => {
    const k = (p.province as string | null) ?? '—'
    acc.set(k, (acc.get(k) ?? 0) + 1)
    return acc
  }, new Map())
  const topProvinces = [...byProvince.entries()].sort(([, a], [, b]) => b - a).slice(0, 6)

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="container pt-12 pb-8 md:pt-20 md:pb-10">
          <div className="flex items-center gap-3">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <Link
              href="/minerals"
              className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase hover:text-nd-text-display transition-colors"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('breadcrumb', { commodity: label.toUpperCase() })}
            </Link>
          </div>
          <h1
            className="mt-3 max-w-3xl text-balance text-5xl leading-none md:text-7xl"
            style={{
              fontFamily: 'Doto, var(--font-space-grotesk)',
              color: 'var(--nd-text-display)',
            }}
          >
            {label}
          </h1>
          <p
            className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {t('blurb', {
              projects: rollup.projects,
              producing: rollup.producing_projects,
            })}
          </p>
        </section>

        {/* KPI strip */}
        <section className="container pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border">
            <StatCard
              label={t('kpi.projects')}
              value={rollup.projects.toString()}
              statusColor="neutral"
            />
            <StatCard
              label={t('kpi.inOperation')}
              value={rollup.producing_projects.toString()}
              statusColor="success"
            />
            {headlines[0] ? (
              <StatCard
                label={t('kpi.resource', { category: headlines[0].label.toUpperCase() })}
                value={formatCompact(headlines[0].value)}
                unit={headlines[0].unit}
                statusColor="neutral"
              />
            ) : (
              <StatCard label={t('kpi.resourceNa')} value="—" statusColor="neutral" />
            )}
            {reserveHeadlines[0] ? (
              <StatCard
                label={t('kpi.reserve', { category: reserveHeadlines[0].label.toUpperCase() })}
                value={formatCompact(reserveHeadlines[0].value)}
                unit={reserveHeadlines[0].unit}
                statusColor="neutral"
              />
            ) : (
              <StatCard label={t('kpi.reserveNa')} value="—" statusColor="neutral" />
            )}
          </div>
        </section>

        {/* Resource / reserve / live price */}
        {(headlines.length > 0 || reserveHeadlines.length > 0 || price) && (
          <section className="container pb-12">
            <div
              className={`grid gap-px bg-nd-border ${
                price ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              <TotalsCard
                title={t('totals.resource')}
                emptyMessage={t('totals.noTotals')}
                rows={headlines}
                accent={color}
              />
              <TotalsCard
                title={t('totals.reserve')}
                emptyMessage={t('totals.noTotals')}
                rows={reserveHeadlines}
                accent={color}
              />
              {price && <PriceDetailCard quote={price} />}
            </div>
          </section>
        )}

        {/* Map */}
        <section className="container pb-12">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span
                className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                {t('mapSection.eyebrow', { commodity: label.toUpperCase() })}
              </span>
              <h2
                className="mt-2 text-balance text-3xl leading-none text-nd-text-display md:text-4xl"
                style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
              >
                {t('mapSection.title')}
              </h2>
            </div>
            <span
              className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('mapSection.mapped', { n: geojson.features.length })}
            </span>
          </div>
          <div className="h-[65vh] min-h-[480px] overflow-hidden border border-nd-border bg-nd-surface">
            <MineralsMap data={geojson} pointColor={color} />
          </div>
        </section>

        {/* Provinces breakdown */}
        {topProvinces.length > 0 && (
          <section className="container pb-12">
            <span
              className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-4"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('byProvince')}
            </span>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-nd-border">
              {topProvinces.map(([prov, count]) => (
                <li
                  key={prov}
                  className="bg-nd-surface p-4 flex flex-col gap-1"
                >
                  <span
                    className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    {prov}
                  </span>
                  <span
                    className="text-nd-text-display text-2xl tabular-nums leading-none"
                    style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
                  >
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
                {t('projectsSection.title', { commodity: label })}
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

        {commodity.toLowerCase() === 'uranium' && <UraniumSection projects={projects} />}
      </main>
      <NothingFooter />
    </>
  )
}

function TotalsCard({
  title,
  rows,
  accent,
  emptyMessage,
}: {
  title: string
  rows: { label: string; value: number; unit: string }[]
  accent: string
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-nd-surface p-6">
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-3"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {title}
        </span>
        <span
          className="text-nd-text-disabled text-sm"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {emptyMessage}
        </span>
      </div>
    )
  }
  return (
    <div className="bg-nd-surface p-6">
      <span
        className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-4"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {title}
      </span>
      <dl className="grid grid-cols-3 gap-4">
        {rows.map((r) => (
          <div
            key={`${r.label}-${r.unit}`}
            className="border-l-2 pl-3"
            style={{ borderColor: accent }}
          >
            <dt
              className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {r.label}
            </dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span
                className="text-nd-text-display text-2xl tabular-nums leading-none"
                style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
              >
                {formatCompact(r.value)}
              </span>
              {r.unit && (
                <span
                  className="text-nd-text-disabled text-[10px] uppercase"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {r.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
