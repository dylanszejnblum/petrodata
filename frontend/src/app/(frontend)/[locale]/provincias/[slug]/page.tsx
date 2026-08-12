import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { OperatorAvatar } from '@/components/Petrodata/map/OperatorAvatar'
import { ProvinceProductionChart } from '@/components/Petrodata/entities/ProvinceProductionChart'
import { ProvinceStatCards } from '@/components/Petrodata/entities/ProvinceStatCards'
import { PROVINCE_META, provincePhoto } from '@/components/Petrodata/entities/provinceMeta'
import { SectionLabel } from '@/components/Petrodata/SectionLabel'
import { formatCompact, formatMonth, formatPercent } from '@/utilities/formatNumber'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Detail = ApiSchemas['ProvinceDetailDto']
type ListItem = ApiSchemas['ProvinceListItemDto']
type ProdPoint = ApiSchemas['ProvinceProductionPointDto']

async function getProvince(slug: string): Promise<Detail | null> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/{slug}', {
      params: { path: { slug } },
      // Province data changes rarely (monthly cadence) — cache it so repeat
      // visits don't wait ~4s on the upstream API round-trips.
      next: { revalidate: 3600 },
    })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}
async function getProvinces(): Promise<ListItem[]> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces', { next: { revalidate: 3600 } })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}
async function getProduction(slug: string): Promise<ProdPoint[]> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/{slug}/production', {
      params: { path: { slug } },
      next: { revalidate: 3600 },
    })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}
// Operator rows only link out when the operator actually has a company page.
async function getCompanySlugs(): Promise<Set<string>> {
  try {
    const { data, error } = await api.GET('/api/v2/companies', { next: { revalidate: 3600 } })
    if (error || !data) return new Set()
    return new Set(data.data.map((c) => c.slug))
  } catch {
    return new Set()
  }
}

// Some operator names come through as raw slugs (`phoenix_global_resources_sa`).
const operatorLabel = (name: string): string =>
  name.includes(' ')
    ? name
    : name
        .split(/[_-]/)
        .filter(Boolean)
        .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
        .join(' ')

const yoy = (values: number[]): number | null => {
  if (values.length < 13) return null
  const prev = values[values.length - 13]
  if (!prev) return null
  return values[values.length - 1] / prev - 1
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = await getProvince(slug)
  return { title: p?.name ?? 'Provincia', alternates: buildAlternates(`/provincias/${slug}`) }
}

