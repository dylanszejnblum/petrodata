import type { NewsItem } from '@/fixtures/news'
import { CATEGORY_LABEL } from '@/fixtures/news'
import { formatDate } from '@/lib/format'
import { CategoryGlyph, NewsPhoto } from './NewsCard'
import { ShareRow } from './ShareRow'
import { bucketFor } from './categories'

/* Hero de la nota — componente del pipeline de noticias.
   Composición (decisiones de Mariano, 2026-08-05/06):
   foto real B&N oscurecida + velo direccional · fecha · fuente ARRIBA del
   titular · glifo + categoría + hairline · botones de compartir debajo.
   Marco negro de 4px hacia adentro (border-box: la card no crece). */

export function ArticleHero({ item }: { item: NewsItem }) {
  const bucket = bucketFor(item.category)
  const categoryLabel = CATEGORY_LABEL[item.category]

  return (
    <div className="relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[10px] border-4 border-black bg-inverse p-5 md:min-h-[19rem] md:p-6">
      <NewsPhoto item={item} sizes="(min-width: 1280px) 1216px, 100vw" />
      <span
        aria-hidden
        /* velo direccional: oscuro a la izquierda (texto) y foto plena a la
           derecha + refuerzo inferior para la franja de categoría/fecha */
        className="absolute inset-0 bg-[linear-gradient(90deg,var(--scrim-hard)_0%,var(--scrim-mid)_38%,transparent_72%),linear-gradient(0deg,var(--surface-inverse)_0%,var(--scrim-mid)_22%,transparent_48%)]"
      />
      <p className="type-label tnums relative !text-on-dark-3">
        {formatDate(item.date)} · {item.source}
      </p>
      <h1 className="type-h1 relative mt-3 max-w-[42rem] text-balance !text-white text-[clamp(1.7rem,4vw,2.4rem)]">
        {item.title}
      </h1>
      <div className="relative mt-6 flex items-center gap-2.5">
        <CategoryGlyph icon={bucket.icon} color={bucket.color} size={16} />
        <span className="type-label-md whitespace-nowrap font-semibold !tracking-[0.14em] !text-white">
          {categoryLabel}
        </span>
        <span aria-hidden className="h-px flex-1 bg-white/40" />
      </div>
      <ShareRow title={item.title} id={item.id} />
    </div>
  )
}
