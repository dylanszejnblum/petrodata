/* Noticias — GET /api/v1/news (+ facets + {docId}) vía src/api/news.ts.
   Mapea NewsCard (API) → NewsItem (fixture): topic principal → categoría,
   sourceName → source, deck → summary. */

import { fetchNews, fetchNewsDoc, fetchNewsFacets, type NewsCard } from '@/api/news'
import type { NewsItem } from '@/fixtures/news'
import { CATEGORY_LABEL, FILTER_CATEGORIES, NEWS as FIXTURE_NEWS } from '@/fixtures/news'
import { withFallback } from './fallback'

/** topic del backend → categoría editorial del fixture */
const TOPIC_TO_CATEGORY: Record<string, NewsItem['category']> = {
  produccion: 'produccion',
  producción: 'produccion',
  inversion: 'inversion',
  inversión: 'inversion',
  regulacion: 'regulacion',
  regulación: 'regulacion',
  financiamiento: 'financiamiento',
  exportacion: 'exportacion',
  exportación: 'exportacion',
  rigi: 'rigi',
  laboral: 'laboral',
  ambiente: 'ambiente',
  actualidad: 'actualidad',
}

function toCategory(card: NewsCard): NewsItem['category'] {
  const topic = (card.topics ?? [])[0]?.toLowerCase()
  return (topic && TOPIC_TO_CATEGORY[topic]) || 'actualidad'
}

/** "2026-05-28T20:30:00.000Z" | "2026-05-28" → "2026-05-28" ("" si falta). */
function toDay(iso: string | null | undefined): string {
  if (!iso) return ''
  const day = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : ''
}

export function toNewsItem(card: NewsCard, index: number): NewsItem {
  return {
    id: card.docId,
    title: card.title,
    summary: card.deck ?? '',
    category: toCategory(card),
    source: card.sourceName,
    date: toDay(card.publishedAt) || toDay(card.eventDate),
    featured: index === 0 && (card.importanceScore ?? 0) >= 0.5,
    photo: Boolean(card.image),
    readingMin: card.readingMinutes ?? undefined,
    image: card.image ?? undefined,
    video: false,
  }
}

export async function loadNews(pageSize = 24): Promise<NewsItem[]> {
  return withFallback(
    'news',
    async () => {
      const { items } = await fetchNews({ pageSize, sort: 'recent' })
      if (!items.length) return null
      return items.map(toNewsItem)
    },
    () => FIXTURE_NEWS,
  )
}

export async function loadNewsTotal(): Promise<number> {
  try {
    const { pagination } = await fetchNews({ pageSize: 1 })
    return pagination.total
  } catch {
    return FIXTURE_NEWS.length
  }
}

/** Nota individual: doc real por docId, con related del cluster.
 *  Si el backend no la tiene (o no responde), cae al fixture por id. */
export async function loadNewsDoc(
  id: string,
): Promise<{ item: NewsItem; related: NewsItem[] } | null> {
  const live = await fetchNewsDoc(id).catch(() => null)
  if (live?.document) {
    const item = toNewsItem(live.document, 0)
    const related = live.cluster.slice(0, 3).map((c, i) => toNewsItem(c, i + 1))
    return { item, related }
  }
  const item = FIXTURE_NEWS.find((n) => n.id === id)
  if (!item) return null
  const related = FIXTURE_NEWS.filter(
    (n) => n.id !== item.id && n.category === item.category,
  )
    .concat(FIXTURE_NEWS.filter((n) => n.id !== item.id && n.category !== item.category))
    .slice(0, 3)
  return { item, related }
}

export { FIXTURE_NEWS }

/* ── Las píldoras de filtro, del corpus real ─────────────────────────────
   GET /api/v1/news/facets — los temas con su conteo. La portada armaba las
   píldoras con FILTER_CATEGORIES del fixture (seis fijas); la v1 filtra por
   los topics vivos. Acá se traduce cada topic a la categoría editorial de
   siempre (TOPIC_TO_CATEGORY) y se ordena por cuántas notas tiene cada una:
   el filtro más útil es el primero.

   Sólo entran los topics con categoría conocida —CATEGORY_LABEL es la paleta
   de colores y el rótulo— y si la API no responde caen las seis del fixture,
   que es lo que había. */

export async function loadNewsPills(): Promise<{ id: NewsItem['category']; rot: string }[]> {
  try {
    const facets = await fetchNewsFacets()
    const conteo = new Map<NewsItem['category'], number>()
    for (const f of facets.topics) {
      const cat = TOPIC_TO_CATEGORY[f.value.toLowerCase()]
      if (!cat) continue
      conteo.set(cat, (conteo.get(cat) ?? 0) + f.count)
    }
    const vivas = [...conteo.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ id, rot: CATEGORY_LABEL[id] }))
    if (vivas.length) return vivas
  } catch {
    /* sin facets: el fixture */
  }
  return FILTER_CATEGORIES.map((c) => ({ id: c, rot: CATEGORY_LABEL[c] }))
}
