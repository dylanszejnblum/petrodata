import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { StatCounters } from '@/components/Petrodata/entities/StatCounters'
import { CommodityBreakdownBars } from '@/components/Petrodata/entities/CommodityBreakdownBars'
import { SortableProjectsTable } from '@/components/Petrodata/entities/SortableProjectsTable'
import {
  slugify,
  type BreakdownItem,
  type MapPoint,
  type StatItem,
  type TableCol,
  type TableRow,
} from '@/components/Petrodata/entities/types'

const EntityMap = nextDynamic(
  () => import('@/components/Petrodata/entities/EntityMap').then((m) => ({ default: m.EntityMap })),
  { loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" /> },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Detail = ApiSchemas['ProvinceDetailDto']
type ListItem = ApiSchemas['ProvinceListItemDto']

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null
const isAdvanced = (s: string) => /avanz|factib|feasib|eep|constru|producc|operac/.test(s.toLowerCase())

async function getProvince(slug: string): Promise<Detail | null> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/{slug}', { params: { path: { slug } }, cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function getProvinces(): Promise<ListItem[]> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces', { cache: 'no-store' })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getProvince(slug)
  return { title: p?.name ?? 'Provincia', alternates: buildAlternates(`/provincias/${slug}`) }
}

export default async function ProvinceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [t, province, all] = await Promise.all([getTranslations('provinces'), getProvince(slug), getProvinces()])
  if (!province) notFound()

  const projects = province.projects ?? []
  const advanced = projects.filter((p) => isAdvanced(str(p.status))).length

  const stats: StatItem[] = [
    { label: t('stats.projects'), value: province.project_count },
    { label: t('stats.advanced'), value: advanced },
    { label: t('stats.companies'), value: province.companies_operating?.length ?? 0 },
    { label: t('stats.exploration'), value: province.exploration_projects },
  ]

  // name → company slug, from project controllers (for linking operating companies).
  const companySlug = new Map<string, string>()
  for (const p of projects) for (const c of p.controllers ?? []) if (c.name && c.slug) companySlug.set(c.name, c.slug)
  const slugForCompany = (name: string) => companySlug.get(name) ?? slugify(name)

  const mapPoints: MapPoint[] = projects.map((p) => ({
    name: p.name,
    lat: num(p.coordinates?.lat) ?? 0,
    lng: num(p.coordinates?.lng) ?? 0,
    color: commodityColor(p.commodity).color,
    line1: p.commodity,
    line2: str(p.status),
  }))
  const legendItems = [...new Set(projects.map((p) => p.commodity).filter(Boolean))].map((m) => ({
    label: m,
    color: commodityColor(m).color,
  }))

  const breakdown: BreakdownItem[] = (province.commodities ?? []).map((c) => ({
    name: c.name,
    count: c.project_count,
    color: commodityColor(c.name).color,
  }))

  const commoditiesPresent = [...new Set(projects.map((p) => p.commodity).filter(Boolean))]
  const columns: TableCol[] = [
    { key: 'index', label: t('table.columns.index') },
    { key: 'project', label: t('table.columns.project'), sortable: true },
    { key: 'commodity', label: t('table.columns.commodity'), sortable: true },
    { key: 'status', label: t('table.columns.status'), sortable: true },
    { key: 'company', label: t('table.columns.company'), sortable: true },
  ]
  const rows: TableRow[] = projects.map((p, i) => {
    const controller = (p.controllers ?? [])[0]
    const company = controller?.name ?? ''
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
        company: {
          sort: company,
          node: company ? (
            <Link href={`/companies/${controller?.slug ?? slugify(company)}`} className="hover:underline">
              {company}
            </Link>
          ) : (
            '—'
          ),
        },
      },
    }
  })

  // prev / next province navigation (alphabetical)
  const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex((p) => p.slug === slug)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  const tradeExports = province.trade_stats?.major_exports ?? []
  const employment = num(province.trade_stats?.employment)

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="container pt-12 pb-8 md:pt-20">
          <Link
            href="/provincias"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary transition-colors hover:text-nd-text-display font-mono"
          >
            <ArrowLeft size={13} />
            {t('backToList')}
          </Link>
          <h1 className="mt-4 text-balance text-5xl leading-none text-nd-text-display md:text-7xl font-display">
            {province.name}
          </h1>
          <p className="mt-4 text-sm text-nd-text-secondary font-mono">
            {t('summary', { projects: province.project_count, companies: province.companies_operating?.length ?? 0 })}
          </p>
        </section>

        <section className="container pb-12">
          <StatCounters items={stats} />
        </section>

        {mapPoints.some((p) => p.lat !== 0 || p.lng !== 0) && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('map.eyebrow')} title={t('map.title')}>
              {t('map.mapped', { n: projects.length })}
            </SectionHead>
            <div className="h-[55vh] min-h-[420px] overflow-hidden border border-nd-border bg-nd-surface">
              <EntityMap points={mapPoints} legend={{ label: t('table.columns.commodity'), items: legendItems }} />
            </div>
          </section>
        )}

        {breakdown.length > 0 && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('breakdown.eyebrow')} title={t('breakdown.title')} />
            <div className="border border-nd-border bg-nd-surface p-5 md:p-6">
              <CommodityBreakdownBars items={breakdown} />
            </div>
          </section>
        )}

        <section className="container pb-12">
          <SectionHead eyebrow={t('table.eyebrow')} title={t('table.title')} />
          <SortableProjectsTable
            columns={columns}
            rows={rows}
            initialSort="project"
            emptyLabel={t('table.noResults')}
            filter={commoditiesPresent.length > 1 ? { key: 'commodity', allLabel: t('all'), options: commoditiesPresent } : undefined}
            filterAllLabel={t('all')}
          />
        </section>

        {/* Trade + operating companies */}
        {(tradeExports.length > 0 || (province.companies_operating?.length ?? 0) > 0) && (
          <section className="container pb-12">
            <div className="grid grid-cols-1 gap-px bg-nd-border lg:grid-cols-2">
              <div className="bg-nd-surface p-5 md:p-6">
                <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
                  {t('tradeStats.eyebrow')}
                </span>
                <h3 className="mt-2 text-balance text-2xl leading-none text-nd-text-display font-display">
                  {t('tradeStats.title')}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tradeExports.map((e) => (
                    <span key={e} className="border border-nd-border px-3 py-1 text-[11px] text-nd-text-secondary font-mono">
                      {e}
                    </span>
                  ))}
                </div>
                {employment != null && (
                  <p className="mt-4 text-[11px] text-nd-text-secondary font-mono tabular-nums">
                    {t('tradeStats.employment')}: {employment.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-nd-surface p-5 md:p-6">
                <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
                  {t('operators.eyebrow')}
                </span>
                <h3 className="mt-2 text-balance text-2xl leading-none text-nd-text-display font-display">
                  {t('operators.title')}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(province.companies_operating ?? []).map((name) => (
                    <li key={name}>
                      <Link
                        href={`/companies/${slugForCompany(name)}`}
                        className="inline-block border border-nd-border px-3 py-1 text-[11px] text-nd-text-secondary transition-colors hover:bg-nd-surface-raised hover:text-nd-text-display font-mono"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Prev / next nav */}
        <section className="container pb-20">
          <div className="flex items-center justify-between border-t border-nd-border pt-6 text-[11px] uppercase tracking-[0.08em] font-mono">
            <div className="flex-1">
              {prev && (
                <Link href={`/provincias/${prev.slug}`} className="inline-flex items-center gap-1.5 text-nd-text-secondary transition-colors hover:text-nd-text-display">
                  <ArrowLeft size={13} />
                  {prev.name}
                </Link>
              )}
            </div>
            <Link href="/provincias" className="text-nd-text-disabled transition-colors hover:text-nd-text-display">
              {t('navAll')}
            </Link>
            <div className="flex-1 text-right">
              {next && (
                <Link href={`/provincias/${next.slug}`} className="inline-flex items-center gap-1.5 text-nd-text-secondary transition-colors hover:text-nd-text-display">
                  {next.name}
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </section>
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
