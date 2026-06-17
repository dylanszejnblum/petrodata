import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { ProvinceList, type ProvinceCard } from '@/components/Petrodata/entities/ProvinceList'

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

async function getExportTotals(): Promise<Record<string, number>> {
  try {
    const { data, error } = await api.GET('/api/v2/provinces/export-summary', { cache: 'no-store' })
    if (error || !data) return {}
    const map: Record<string, number> = {}
    for (const p of data.data.provinces) {
      // Oil & gas focus: sum only non-mining export sectors.
      map[p.slug] = Object.entries(p.by_sector)
        .filter(([sector]) => !/miner/i.test(sector))
        .reduce((sum, [, v]) => sum + (v || 0), 0)
    }
    return map
  } catch {
    return {}
  }
}

export default async function ProvincesPage() {
  const [t, provinces, exportTotals] = await Promise.all([
    getTranslations('provinces'),
    getProvinces(),
    getExportTotals(),
  ])
  // Oil & gas focus: only provinces with oil & gas activity.
  const cards: ProvinceCard[] = provinces
    .filter((p) => p.has_oil_gas)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      wells: p.oil_gas_wells,
      exportUsd: exportTotals[p.slug] ?? null,
    }))

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
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
