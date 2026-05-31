import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { commodityColor, commoditySlug } from '@/components/Petrodata/minerals/commodityColors'
import { PriceCard } from '@/components/Petrodata/minerals/PriceCard'
import { formatCompact } from '@/utilities/formatNumber'
import { buildAlternates } from '@/i18n/alternates'

const ProjectLocationMap = nextDynamic(
  () =>
    import('@/components/Petrodata/minerals/ProjectLocationMap').then((m) => ({
      default: m.ProjectLocationMap,
    })),
  {
    loading: () => <div className="h-full w-full animate-pulse bg-nd-surface-raised" />,
  },
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProjectDetail = ApiSchemas['ProjectDetailDto']
type Stock = ApiSchemas['StockPriceDto']

type ResourceEntry = { category: string; values: Record<string, unknown> }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  return {
    title: `${decoded} — Project detail`,
    alternates: buildAlternates(`/minerals/projects/${name}`),
  }
}

async function getProject(name: string): Promise<ProjectDetail | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/projects/{name}', {
      params: { path: { name } },
      cache: 'no-store',
    })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

// Resources/reserves are raw JSONB — usually an array of {category, values}
// but we defend against unexpected shapes.
function parseEntries(raw: unknown): ResourceEntry[] {
  if (!raw) return []
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      category: typeof r.category === 'string' ? r.category : 'Unknown',
      values:
        typeof r.values === 'object' && r.values !== null
          ? (r.values as Record<string, unknown>)
          : {},
    }))
}

// Collect the union of all value-keys across categories so we can render a table.
function collectValueKeys(entries: ResourceEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    for (const k of Object.keys(e.values)) set.add(k)
  }
  return [...set]
}

function formatValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '—'
    if (v >= 100) return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
    return v.toFixed(2)
  }
  if (typeof v === 'string') return v
  return String(v)
}

function prettyUnitKey(key: string): string {
  // "Au_g_t" → "Au g/t", "RAR_Tn" → "RAR Tn", "pct_U" → "% U"
  if (key.toLowerCase().startsWith('pct_')) {
    return `% ${key.slice(4)}`
  }
  return key.replace(/_/g, ' ').replace(/(\w+) g t$/i, '$1 g/t')
}

