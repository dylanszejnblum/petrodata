import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { formatCompact, formatPercent } from '@/utilities/formatNumber'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { CompanyLogo } from '@/components/Petrodata/entities/CompanyLogo'
import { StatCounters } from '@/components/Petrodata/entities/StatCounters'
import { StockPriceChart } from '@/components/Petrodata/entities/StockPriceChart'
import { EntityTimeline } from '@/components/Petrodata/entities/EntityTimeline'
import { SortableProjectsTable } from '@/components/Petrodata/entities/SortableProjectsTable'
import {
  slugify,
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

type Detail = ApiSchemas['CompanyDetailDto']

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))
      ? Number(v)
      : null
const isAdvanced = (s: string) =>
  /avanz|factib|feasib|eep|constru|producc|operac/.test(s.toLowerCase())

function resourceHeadline(
  rs: Record<string, number> | null | undefined,
): { value: number; unit: string } | null {
  if (!rs) return null
  const entries = Object.entries(rs).filter(
    ([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0,
  )
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

type ContributionItem = ApiSchemas['OperatorContributionItemDto']
type ContributionTile = { label: string; value: string; share?: string | null; shareNote?: string }

// Company slugs equal operator slugs, so the company's economic figures come
// straight out of the operators contribution endpoint.
async function getContribution(slug: string): Promise<{
  item: ContributionItem
  totals: ApiSchemas['ContributionTotalsDto']
  window: ApiSchemas['ContributionWindowDto']
} | null> {
  try {
    const { data, error } = await api.GET('/api/v1/operators/contribution', {
      next: { revalidate: 3600 },
    })
    if (error || !data) return null
    const item = data.data.operators.find((o) => o.operator_slug === slug)
    return item ? { item, totals: data.data.totals, window: data.data.window } : null
  } catch {
    return null
  }
}

const pctOf = (
  part: number | null | undefined,
  total: number | null | undefined,
  locale: string,
): string | null => (part != null && total ? formatPercent(part / total, locale) : null)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompany(slug)
  return { title: company?.name ?? 'Empresa', alternates: buildAlternates(`/companies/${slug}`) }
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const [t, company, contribution] = await Promise.all([
    getTranslations('companies'),
    getCompany(slug),
    getContribution(slug.toLowerCase()),
  ])
  if (!company) notFound()

  const projects = company.projects ?? []
  const og = company.oil_gas_production_summary
  const website = str(company.website)
  const country = str(company.country)
  const ticker = company.stock?.ticker || str(company.stock_ticker)
  const sectorLabel =
    company.type === 'mining'
      ? t('typeMining')
      : company.type === 'oil_and_gas'
        ? t('typeOil')
        : t('typeBoth')

  // Type-aware counters: O&G companies surface production, miners surface portfolio.
  const nationalShare = og ? num(og.national_share_boe) : null
  const stats: StatItem[] = og
    ? [
        { label: t('oilGasSummary.wells'), value: og.well_count },
        { label: t('oilGasSummary.oil'), value: num(og.oil_production_m3) ?? 0, format: 'compact' },
        { label: t('oilGasSummary.gas'), value: num(og.gas_production_m3) ?? 0, format: 'compact' },
        { label: t('oilGasSummary.boe'), value: num(og.boe_total) ?? 0, format: 'compact' },
        ...(nationalShare != null
          ? [
              {
                label: t('oilGasSummary.nationalShare'),
                value: nationalShare,
                format: 'percent' as const,
              },
            ]
          : []),
      ]
    : [
        { label: t('stats.projects'), value: company.project_count_mining || projects.length },
        {
          label: t('stats.advanced'),
          value: projects.filter((p) => isAdvanced(str(p.status))).length,
        },
        { label: t('stats.provinces'), value: company.provinces?.length ?? 0 },
        { label: t('stats.commodities'), value: company.commodities_involved?.length ?? 0 },
      ]

  const mapPoints: MapPoint[] = projects.map((p) => {
    const c = p.coordinates as { lat?: unknown; lng?: unknown } | null
    return {
      name: p.name,
      lat: num(c?.lat) ?? 0,
      lng: num(c?.lng) ?? 0,
      color: commodityColor(p.commodity).color,
      line1: str(p.province),
      line2: str(p.status),
    }
  })
  const legendItems = [...new Set((company.commodities_involved ?? []).filter(Boolean))].map(
    (m) => ({
      label: m,
      color: commodityColor(m).color,
    }),
  )

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
            <Link
              href={`/minerals/projects/${encodeURIComponent(p.name)}`}
              className="text-nd-text-display hover:underline"
            >
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
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {p.commodity}
            </span>
          ),
        },
        status: { sort: str(p.status), node: str(p.status) || '—' },
        resource: {
          sort: headline?.value ?? 0,
          node: headline ? `${formatCompact(headline.value, locale)} ${headline.unit}` : '—',
        },
      },
    }
  })

  const contributionTiles: ContributionTile[] = contribution
    ? [
        {
          label: t('contribution.grossValue'),
          value: `US$ ${formatCompact(contribution.item.gross_value_usd, locale)}`,
          share: pctOf(contribution.item.gross_value_usd, contribution.totals.gross_value_usd, locale),
          shareNote: t('contribution.shareOfValue'),
        },
        {
          label: t('contribution.royalties'),
          value: `US$ ${formatCompact(contribution.item.royalties_usd, locale)}`,
        },
        ...(contribution.item.attributed_exports_usd != null
          ? [
              {
                label: t('contribution.exports'),
                value: `US$ ${formatCompact(contribution.item.attributed_exports_usd, locale)}`,
                share: pctOf(
                  contribution.item.attributed_exports_usd,
                  contribution.totals.energy_exports_usd,
                  locale,
                ),
                shareNote: t('contribution.shareOfExports'),
              },
            ]
          : []),
        ...(contribution.item.value_share_of_gdp != null
          ? [
              {
                label: t('contribution.ofGdp'),
                value: formatPercent(contribution.item.value_share_of_gdp, locale, 2),
              },
            ]
          : []),
      ]
    : []

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        {/* Compact company identity */}
        <section className="container pt-6 pb-4 sm:pt-8 sm:pb-5 md:pt-10 md:pb-6">
          <Link
            href="/companies"
            className="inline-flex min-h-11 items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary transition-colors hover:text-nd-text-display font-mono"
          >
            <ArrowLeft size={13} />
            {t('backToList')}
          </Link>
          <div className="mt-2 grid gap-3 sm:mt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <CompanyLogo
                name={company.name}
                logoUrl={str(company.logo_url) || null}
                website={website || null}
                size="md"
                className="sm:size-12 sm:text-lg"
              />
              <h1 className="min-w-0 text-balance text-3xl leading-none text-nd-text-display sm:text-4xl md:text-5xl font-display [overflow-wrap:anywhere]">
                {company.name}
              </h1>
            </div>
            {company.stock && <StockListing stock={company.stock} />}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-nd-text-secondary sm:mt-3 sm:text-sm font-mono">
            <span>{sectorLabel}</span>
            {country && <span className="text-nd-text-disabled">· {country}</span>}
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 break-all text-nd-text-secondary transition-colors hover:text-nd-text-display"
              >
                · {website.replace(/^https?:\/\//, '')}
                <ExternalLink size={11} />
              </a>
            )}
          </p>
        </section>

        {/* Company snapshot: operating scale, market performance and economic contribution. */}
        <section className="container pb-8 sm:pb-10">
          <div className="min-w-0 max-w-full border border-nd-border bg-nd-surface">
            <StatCounters items={stats} density="compact" />
            {(ticker || (og && contribution)) && (
              <div className="grid min-w-0 border-t border-nd-border lg:grid-cols-12">
                {ticker && (
                  <div
                    className={`min-w-0 max-w-full overflow-hidden ${og && contribution ? 'lg:col-span-7' : 'lg:col-span-12'}`}
                  >
                    <StockPriceChart ticker={ticker} embedded />
                  </div>
                )}
                {og && contribution && (
                  <div
                    className={`min-w-0 max-w-full ${ticker ? 'border-t border-nd-border lg:col-span-5 lg:border-t-0 lg:border-l' : 'lg:col-span-12'}`}
                  >
                    <ContributionPanel
                      eyebrow={t('contribution.eyebrow')}
                      title={t('contribution.title')}
                      window={t('contribution.window', {
                        from: contribution.window.from.slice(0, 7),
                        to: contribution.window.to.slice(0, 7),
                      })}
                      tiles={contributionTiles}
                      note={t('contribution.note')}
                      wide={!ticker}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {mapPoints.some((p) => p.lat !== 0 || p.lng !== 0) && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('portfolio.eyebrow')} title={t('portfolio.title')}>
              {t('portfolio.mapped', { n: projects.length })}
            </SectionHead>
            <div className="h-[50svh] min-h-[320px] overflow-hidden border border-nd-border bg-nd-surface sm:min-h-[380px] lg:h-[55vh] lg:min-h-[420px]">
              <EntityMap
                points={mapPoints}
                legend={{ label: t('table.columns.commodity'), items: legendItems }}
              />
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('table.eyebrow')} title={t('table.title')} />
            <SortableProjectsTable
              columns={columns}
              rows={rows}
              initialSort="project"
              emptyLabel={t('table.noResults')}
            />
          </section>
        )}

        {company.project_timeline && company.project_timeline.length > 0 && (
          <section className="container pb-20">
            <SectionHead eyebrow={t('timeline.eyebrow')} title={t('timeline.title')} />
            <EntityTimeline
              stages={company.project_timeline.map((s) => ({
                stage: s.stage,
                date: typeof s.date === 'string' ? s.date : null,
              }))}
            />
          </section>
        )}
      </main>
      <NothingFooter />
    </>
  )
}

