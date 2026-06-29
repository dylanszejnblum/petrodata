import type { LegalMode, NewsAttachment, NewsCard } from '@/api/news'

/** A document whose full text we may not reproduce — link out to the source. */
export function isMetadataOnly(legalMode: LegalMode): boolean {
  return legalMode !== 'fulltext_internal'
}

/** Color accent per source family (drives the small family tag on each card). */
const FAMILY_COLORS: Record<string, string> = {
  regulatoria: 'var(--nd-success)',
  corporativa: '#0284c7',
  media: '#a855f7',
  prensa: '#a855f7',
  gdelt: '#f59e0b',
  rss: '#f59e0b',
}

export function familyColor(family: string): string {
  return FAMILY_COLORS[family.toLowerCase()] ?? 'var(--nd-accent)'
}

export function familyLabel(family: string): string {
  if (!family) return ''
  return family.charAt(0).toUpperCase() + family.slice(1)
}

/** Importance buckets → 0..3 dots. */
export function importanceLevel(score: number | null): number {
  if (score == null) return 0
  if (score >= 0.75) return 3
  if (score >= 0.5) return 2
  if (score >= 0.25) return 1
  return 0
}

/** Companies + regulators, de-duped, for entity chips. */
export function entityList(card: Pick<NewsCard, 'entities'>): string[] {
  const e = card.entities ?? {}
  const all = [...(e.companies ?? []), ...(e.regulators ?? [])]
  return Array.from(new Set(all.filter(Boolean)))
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** Relative time in es-AR ("hace 3 horas"). Rendered server-side only. */
export function relativeTime(iso: string | null, locale = 'es-AR'): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = (t - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diff)
  for (const [unit, secs] of UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return rtf.format(Math.round(diff), 'second')
}

/**
 * The card's primary category — the first topic, Title-cased, falling back to
 * the source family. `topic` (when present) lets callers link to the filter.
 */
export function primaryCategory(
  card: Pick<NewsCard, 'topics' | 'sourceFamily'>,
): { label: string; topic: string | null } {
  const topic = (card.topics ?? []).find(Boolean) ?? null
  if (topic) {
    const label = topic
      .split(/[\s_-]+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ')
    return { label, topic }
  }
  return { label: familyLabel(card.sourceFamily), topic: null }
}

/** Estimated reading time in whole minutes (>= 1), at ~200 wpm. */
export function readingMinutes(text: string | null | undefined): number {
  if (!text) return 0
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (!words) return 0
  return Math.max(1, Math.round(words / 200))
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i

/** Split attachments into displayable images and everything else (PDFs, etc.). */
export function splitAttachments(attachments: NewsAttachment[] | null | undefined): {
  images: NewsAttachment[]
  documents: NewsAttachment[]
} {
  const images: NewsAttachment[] = []
  const documents: NewsAttachment[] = []
  for (const a of attachments ?? []) {
    if (!a?.url) continue
    const isImage = a.type?.toLowerCase().startsWith('image') || IMAGE_EXT.test(a.url)
    ;(isImage ? images : documents).push(a)
  }
  return { images, documents }
}

/**
 * Pull a single "key" sentence out of the body to surface as a large highlighted
 * block. Prefers a sentence carrying a number/figure (the substantive remark);
 * otherwise the longest sentence in a readable length window. Returns null when
 * nothing suitable is found.
 */
export function pullQuote(text: string | null | undefined): string | null {
  if (!text) return null
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 60 && s.length <= 220)
  if (!sentences.length) return null
  const withNumber = sentences.find((s) => /\d/.test(s))
  if (withNumber) return withNumber
  return sentences.reduce((a, b) => (b.length > a.length ? b : a))
}

export function absoluteDate(iso: string | null, locale = 'es-AR'): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
