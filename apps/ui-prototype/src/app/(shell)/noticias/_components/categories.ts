/* Buckets visuales de noticias — port 1:1 del design kit real de vacamuerta.io
   (frontend/src/components/Petrodata/news/categories.ts).
   Seis buckets: color + glifo + foto de stock propia. Las categorías editoriales
   del feed se mapean a un bucket.
   token-exception: paleta editorial de categorías del producto real — candidata
   a tokens `news.category.*` cuando el DS la absorba. */

import type { NewsItem } from '@/fixtures/news'

export type NewsBucketKey =
  | 'produccion'
  | 'regulacion'
  | 'infraestructura'
  | 'gnl'
  | 'empresas'
  | 'mercado'

export type NewsBucketStyle = {
  color: string
  /** path 24×24, stroke 1.6–1.7, round caps */
  icon: string
  photo: string
}

export const NEWS_BUCKETS: Record<NewsBucketKey, NewsBucketStyle> = {
  produccion: {
    color: '#3fb883',
    icon: 'M4 16l5-5 4 4 7-8',
    photo: '/images/news/news-produccion-rig.jpg',
  },
  regulacion: {
    color: '#4a90e2',
    icon: 'M7 4h8l3 3v13H7z M15 4v4h3',
    photo: '/images/news/news-regulacion-pumpjacks.jpg',
  },
  infraestructura: {
    color: '#e2a33f',
    icon: 'M3 12h4a3 3 0 016 0h8 M17 9v6',
    photo: '/images/news/news-infraestructura-oleoducto.jpg',
  },
  gnl: {
    color: '#38b6b6',
    icon: 'M12 3c3 4 5 6 5 10a5 5 0 01-10 0c0-2 1-3 2-4',
    photo: '/images/news/news-gnl-buque.jpg',
  },
  empresas: {
    color: '#9b7ede',
    icon: 'M5 20V6l7-3 7 3v14 M9 20v-4h6v4',
    photo: '/images/news/news-empresas-refineria.jpg',
  },
  mercado: {
    color: '#e2703f',
    icon: 'M5 20V10 M12 20V5 M19 20v-7',
    photo: '/images/news/news-mercado-noche.jpg',
  },
}

/** Mapeo categoría editorial → bucket visual (mismo criterio que producción) */
const CATEGORY_BUCKET: Record<NewsItem['category'], NewsBucketKey> = {
  produccion: 'produccion',
  ambiente: 'produccion',
  regulacion: 'regulacion',
  rigi: 'regulacion',
  laboral: 'empresas',
  exportacion: 'mercado',
  inversion: 'mercado',
  financiamiento: 'mercado',
  actualidad: 'mercado',
}

export function bucketFor(category: NewsItem['category']): NewsBucketStyle {
  return NEWS_BUCKETS[CATEGORY_BUCKET[category] ?? 'mercado']
}

const PHOTOS = Object.values(NEWS_BUCKETS).map((b) => b.photo)

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

/** Foto para una nota sin imagen propia: los buckets literales conservan la suya;
    el resto rota por el set para no repetir la misma foto en una grilla. */
export function photoFor(item: Pick<NewsItem, 'category' | 'id'>): string {
  const literal: Partial<Record<NewsItem['category'], NewsBucketKey>> = {
    produccion: 'produccion',
    regulacion: 'regulacion',
    rigi: 'regulacion',
  }
  const key = literal[item.category]
  if (key) return NEWS_BUCKETS[key].photo
  return PHOTOS[hash(item.category + item.id) % PHOTOS.length]
}
