import { Link } from '@/i18n/navigation'
import type { NewsCard as NewsCardType } from '@/api/news'
import { getTranslations } from 'next-intl/server'
import {
  absoluteDate,
  entityList,
  familyColor,
  importanceLevel,
  isMetadataOnly,
  primaryCategory,
  relativeTime,
} from './meta'

function ImportanceDots({ score }: { score: number | null }) {
  const level = importanceLevel(score)
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full"
          style={{ background: i < level ? 'var(--nd-accent)' : 'var(--nd-border)' }}
        />
      ))}
    </span>
  )
}

export async function NewsCard({ card }: { card: NewsCardType }) {
  const t = await getTranslations('noticias')
  const entities = entityList(card).slice(0, 3)
  const category = primaryCategory(card)
  // Drop the category from the chip row so it isn't shown twice.
  const topics = (card.topics ?? []).filter((tp) => tp !== category.topic).slice(0, 3)
  const regulatory = !isMetadataOnly(card.legalMode)

  return (
    <article className="group flex flex-col border border-nd-border bg-nd-surface p-5 transition-colors hover:border-nd-text-disabled">
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em]">
        <span className="inline-flex items-center gap-1.5 text-nd-text-secondary">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: familyColor(card.sourceFamily) }}
          />
          {card.sourceName}
        </span>
        <span className="flex items-center gap-2 text-nd-text-disabled">
          <ImportanceDots score={card.importanceScore} />
          <time dateTime={card.publishedAt ?? undefined} title={absoluteDate(card.publishedAt)}>
            {relativeTime(card.publishedAt)}
          </time>
        </span>
      </div>

      {card.image ? (
        <Link href={`/noticias/${card.docId}`} className="mt-3 block">
          {/* External source URL — plain img avoids next/image domain config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full border border-nd-border bg-nd-bg object-cover"
          />
        </Link>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-disabled">
        <span className="text-nd-text-secondary">{category.label}</span>
        {card.readingMinutes ? (
          <span>· {t('readingTime', { minutes: card.readingMinutes })}</span>
        ) : null}
      </div>

      <h3 className="mt-2 text-pretty text-lg leading-snug text-nd-text-display font-sans">
        <Link
          href={`/noticias/${card.docId}`}
          className="transition-colors hover:text-nd-accent"
        >
          {card.title}
        </Link>
      </h3>

      {card.deck ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-nd-text-secondary font-sans">
          {card.deck}
        </p>
      ) : null}

      <div className="mt-4 flex flex-1 flex-wrap items-end gap-1.5">
        {regulatory ? (
          <span className="rounded-full border border-nd-success/40 bg-nd-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-success">
            Regulatorio
          </span>
        ) : null}
        {topics.map((topic) => (
          <Link
            key={topic}
            href={`/noticias?topic=${encodeURIComponent(topic)}`}
            className="rounded-full border border-nd-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-secondary transition-colors hover:border-nd-text-disabled hover:text-nd-text-display"
          >
            {topic}
          </Link>
        ))}
        {entities.map((entity) => (
          <Link
            key={entity}
            href={`/noticias?entity=${encodeURIComponent(entity)}`}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-disabled transition-colors hover:text-nd-accent"
          >
            {entity}
          </Link>
        ))}
      </div>
    </article>
  )
}
