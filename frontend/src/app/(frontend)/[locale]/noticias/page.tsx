import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { buildAlternates } from '@/i18n/alternates'
import { fetchNews, fetchNewsFacets, type NewsListParams } from '@/api/news'
import { NewsCard } from '@/components/Petrodata/news/NewsCard'
import { NewsFilters } from '@/components/Petrodata/news/NewsFilters'
import { NewsPager } from '@/components/Petrodata/news/NewsPager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('noticias')
  return { title: t('title'), description: t('blurb'), alternates: buildAlternates('/noticias') }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function NoticiasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const t = await getTranslations('noticias')

  const params: NewsListParams = {
    page: first(sp.page) ? Number(first(sp.page)) : 1,
    pageSize: 24,
    // Default to newest-first; importance only when explicitly requested.
    sort: first(sp.sort) === 'importance' ? 'importance' : 'recent',
    family: first(sp.family),
    topic: first(sp.topic),
    entity: first(sp.entity),
    region: first(sp.region),
    q: first(sp.q),
  }

  const [facets, result] = await Promise.all([fetchNewsFacets(), fetchNews(params)])
  const { items, pagination } = result

  // Flat record of the active query, for building pager links.
  const activeParams: Record<string, string | undefined> = {
    sort: first(sp.sort),
    family: params.family,
    topic: params.topic,
    entity: params.entity,
    region: params.region,
    q: params.q,
  }

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        <section className="container pt-12 pb-6 md:pt-20">
          <h1 className="text-balance text-4xl sm:text-5xl leading-none text-nd-text-display md:text-7xl font-display break-words">
            {t('title')}
          </h1>
        </section>

        <section className="container pb-6">
          <NewsFilters facets={facets} />
        </section>

        <section className="container pb-20">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {t('resultsCount', { count: pagination.total })}
          </p>

          {items.length ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((card) => (
                  <NewsCard key={card.docId} card={card} />
                ))}
              </div>
              <div className="mt-8">
                <NewsPager pagination={pagination} params={activeParams} />
              </div>
            </>
          ) : (
            <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
          )}
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