function StockListing({ stock }: { stock: ApiSchemas['CompanyStockDto'] }) {
  const exchange = str(stock.exchange) || stock.ticker
  return (
    <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-nd-border px-3 text-[11px] uppercase tracking-[0.08em] sm:w-auto font-mono">
      <span className="text-nd-text-display">{stock.ticker}</span>
      {exchange !== stock.ticker && <span className="text-nd-text-disabled">· {exchange}</span>}
    </span>
  )
}

function ContributionPanel({
  eyebrow,
  title,
  window,
  tiles,
  note,
  wide,
}: {
  eyebrow: string
  title: string
  window: string
  tiles: ContributionTile[]
  note: string
  wide: boolean
}) {
  const gridCols =
    tiles.length >= 4
      ? `grid-cols-2 ${wide ? 'sm:grid-cols-4' : ''}`
      : tiles.length === 3
        ? `grid-cols-2 ${wide ? 'sm:grid-cols-3' : ''}`
        : tiles.length === 2
          ? 'grid-cols-2'
          : 'grid-cols-1'

  return (
    <section
      className="flex h-full min-w-0 max-w-full flex-col bg-nd-surface"
      aria-labelledby="company-contribution-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-4 sm:items-end md:p-5">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {eyebrow}
          </span>
          <h2
            id="company-contribution-title"
            className="mt-1.5 text-lg leading-tight text-nd-text-display sm:text-xl font-display"
          >
            {title}
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {window}
        </span>
      </header>
      <dl className={`grid flex-1 gap-px border-t border-nd-border bg-nd-border ${gridCols}`}>
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            className={`flex min-h-24 min-w-0 flex-col justify-between gap-3 bg-nd-surface p-3 sm:min-h-28 sm:p-4 ${
              tiles.length === 3 && index === 2 ? `col-span-2 ${wide ? 'sm:col-span-1' : ''}` : ''
            }`}
          >
            <dt className="text-[10px] uppercase leading-snug tracking-[0.08em] text-nd-text-disabled font-mono">
              {tile.label}
            </dt>
            <dd>
              <span className="block text-xl leading-none tabular-nums text-nd-text-display sm:text-2xl xl:text-3xl font-display">
                {tile.value}
              </span>
              {tile.share ? (
                <span className="mt-2 block text-[10px] leading-snug tabular-nums text-nd-text-secondary font-mono">
                  {tile.share} {tile.shareNote}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-nd-border p-4 text-[11px] leading-relaxed text-nd-text-disabled sm:text-[10px] font-mono md:px-5">
        {note}
      </p>
    </section>
  )
}

function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {eyebrow}
        </span>
        <h2 className="mt-2 text-balance text-2xl leading-none text-nd-text-display sm:text-3xl md:text-4xl font-display">
          {title}
        </h2>
      </div>
      {children != null && (
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {children}
        </span>
      )}
    </div>
  )
}
