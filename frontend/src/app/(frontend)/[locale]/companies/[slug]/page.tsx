import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { formatCompact } from '@/utilities/formatNumber'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { StatCounters } from '@/components/Petrodata/entities/StatCounters'
import { EntityTimeline } from '@/components/Petrodata/entities/EntityTimeline'
import { SortableProjectsTable } from '@/components/Petrodata/entities/SortableProjectsTable'
import { slugify, type MapPoint, type StatItem, type TableCol, type TableRow } from '@/components/Petrodata/entities/types'

const EntityMap = nextDynamic(
  () => import('@/components/Petrodata/entities/EntityMap').then((m) => ({ default: m.EntityMap })),
  { loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" /> },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Detail = ApiSchemas['CompanyDetailDto']

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null

function isAdvanced(s: string): boolean {
  const x = s.toLowerCase()
  return /avanz|factib|feasib|eep|constru|producc|operac/.test(x)
}

function resourceHeadline(rs: Record<string, number> | null | undefined): { value: number; unit: string } | null {
  if (!rs) return null
  const entries = Object.entries(rs).filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0)
  if (entries.length === 0) return null
  entries.sort((a, b) => b[1] - a[1])
  const [k, v] = entries[0]
  return { value: v, unit: k.replace(/_/g, ' ') }
}

async function getCompany(slug: string): Promise<Detail | null> {
  try {
    const { data, error } = await api.GET('/api/v2/companies/{slug}', {
      params: { path: { slug } },
      cache: 'no-store',
    })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompany(slug)
  return {
    title: company?.name ?? 'Empresa',
    alternates: buildAlternates(`/companies/${slug}`),
  }
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [t, company] = await Promise.all([getTranslations('companies'), getCompany(slug)])
  if (!company) notFound()

  const projects = company.projects ?? []
  const advanced = projects.filter((p) => isAdvanced(str(p.status))).length

  const stats: StatItem[] = [
    { label: t('stats.projects'), value: company.total_projects },
    { label: t('stats.advanced'), value: advanced },
    { label: t('stats.provinces'), value: company.provinces?.length ?? 0 },
    { label: t('stats.commodities'), value: company.commodities_involved?.length ?? 0 },
  ]

  const mapPoints: MapPoint[] = projects.map((p) => ({
    name: p.name,
    lat: num(p.coordinates?.lat) ?? 0,
    lng: num(p.coordinates?.lng) ?? 0,
    color: commodityColor(p.commodity).color,
    line1: str(p.province),
    line2: str(p.status),
  }))
  const legendItems = [...new Set((company.commodities_involved ?? []).filter(Boolean))].map((m) => ({
    label: m,
    color: commodityColor(m).color,
  }))

  const columns: TableCol[] = [
    { key: 'index', label: t('table.columns.index') },
    { key: 'project', label: t('table.columns.project'), sortable: true },
    { key: 'province', label: t('table.columns.province'), sortable: true },
    { key: 'commodity', label: t('table.columns.commodity'), sortable: true },
    { key: 'status', label: t('table.columns.status'), sortable: true },
    { key: 'resource', label: t('table.columns.resource'), sortable: true, align: 'right' },
  ]
  const rows: TableRow[] = projects.map((p, i) => {
    const province = str(p.province)
    const headline = resourceHeadline(p.resources_summary)
    const color = commodityColor(p.commodity).color
    return {
      id: `${p.name}-${i}`,
      cells: {
        project: {
          sort: p.name,
          node: (
            <Link href={`/minerals/projects/${encodeURIComponent(p.name)}`} className="text-nd-text-display hover:underline">
              {p.name}
            </Link>
          ),
        },
        province: {
          sort: province,
          node: province ? (
            <Link href={`/provincias/${slugify(province)}`} className="hover:underline">
              {province}
            </Link>
          ) : (
            '—'
          ),
        },
        commodity: {
          sort: p.commodity,
          node: (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              {p.commodity}
            </span>
          ),
        },
        status: { sort: str(p.status), node: str(p.status) || '—' },
        resource: {
          sort: headline?.value ?? 0,
          node: headline ? `${formatCompact(headline.value)} ${headline.unit}` : '—',
        },
      },
    }
  })

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="container pt-12 pb-8 md:pt-20">
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary transition-colors hover:text-nd-text-display font-mono"
          >
            <ArrowLeft size={13} />
            {t('backToList')}
          </Link>
          <h1 className="mt-4 text-balance text-5xl leading-none text-nd-text-display md:text-7xl font-display">
            {company.name}
          </h1>
          <p className="mt-4 text-sm text-nd-text-secondary font-mono">
            {[str(company.origin_country), t('summary', {
              projects: company.total_projects,
              provinces: company.provinces?.length ?? 0,
              commodities: (company.commodities_involved ?? []).join(', '),
            })]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {str(company.description) && (
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans">
              {str(company.description)}
            </p>
          )}
        </section>

        {/* Stat counters */}
        <section className="container pb-12">
          <StatCounters items={stats} />
        </section>

        {/* Portfolio map */}
        {mapPoints.some((p) => p.lat !== 0 || p.lng !== 0) && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('portfolio.eyebrow')} title={t('portfolio.title')}>
              {t('portfolio.mapped', { n: projects.length })}
            </SectionHead>
            <div className="h-[55vh] min-h-[420px] overflow-hidden border border-nd-border bg-nd-surface">
              <EntityMap points={mapPoints} legend={{ label: t('table.columns.commodity'), items: legendItems }} />
            </div>
          </section>
        )}

        {/* Project table */}
        <section className="container pb-12">
          <SectionHead eyebrow={t('table.eyebrow')} title={t('table.title')} />
          <SortableProjectsTable columns={columns} rows={rows} initialSort="project" emptyLabel={t('table.noResults')} />
        </section>

        {/* Timeline */}
        {company.project_timeline && company.project_timeline.length > 0 && (
          <section className="container pb-20">
            <SectionHead eyebrow={t('timeline.eyebrow')} title={t('timeline.title')} />
            <EntityTimeline
              stages={company.project_timeline.map((s) => ({ stage: s.stage, date: typeof s.date === 'string' ? s.date : null }))}
            />
          </section>
        )}
      </main>
      <NothingFooter />
    </>
  )
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">{eyebrow}</span>
        <h2 className="mt-2 text-balance text-3xl leading-none text-nd-text-display md:text-4xl font-display">{title}</h2>
      </div>
      {children != null && (
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">{children}</span>
      )}
    </div>
  )
}
