'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_LABEL, type NewsItem } from '@/fixtures/news'
import { bucketFor } from './categories'

/* Fila de categorías del design real (NewsTopicChips de producción):
   glifo del color del bucket + texto plano; la activa a contraste pleno.
   Sin píldoras. "Todas" usa el rombo con currentColor. */

const ALL_TOPICS_ICON = 'M12 3l9 9-9 9-9-9z'

export function CategoryFilter({
  active,
  categories,
}: {
  active: NewsItem['category'] | null
  categories?: NewsItem['category'][]
}) {
  const router = useRouter()
  const search = useSearchParams()
  const visible = categories ?? (Object.keys(CATEGORY_LABEL) as NewsItem['category'][])

  function apply(cat: NewsItem['category'] | null) {
    const params = new URLSearchParams(search.toString())
    params.delete('page')
    if (cat) params.set('categoria', cat)
    else params.delete('categoria')
    const qs = params.toString()
    router.push(qs ? `/noticias?${qs}` : '/noticias', { scroll: false })
  }

  const chips: { key: NewsItem['category'] | null; label: string; color: string; icon: string }[] = [
    { key: null, label: 'Todas', color: 'currentColor', icon: ALL_TOPICS_ICON },
    ...visible.map((key) => ({
      key: key as NewsItem['category'] | null,
      label: CATEGORY_LABEL[key],
      color: bucketFor(key).color,
      icon: bucketFor(key).icon,
    })),
  ]

  return (
    <div role="group" aria-label="Filtrar por tema" className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {chips.map((chip) => {
        const isActive = active === chip.key
        return (
          <button
            key={chip.key ?? 'all'}
            type="button"
            onClick={() => apply(chip.key)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 py-1 text-xs tracking-[0.02em] transition-colors duration-150 ${
              isActive
                ? 'font-semibold text-primary'
                : 'font-medium text-tertiary hover:text-secondary'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={chip.color}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={chip.icon} />
            </svg>
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
