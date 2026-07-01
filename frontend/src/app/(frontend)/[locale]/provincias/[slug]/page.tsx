import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { StatCounters } from '@/components/Petrodata/entities/StatCounters'
import { ProvinceSectorTabs } from '@/components/Petrodata/entities/ProvinceSectorTabs'
import { ProvinceProductionChart } from '@/components/Petrodata/entities/ProvinceProductionChart'
import { SourceChip } from '@/components/Petrodata/indicadores/SourceChip'
import { type StatItem } from '@/components/Petrodata/entities/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Detail = ApiSchemas['ProvinceDetailDto']
type ListItem = ApiSchemas['ProvinceListItemDto']
type ProdPoint = ApiSchemas['ProvinceProductionPointDto']

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
async function getProduction(slug: string): Promise<ProdPoint[]> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/{slug}/production', { params: { path: { slug } }, cache: 'no-store' })
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
  const [t, province, all, production] = await Promise.all([
    getTranslations('provinces'),
    getProvince(slug),
    getProvinces(),
    getProduction(slug),
  ])
  if (!province) notFound()

  const og = province.oil_gas
  // Oil & gas focus: drop mining export sectors; companies = oil & gas operators only.
  const exportsRows = (province.exports ?? []).filter((e) => !/miner/i.test(e.sector))

  const companyNames = new Set<string>((og?.top_operators ?? []).map((o) => o.operator_name))
  const exportTotal = exportsRows.reduce((s, e) => s + (e.value_annual_usd || 0), 0)

  const stats: StatItem[] = [
    { label: t('wells'), value: og?.active_wells ?? 0 },
    { label: t('stats.companies'), value: companyNames.size },
    { label: t('oilProduction'), value: og?.production_oil_bbl_d ?? 0, format: 'compact' },
    { label: t('exportValue'), value: exportTotal, format: 'compact' },
  ]

  const prodPoints = production.map((p) => ({ date: p.date_month, oilBblD: p.oil_bbl_d, gasMmcfD: p.gas_mmcf_d }))
  // Production is ordered ascending, so the last point is the latest month available.
  const latestMonth = production.length ? production[production.length - 1].date_month.slice(0, 7) : null

  const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name))
  const idx = sorted.findIndex((p) => p.slug === slug)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        <section className="container pt-12 pb-8 md:pt-20">
          <Link
            href="/provincias"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary transition-colors hover:text-nd-text-display font-mono"
          >
            <ArrowLeft size={13} />
            {t('backToList')}
          </Link>
          <h1 className="mt-4 text-balance text-4xl sm:text-5xl leading-none text-nd-text-display md:text-7xl font-display break-words">
            {province.name}
          </h1>
          <p className="mt-4 text-sm text-nd-text-secondary font-mono">
            {t('oilGas')}
            {' · '}
            {t('summary', { wells: og?.active_wells ?? 0, companies: companyNames.size })}
          </p>
        </section>

        <section className="container pb-12">
          <StatCounters items={stats} />
        </section>

        {/* Sector tabs */}
        {(og || exportsRows.length > 0) && (
          <section className="container pb-12">
            <ProvinceSectorTabs
              oilGas={
                og
                  ? {
                      oilBblD: og.production_oil_bbl_d,
                      gasMmcfD: og.production_gas_mmcf_d,
                      wells: og.active_wells,
                      vmPct: og.vm_pct,
                      topOperators: (og.top_operators ?? []).map((o) => ({
                        slug: o.operator_slug,
                        name: o.operator_name,
                        boe: o.boe,
                      })),
                    }
                  : null
              }
              mining={null}
              exports={exportsRows.map((e) => ({ sector: e.sector, product: e.product, value: e.value_annual_usd }))}
            />
            {latestMonth ? (
              <span className="mt-4 inline-block">
                <SourceChip source={{ asOf: latestMonth }} />
              </span>
            ) : null}
          </section>
        )}

        {/* Production history */}
        {prodPoints.length > 1 && (
          <section className="container pb-12">
            <SectionHead eyebrow={t('tabs.oil')} title={t('productionHistory')} />
            <div className="border border-nd-border bg-nd-surface p-5 md:p-6">
              <ProvinceProductionChart points={prodPoints} />
            </div>
            {latestMonth ? (
              <span className="mt-4 inline-block">
                <SourceChip source={{ asOf: latestMonth }} />
              </span>
            ) : null}
          </section>
        )}

        {/* Prev / next */}
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
