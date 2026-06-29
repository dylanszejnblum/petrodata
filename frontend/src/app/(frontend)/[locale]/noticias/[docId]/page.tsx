import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { buildAlternates } from '@/i18n/alternates'
import { fetchNewsDoc } from '@/api/news'
import { NewsCard } from '@/components/Petrodata/news/NewsCard'
import { NewsBody } from '@/components/Petrodata/news/NewsBody'
import {
  absoluteDate,
  entityList,
  familyColor,
  isMetadataOnly,
  primaryCategory,
  pullQuote,
  readingMinutes,
  relativeTime,
  splitAttachments,
} from '@/components/Petrodata/news/meta'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ docId: string }>
}): Promise<Metadata> {
  const { docId } = await params
  const res = await fetchNewsDoc(docId)
  if (!res) return { title: 'Noticias' }
  return {
    title: res.document.title,
    description: res.document.deck ?? undefined,
    alternates: buildAlternates(`/noticias/${docId}`),
  }
}

export default async function NoticiaDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>
}) {
  const { docId } = await params
  const [t, res] = await Promise.all([getTranslations('noticias'), fetchNewsDoc(docId)])
  if (!res) notFound()

  const { document: doc, cluster } = res
  const metadataOnly = isMetadataOnly(doc.legalMode)
  const entities = entityList(doc)
  const topics = doc.topics ?? []
  const category = primaryCategory(doc)
  const { images, documents } = splitAttachments(doc.attachments)
  const hasBody = !metadataOnly && !!doc.bodyText
  const minutes = hasBody ? readingMinutes(doc.bodyText) : 0
  const heroImage = !metadataOnly ? images[0] : undefined
  const bodyImages = heroImage ? images.slice(1) : []
  const highlight = hasBody ? pullQuote(doc.bodyText) : null

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        <article className="container max-w-3xl pt-10 pb-16 md:pt-16">
          <Link
            href="/noticias"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled transition-colors hover:text-nd-text-display"
          >
            ← {t('backToFeed')}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: familyColor(doc.sourceFamily) }}
              />
              {doc.sourceName}
            </span>
            {doc.publishedAt ? (
              <time dateTime={doc.publishedAt} className="text-nd-text-disabled">
                {absoluteDate(doc.publishedAt)} · {relativeTime(doc.publishedAt)}
              </time>
            ) : null}
            {category.topic ? (
              <Link
                href={`/noticias?topic=${encodeURIComponent(category.topic)}`}
                className="rounded-full border border-nd-border px-2 py-0.5 text-[10px] text-nd-text-secondary transition-colors hover:border-nd-text-display hover:text-nd-text-display"
              >
                {category.label}
              </Link>
            ) : null}
            {minutes ? <span className="text-nd-text-disabled">{t('readingTime', { minutes })}</span> : null}
            {!metadataOnly ? (
              <span className="rounded-full border border-nd-success/40 bg-nd-success/10 px-2 py-0.5 text-[10px] text-nd-success">
                {t('regulatory')}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-balance text-3xl leading-tight text-nd-text-display md:text-5xl font-display">
            {doc.title}
          </h1>

          {/* TL;DR — the authored deck, surfaced as a labeled summary block. */}
          {doc.deck ? (
            <div className="mt-6 border-l-2 border-nd-text-disabled pl-4 sm:pl-5">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {t('tldr')}
              </span>
              <p className="text-pretty text-lg leading-relaxed text-nd-text-secondary font-sans">
                {doc.deck}
              </p>
            </div>
          ) : null}

          {/* Hero image (first image attachment, when licensed to reproduce). */}
          {heroImage ? (
            <figure className="mt-8">
              {/* External source URL — plain img avoids next/image domain config. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage.url}
                alt={heroImage.title || doc.title}
                className="w-full border border-nd-border bg-nd-surface object-cover"
              />
              {heroImage.title ? (
                <figcaption className="mt-2 font-mono text-[11px] text-nd-text-disabled">
                  {heroImage.title}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* Body: only for documents we are licensed to reproduce. */}
          {hasBody ? (
            <NewsBody
              text={doc.bodyText as string}
              highlight={highlight}
              highlightLabel={t('keyPoint')}
              images={bodyImages}
            />
          ) : null}

          {/* Regulatory attachments (e.g. CNV PDFs). */}
          {!metadataOnly && documents.length ? (
            <div className="mt-8 flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {t('attachments')}
              </span>
              {documents.map((a, i) => (
                <a
                  key={`${a.url}-${i}`}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 border border-nd-border px-3 py-2 font-mono text-xs text-nd-text-secondary transition-colors hover:border-nd-text-disabled hover:text-nd-text-display"
                >
                  {a.title || a.url} ↗
                </a>
              ))}
            </div>
          ) : null}

          {/* Source link — always present; the only body for metadata_only docs. */}
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-fit items-center gap-2 bg-nd-text-display px-4 py-2.5 font-mono text-xs uppercase tracking-[0.06em] text-nd-surface transition-opacity hover:opacity-80"
          >
            {t('readAtSource', { source: doc.sourceName })} →
          </a>

          {entities.length || topics.length ? (
            <div className="mt-10 border-t border-nd-border pt-6">
              {topics.length ? (
                <div className="mb-4">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                    {t('topicsLabel')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((topic) => (
                      <Link
                        key={topic}
                        href={`/noticias?topic=${encodeURIComponent(topic)}`}
                        className="rounded-full border border-nd-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-nd-text-secondary transition-colors hover:border-nd-text-disabled hover:text-nd-text-display"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {entities.length ? (
                <div>
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                    {t('entitiesLabel')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {entities.map((entity) => (
                      <Link
                        key={entity}
                        href={`/noticias?entity=${encodeURIComponent(entity)}`}
                        className="rounded-full border border-nd-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-nd-text-secondary transition-colors hover:border-nd-accent hover:text-nd-accent"
                      >
                        {entity}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>

        {cluster.length ? (
          <section className="container pb-20">
            <h2 className="mb-5 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
              {t('relatedCoverage')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cluster.map((card) => (
                <NewsCard key={card.docId} card={card} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <NothingFooter />
    </>
  )
}