function asOptionalString(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function readTechEcon(raw: unknown, key: string): string | null {
  if (typeof raw !== 'object' || raw === null) return null
  const v = (raw as Record<string, unknown>)[key]
  return asOptionalString(v)
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  const [t, tCommodity, project] = await Promise.all([
    getTranslations('projectDetail'),
    getTranslations('commodityPage'),
    getProject(decoded),
  ])
  if (!project) notFound()

  const { color } = commodityColor(project.primary_commodity)
  const slug = commoditySlug(project.primary_commodity)

  const province = asOptionalString(project.province)
  const country = asOptionalString(project.country)
  const operator = asOptionalString(project.operator)
  const owner = asOptionalString(project.owner_controller)
  const status = asOptionalString(project.status)
  const depositType = asOptionalString(project.deposit_type)
  const areaHa = project.area_ha as unknown as number | null
  const latitude = project.latitude as unknown as number | null
  const longitude = project.longitude as unknown as number | null
  const resourcesYear = project.resources_year as unknown as number | null
  const sourcePipeline = asOptionalString(project.source_pipeline)
  const byProductsList = (project.by_products_list as unknown as string[] | null) ?? []

  const resources = parseEntries(project.resources)
  const reserves = parseEntries(project.reserves)

  const techEcon = project.technical_economic as Record<string, unknown> | null
  const sinceProduction = readTechEcon(techEcon, 'since_production')
  const lomYears = readTechEcon(techEcon, 'estimated_lom_years')
  const capex = readTechEcon(techEcon, 'capex')
  const miningMethod = readTechEcon(techEcon, 'mining_method')
  const productiveCapacity = readTechEcon(techEcon, 'productive_capacity')
  const annualProduction = readTechEcon(techEcon, 'estimated_annual_production')
  const product = readTechEcon(techEcon, 'product')

  const geology = (project.geology as Record<string, unknown> | null) ?? null

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        {/* Breadcrumb */}
        <section className="container pt-10 pb-2">
          <Link
            href={`/minerals/${slug}`}
            className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase hover:text-nd-text-display transition-colors inline-flex items-center gap-2"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {tCommodity('breadcrumb', { commodity: project.primary_commodity.toUpperCase() })}
          </Link>
        </section>

        {/* Hero + map */}
        <section className="container pb-10 md:pb-14">
          <h1
            className="mt-2 max-w-4xl text-balance text-4xl leading-none md:text-6xl"
            style={{
              fontFamily: 'Doto, var(--font-space-grotesk)',
              color: 'var(--nd-text-display)',
            }}
          >
            {project.project_name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {status && <Chip>{status}</Chip>}
            {depositType && <Chip>{depositType}</Chip>}
            {byProductsList.length > 0 && <Chip>+ {byProductsList.join(', ')}</Chip>}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-px bg-nd-border">
            <div className="flex flex-col bg-nd-surface">
              <dl
                className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 px-5 py-5 text-[11px]"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                <MetaRow label={t('meta.operator')} value={operator} />
                <MetaRow label={t('meta.owner')} value={owner} />
                <MetaRow
                  label={t('meta.location')}
                  value={[province, country].filter(Boolean).join(', ') || null}
                />
                <MetaRow
                  label={t('meta.area')}
                  value={areaHa != null ? `${areaHa.toLocaleString('en-US')} ha` : null}
                />
              </dl>
              {(sinceProduction || lomYears || capex || miningMethod) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border border-t border-nd-border">
                  <KpiTile label={t('kpi.since')} value={sinceProduction ?? '—'} />
                  <KpiTile label={t('kpi.lomYears')} value={lomYears ?? '—'} />
                  <KpiTile label={t('kpi.capex')} value={capex ?? '—'} />
                  <KpiTile label={t('kpi.method')} value={miningMethod ?? '—'} />
                </div>
              )}
            </div>
            <div className="relative h-[260px] lg:h-auto lg:min-h-[260px] bg-nd-surface overflow-hidden">
              {latitude != null && longitude != null ? (
                <>
                  <ProjectLocationMap
                    latitude={Number(latitude)}
                    longitude={Number(longitude)}
                    color={color}
                  />
                  <div
                    className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-nd-border bg-nd-surface/85 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-secondary"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    <span
                      className="inline-block size-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    {Number(latitude).toFixed(3)}, {Number(longitude).toFixed(3)}
                  </div>
                </>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-nd-text-disabled text-xs uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {t('noCoords')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stock + commodity prices */}
        {(project.stock || project.commodity_prices.length > 0) && (
          <section className="container pb-12">
            <span
              className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-4"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('market')}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-nd-border">
              {project.stock && <StockCard stock={project.stock} fallbackName={operator} />}
              {project.commodity_prices.map((q) => (
                <PriceCard key={q.ticker + q.commodity} quote={q} />
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <section className="container pb-10">
            <SectionHeader
              eyebrow={t('sections.resources')}
              title={t('sections.resourcesTitle')}
              right={
                resourcesYear != null
                  ? t('sections.resourcesYear', { year: resourcesYear })
                  : undefined
              }
            />
            <EntriesTable
              entries={resources}
              accent={color}
              labels={{ category: t('tables.category'), noNumeric: t('tables.noNumeric') }}
            />
          </section>
        )}

        {/* Reserves */}
        {reserves.length > 0 && (
          <section className="container pb-10">
            <SectionHeader
              eyebrow={t('sections.reserves')}
              title={t('sections.reservesTitle')}
            />
            <EntriesTable
              entries={reserves}
              accent={color}
              labels={{ category: t('tables.category'), noNumeric: t('tables.noNumeric') }}
            />
          </section>
        )}

        {/* Technical & economic detail */}
        {(productiveCapacity || annualProduction || product || capex || lomYears) && (
          <section className="container pb-10">
            <SectionHeader
              eyebrow={t('sections.techEcon')}
              title={t('sections.techEconTitle')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-nd-border">
              <KvCard
                label={t('techEconFields.productiveCapacity')}
                value={productiveCapacity}
              />
              <KvCard
                label={t('techEconFields.annualProduction')}
                value={annualProduction}
              />
              <KvCard label={t('techEconFields.product')} value={product} />
              <KvCard label={t('techEconFields.capex')} value={capex} />
              <KvCard label={t('techEconFields.miningMethod')} value={miningMethod} />
              <KvCard label={t('techEconFields.estimatedLom')} value={lomYears} />
            </div>
          </section>
        )}

        {/* Geology */}
        {geology && Object.keys(geology).length > 0 && (
          <section className="container pb-10">
            <SectionHeader
              eyebrow={t('sections.geology')}
              title={t('sections.geologyTitle')}
            />
            <div className="flex flex-col gap-px bg-nd-border">
              {Object.entries(geology).map(([heading, body]) => {
                const text = typeof body === 'string' ? body : null
                if (!text) return null
                return (
                  <div key={heading} className="bg-nd-surface px-5 py-5">
                    <span
                      className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-3"
                      style={{ fontFamily: 'var(--font-space-mono)' }}
                    >
                      {heading.replace(/_/g, ' ')}
                    </span>
                    <p
                      className="text-nd-text-secondary text-sm leading-7 whitespace-pre-wrap"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      {text}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Location */}
        {(latitude != null || longitude != null || province || country) && (
          <section className="container pb-10">
            <SectionHeader
              eyebrow={t('sections.location')}
              title={t('sections.locationTitle')}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border">
              <KvCard label={t('locationFields.province')} value={province} />
              <KvCard label={t('locationFields.country')} value={country} />
              <KvCard
                label={t('locationFields.latitude')}
                value={latitude != null ? Number(latitude).toFixed(4) : null}
              />
              <KvCard
                label={t('locationFields.longitude')}
                value={longitude != null ? Number(longitude).toFixed(4) : null}
              />
            </div>
          </section>
        )}

        {/* Provenance */}
        <section className="container pb-20">
          <div className="border border-nd-border bg-nd-surface px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <span>
              {t('provenance.source', {
                pipeline: sourcePipeline ?? t('provenance.sourceUnknown'),
              })}
            </span>
            <span>
              {t('provenance.ingested', {
                date: new Date(project.ingested_at).toLocaleDateString('en-US'),
              })}
            </span>
            {resourcesYear != null && (
              <span>{t('provenance.resourcesYear', { year: resourcesYear })}</span>
            )}
          </div>
        </section>
      </main>
      <NothingFooter />
    </>
  )
}

/* ----------------------------- subcomponents ----------------------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full border border-nd-border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-secondary"
      style={{ fontFamily: 'var(--font-space-mono)' }}
    >
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]">{label}</dt>
      <dd className="text-nd-text-display truncate" title={value ?? undefined}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-nd-surface p-5">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="mt-2 block text-nd-text-display text-2xl tabular-nums leading-none"
        style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
      >
        {value}
      </span>
    </div>
  )
}

function KvCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-nd-surface px-5 py-4">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="mt-1.5 block text-nd-text-display text-sm"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string
  title: string
  right?: string
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {eyebrow}
        </span>
        <h2
          className="mt-2 text-balance text-2xl leading-none text-nd-text-display md:text-3xl"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        >
          {title}
        </h2>
      </div>
      {right && (
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {right}
        </span>
      )}
    </div>
  )
}

function EntriesTable({
  entries,
  accent,
  labels,
}: {
  entries: ResourceEntry[]
  accent: string
  labels: { category: string; noNumeric: string }
}) {
  const valueKeys = collectValueKeys(entries)
  if (valueKeys.length === 0) {
    return (
      <div
        className="border border-nd-border bg-nd-surface px-5 py-6 text-nd-text-disabled text-sm"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {labels.noNumeric}
      </div>
    )
  }
  return (
    <div className="border border-nd-border bg-nd-surface overflow-x-auto">
      <table className="w-full text-[12px]" style={{ fontFamily: 'var(--font-space-mono)' }}>
        <thead>
          <tr className="bg-nd-surface-raised text-nd-text-secondary text-[10px] uppercase tracking-[0.08em]">
            <th className="px-5 py-3 text-left">{labels.category}</th>
            {valueKeys.map((k) => (
              <th key={k} className="px-5 py-3 text-right tabular-nums">
                {prettyUnitKey(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-nd-border">
          {entries.map((e, i) => (
            <tr key={`${e.category}-${i}`}>
              <td className="px-5 py-3">
                <span
                  className="inline-flex items-center gap-2 text-nd-text-display"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                  {e.category}
                </span>
              </td>
              {valueKeys.map((k) => {
                const v = e.values[k]
                const numeric = typeof v === 'number'
                return (
                  <td
                    key={k}
                    className="px-5 py-3 text-right tabular-nums text-nd-text-secondary"
                  >
                    {numeric && (v as number) >= 1000
                      ? formatCompact(v as number)
                      : formatValue(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockCard({ stock, fallbackName }: { stock: Stock; fallbackName: string | null }) {
  const price = stock.price as number | null
  const change = stock.change as number | null
  const changePct = stock.change_pct as number | null
  const isUp = (change ?? 0) > 0
  const isDown = (change ?? 0) < 0
  const trendColor = isUp
    ? 'var(--nd-success)'
    : isDown
      ? 'var(--nd-warning)'
      : 'var(--nd-text-disabled)'
  return (
    <div className="bg-nd-surface p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase truncate"
          style={{ fontFamily: 'var(--font-space-mono)' }}
          title={stock.operator_match}
        >
          {stock.operator_match || fallbackName || 'Stock'}
        </span>
        <span
          className="text-[9px] uppercase text-nd-text-disabled border border-nd-border rounded-full px-1.5 py-0.5"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {stock.exchange_label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-nd-text-display text-2xl tabular-nums leading-none"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {price != null ? price.toFixed(2) : '—'}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {(stock.currency as string | null) ?? 'USD'} · {stock.ticker}
        </span>
      </div>
      <span
        className="text-[11px] tabular-nums"
        style={{ fontFamily: 'var(--font-space-mono)', color: trendColor }}
      >
        {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '—'}{' '}
        {changePct != null ? `· ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%` : ''}
      </span>
    </div>
  )
}
