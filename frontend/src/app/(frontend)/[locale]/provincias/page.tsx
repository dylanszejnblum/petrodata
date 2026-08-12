import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { ProvinceList, type ProvinceCard } from '@/components/Petrodata/entities/ProvinceList'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('provinces')
  return { title: t('listTitle'), alternates: buildAlternates('/provincias') }
}

async function getProvinces() {
  try {
    const { data, error } = await api.GET('/api/v2/provinces', { cache: 'no-store' })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

async function getExportTotals(): Promise<{ bySlug: Record<string, number>; national: number }> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/export-summary', { cache: 'no-store' })
    if (error || !data) return { bySlug: {}, national: 0 }
    const bySlug: Record<string, number> = {}
    for (const p of data.data.provinces) {
      // Oil & gas focus: sum only non-mining export sectors.
      bySlug[p.slug] = Object.entries(p.by_sector)
        .filter(([sector]) => !/miner/i.test(sector))
        .reduce((sum, [, v]) => sum + (v || 0), 0)
    }
    return { bySlug, national: data.data.national_total_usd || 0 }
  } catch {
    return { bySlug: {}, national: 0 }
  }
}

export default async function ProvincesPage() {
  const locale = await getLocale()
  const [t, provinces, exportTotals] = await Promise.all([
    getTranslations('provinces'),
    getProvinces(),
    getExportTotals(),
  ])
  // Oil & gas focus: only provinces with oil & gas activity, sorted by exports (desc).
  const cards: ProvinceCard[] = provinces
    .filter((p) => p.has_oil_gas)
    .map((p) => {
      const exportUsd = exportTotals.bySlug[p.slug] ?? null
      return {
        slug: p.slug,
        name: p.name,
        wells: p.oil_gas_wells,
        exportUsd,
        exportShare:
          exportUsd != null && exportTotals.national ? exportUsd / exportTotals.national : null,
      }
    })
    .sort((a, b) => (b.exportUsd ?? 0) - (a.exportUsd ?? 0))

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        <section className="container pt-12 pb-8 md:pt-20">
          <span className="block text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary font-mono">
            {t('listEyebrow')}
          </span>
          <h1 className="mt-4 text-balance text-4xl sm:text-5xl leading-none text-nd-text-display md:text-7xl font-display break-words">
            {t('listTitle')}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans">
            {t('listBlurb')}
          </p>
        </section>
        <section className="container pb-20">
          <ProvinceList provinces={cards} />
          {exportTotals.national > 0 && (
            <p className="mt-6 text-[11px] leading-relaxed text-nd-text-disabled font-mono">
              {t('shareNote', { total: `US$ ${formatCompactUSD(exportTotals.national, locale).slice(1)}` })}
            </p>
          )}
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