export default async function ProvinceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const [t, province, all, production, companySlugs] = await Promise.all([
    getTranslations('provinces'),
    getProvince(slug),
    getProvinces(),
    getProduction(slug),
    getCompanySlugs(),
  ])
  if (!province) notFound()

  const og = province.oil_gas
  const meta = PROVINCE_META[slug]
  const photo = provincePhoto(slug)
  const accent = meta?.accent ?? 'var(--nd-accent)'
  const descriptions = t.raw('descriptions') as Record<string, string> | undefined
  const description = descriptions?.[slug] ?? null

  // Oil & gas focus: drop mining export sectors.
  const exportsRows = (province.exports ?? [])
    .filter((e) => !/miner/i.test(e.sector) && e.value_annual_usd > 0)
    .sort((a, b) => b.value_annual_usd - a.value_annual_usd)
  const exportTotal = exportsRows.reduce((s, e) => s + (e.value_annual_usd || 0), 0)

  const operators = (og?.top_operators ?? []).filter((o) => o.boe > 0)
  const operatorMax = Math.max(1, ...operators.map((o) => o.boe))

  // Production is ordered ascending, so the last point is the latest month.
  const latest = production.length ? production[production.length - 1] : null
  const latestMonth = latest ? formatMonth(latest.date_month) : null
  const rangeLabel =
    production.length > 1
      ? `${formatMonth(production[0].date_month)} — ${formatMonth(production[production.length - 1].date_month)}`
      : null
  const prodPoints = production.map((p) => ({
    date: p.date_month,
    oilBblD: p.oil_bbl_d,
    gasMmcfD: p.gas_mmcf_d,
  }))

  const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex((p) => p.slug === slug)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        {/* Breadcrumb */}
        <section className="container pt-6 pb-4 md:pt-10">
          <nav className="flex items-center gap-2 text-[11px] text-nd-text-disabled font-mono">
            <Link href="/provincias" className="transition-colors hover:text-nd-text-display">
              {t('listEyebrow')}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-nd-text-display">{province.name}</span>
          </nav>
        </section>

        {/* Hero */}
        <section className="container pb-10">
          <div className="relative overflow-hidden rounded-[10px] border border-nd-border bg-[#16191d]">
            {photo && (
              <Image
                src={photo}
                alt=""
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="object-cover grayscale contrast-[1.05]"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(60deg,#16191d_0%,rgba(22,25,29,0.85)_42%,rgba(22,25,29,0.4)_78%,rgba(22,25,29,0.15)_100%)]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,25,29,0.25)_0%,rgba(22,25,29,0)_40%,rgba(22,25,29,0.6)_100%)]"
            />

            <div className="relative flex min-h-[340px] flex-col justify-between gap-8 p-6 sm:min-h-[380px] md:p-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: accent, boxShadow: `0 0 8px 1px ${accent}` }}
                    aria-hidden
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/75 font-mono">
                    {meta ? t(`basins.${meta.basin}`) : t('oilGas')}
                  </span>
                </span>
                {meta && (
                  <span className="text-[10px] tracking-[0.1em] text-white/40 font-mono">
                    · {meta.coords}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-4xl font-semibold leading-none tracking-[-0.02em] text-white sm:text-5xl md:text-6xl font-display">
                  {province.name}
                </h1>
                {description && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 font-sans">
                    {description}
                  </p>
                )}

                <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
                  <HeroKpi label={t('wells')} value={formatCompact(og?.active_wells ?? 0, locale)} />
                  {latest && (
                    <HeroKpi label="BOE" value={formatCompact(latest.boe, locale)} unit={t('perMonth')} />
                  )}
                  {exportTotal > 0 && (
                    <HeroKpi
                      label={t('exports')}
                      value={`US$ ${formatCompactUSD(exportTotal, locale).slice(1)}`}
                      unit={t('perYear')}
                    />
                  )}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Production & activity */}
        {og && (
          <section className="container pb-10">
            <SectionLabel title={t('productionActivity')} note={latestMonth} />
            <ProvinceStatCards
              stats={{
                oilBblD: og.production_oil_bbl_d,
                gasMmcfD: og.production_gas_mmcf_d,
                vmPct: og.vm_pct,
                oilYoy: yoy(production.map((p) => p.oil_bbl_d)),
                gasYoy: yoy(production.map((p) => p.gas_mmcf_d)),
                asOf: latestMonth,
              }}
            />
          </section>
        )}

        {/* Main operators */}
        {operators.length > 0 && (
          <section className="container pb-10">
            <SectionLabel
              title={t('topOperators')}
              note={t('companiesCount', { n: operators.length })}
            />
            <ul className="flex flex-col gap-2.5">
              {operators.map((op, i) => {
                const name = operatorLabel(op.operator_name)
                const row = (
                  <>
                    <span className="w-6 shrink-0 text-[11px] font-semibold tabular-nums text-nd-text-disabled font-mono">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <OperatorAvatar slug={op.operator_slug} name={name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="mb-2 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm text-nd-text-display font-sans">
                          {name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-nd-text-display font-mono">
                          {formatCompact(op.boe, locale)} BOE
                        </span>
                      </span>
                      <span className="block h-[5px] overflow-hidden rounded-full bg-nd-surface-raised">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(op.boe / operatorMax) * 100}%`,
                            background: accent,
                          }}
                        />
                      </span>
                    </span>
                  </>
                )
                const cls =
                  'flex items-center gap-4 rounded-[10px] border border-nd-border bg-nd-surface p-4'
                return (
                  <li key={op.operator_slug}>
                    {companySlugs.has(op.operator_slug) ? (
                      <Link
                        href={`/companies/${op.operator_slug}`}
                        className={`${cls} transition-colors hover:border-nd-text-disabled`}
                      >
                        {row}
                        <ArrowRight size={14} className="shrink-0 text-nd-text-disabled" />
                      </Link>
                    ) : (
                      <div className={cls}>{row}</div>
                    )}
                  </li>
                )
              })}
            </ul>
            {latestMonth && (
              <p className="mt-4 text-[11px] text-nd-text-disabled font-mono">
                {t('operatorsNote', { month: latestMonth })}
              </p>
            )}
          </section>
        )}

        {/* Production history */}
        {prodPoints.length > 1 && (
          <section className="container pb-10">
            <SectionLabel title={t('productionHistory')} note={rangeLabel} />
            <div className="rounded-[10px] border border-nd-border bg-nd-surface p-5 md:p-6">
              <ProvinceProductionChart points={prodPoints} />
            </div>
          </section>
        )}

        {/* Export profile */}
        {exportsRows.length > 0 && (
          <section className="container pb-10">
            <SectionLabel
              title={t('exportProfile')}
              note={`US$ ${formatCompactUSD(exportTotal, locale).slice(1)} ${t('perYear')}`}
            />
            <div className="overflow-x-auto rounded-[10px] border border-nd-border bg-nd-surface">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-nd-border text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
                    <th className="px-5 py-3 font-normal">{t('exportColumns.sector')}</th>
                    <th className="px-5 py-3 font-normal">{t('exportColumns.product')}</th>
                    <th className="px-5 py-3 text-right font-normal">{t('exportColumns.value')}</th>
                    <th className="px-5 py-3 text-right font-normal">{t('exportColumns.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {exportsRows.map((r, i) => (
                    <tr
                      key={`${r.sector}-${r.product}-${i}`}
                      className="border-b border-nd-border/60 last:border-0"
                    >
                      <td className="px-5 py-3 text-xs uppercase tracking-[0.04em] text-nd-text-disabled font-mono">
                        {r.sector}
                      </td>
                      <td className="px-5 py-3 text-sm text-nd-text-display font-sans">
                        {r.product}
                      </td>
                      <td className="px-5 py-3 text-right text-sm tabular-nums text-nd-text-secondary font-mono">
                        ${formatCompact(r.value_annual_usd, locale)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm tabular-nums text-nd-text-secondary font-mono">
                        {formatPercent(r.value_annual_usd / exportTotal, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Prev / next */}
        <section className="container pb-20">
          <div className="flex items-center justify-between gap-4 border-t border-nd-border pt-6 text-[11px] uppercase tracking-[0.08em] font-mono">
            <div className="flex-1">
              {prev && (
                <Link
                  href={`/provincias/${prev.slug}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-nd-text-secondary transition-colors hover:text-nd-text-display"
                >
                  <ArrowLeft size={13} />
                  {prev.name}
                </Link>
              )}
            </div>
            <Link
              href="/provincias"
              className="text-nd-text-disabled transition-colors hover:text-nd-text-display"
            >
              {t('navAll')}
            </Link>
            <div className="flex-1 text-right">
              {next && (
                <Link
                  href={`/provincias/${next.slug}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-nd-text-secondary transition-colors hover:text-nd-text-display"
                >
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

function HeroKpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <dt className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/50 font-mono">
        {label}
      </dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold leading-none tracking-[-0.02em] text-white font-display">
          {value}
        </span>
        {unit && <span className="text-[10px] text-white/45 font-mono">{unit}</span>}
      </dd>
    </div>
  )
}
