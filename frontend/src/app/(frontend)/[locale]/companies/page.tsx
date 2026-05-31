import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { CompanyList, type CompanyCard } from '@/components/Petrodata/entities/CompanyList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('companies')
  return { title: t('listTitle'), alternates: buildAlternates('/companies') }
}

async function getCompanies() {
  try {
    const { data, error } = await api.GET('/api/v2/companies', { cache: 'no-store' })
    if (error || !data) return []
    return data.data
  } catch {
    return []
  }
}

export default async function CompaniesPage() {
  const [t, companies] = await Promise.all([getTranslations('companies'), getCompanies()])
  const cards: CompanyCard[] = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    origin: str(c.origin_country),
    projectCount: c.project_count,
    commodities: c.commodities ?? [],
  }))

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full">
        <section className="container pt-12 pb-8 md:pt-20">
          <span className="block text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary font-mono">
            {t('listEyebrow')}
          </span>
          <h1 className="mt-4 text-balance text-5xl leading-none text-nd-text-display md:text-7xl font-display">
            {t('listTitle')}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans">
            {t('listBlurb')}
          </p>
        </section>
        <section className="container pb-20">
          <CompanyList companies={cards} />
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
