import type { Metadata } from 'next'
import { SectionLabel } from '@/ui/section-label'
import { EmptyState } from '@/ui/empty-state'
import { CATEGORY_LABEL, FILTER_CATEGORIES, NEWS, TOTAL_DOCS, type NewsItem } from '@/fixtures/news'
import { applyEstado, readMock, type SearchParams } from '@/mock/state'
import { NewsCardFeatured, NewsCardGrid, NewsCardRow } from './_components/NewsCard'
import { CategoryFilter } from './_components/CategoryFilter'
import { NewsPager } from './_components/NewsPager'

/* Noticias — estructura portada 1:1 de vacamuerta.io/noticias:
   HERO con hairline · DESTACADA (hero 452px + 4 filas) · ÚLTIMAS NOTICIAS
   (chips de tema + grilla de 3 columnas de cards con foto) · pager textual.
   Sin el dropdown "Filtros ▾" ni el toggle "Relevancia | Reciente"
   (decisión de Mariano, 2026-08-05). */

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Seguimiento continuo de noticias, regulación y comunicados del sector de petróleo y gas de Vaca Muerta.',
}

/** Notas que flanquean a la destacada en la página uno (como producción) */
const SECONDARY_COUNT = 4
const PER_PAGE = 9

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function NoticiasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const { estado } = await readMock(searchParams)

  const rawCat = first(sp.categoria)
  const categoria = (Object.keys(CATEGORY_LABEL) as NewsItem['category'][]).includes(
    rawCat as NewsItem['category'],
  )
    ? (rawCat as NewsItem['category'])
    : null

  const data = applyEstado(estado, NEWS, 3)

  /* HERO — como el real: eyebrow .25em, h1, blurb, hairline inferior */
  const hero = (
    /* py simétrico: mismo aire arriba (navbar→eyebrow) que abajo
       (subcopy→hairline) — ajuste de Mariano sobre el original */
    <section className="border-b pb-6 pt-5">
      <span className="type-label !tracking-[0.25em]">Cobertura de la cuenca</span>
      <h1 className="type-h1 mt-2.5 text-balance">Noticias</h1>
      <p className="mt-2.5 max-w-[640px] text-pretty text-[13.5px] leading-relaxed text-secondary">
        Seguimiento continuo de noticias, regulación y comunicados del sector de petróleo y gas de
        Vaca Muerta. Filtrá por tema.
      </p>
    </section>
  )

  if (data === null) {
    return (
      <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
        {hero}
        <div className="pt-8">
          <EmptyState
            kind={estado === 'offline' ? 'offline' : 'error'}
            actionHref="/noticias"
            actionLabel="Reintentar"
          />
        </div>
      </div>
    )
  }

  const items = data
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((n) => (categoria ? n.category === categoria : true))

  const rawPage = Number(first(sp.page)) || 1

  // La destacada + sus 4 filas solo encabezan la página uno sin filtro;
  // páginas más profundas y vistas filtradas son grilla plana.
  const showLead = rawPage === 1 && !categoria && items.length > SECONDARY_COUNT + 1
  const featured = showLead ? (items.find((n) => n.featured) ?? items[0]) : null
  const secondary = showLead
    ? items.filter((n) => n.id !== featured!.id).slice(0, SECONDARY_COUNT)
    : []
  const grid = items.filter(
    (n) => n.id !== featured?.id && !secondary.some((s) => s.id === n.id),
  )

  const totalPages = Math.max(1, Math.ceil(grid.length / PER_PAGE))
  const page = Math.min(Math.max(1, rawPage), totalPages)
  const pageItems = grid.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const hrefFor = (p: number) => {
    const q = new URLSearchParams()
    if (categoria) q.set('categoria', categoria)
    const est = first(sp.estado)
    if (est) q.set('estado', est)
    if (p > 1) q.set('page', String(p))
    const qs = q.toString()
    return qs ? `/noticias?${qs}` : '/noticias'
  }

  return (
    /* pb-8 (32px): el pager es una línea finita de texto, con el aire
       estándar de 64px el cierre quedaba flotando (pedido de Mariano) */
    <div className="mx-auto max-w-[80rem] px-4 pb-8 md:px-8">
      {hero}

      {/* DESTACADA */}
      {featured && (
        <section className="pt-8" aria-label="Destacada">
          <div className="mb-5">
            <SectionLabel title="Destacada" />
          </div>
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[452px_1fr] lg:gap-9">
            <NewsCardFeatured item={featured} />
            {secondary.length > 0 && (
              <div className="flex flex-col gap-3">
                {secondary.map((n) => (
                  <NewsCardRow key={n.id} item={n} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ÚLTIMAS NOTICIAS */}
      <section className="pt-12" aria-label="Últimas noticias">
        <div className="mb-5">
          <SectionLabel
            title={categoria ? CATEGORY_LABEL[categoria] : 'Últimas noticias'}
            note={categoria ? `${items.length} notas` : undefined}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <CategoryFilter active={categoria} categories={FILTER_CATEGORIES} />
        </div>

        {pageItems.length ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((n) => (
              <NewsCardGrid key={n.id} item={n} />
            ))}
          </div>
        ) : (
          <EmptyState
            kind="empty"
            detail={
              categoria
                ? `No hay notas en ${CATEGORY_LABEL[categoria]} por ahora.`
                : 'Todavía no hay noticias cargadas.'
            }
            actionHref={categoria ? '/noticias' : undefined}
            actionLabel="Quitar filtros"
          />
        )}

        <NewsPager page={page} totalPages={totalPages} total={TOTAL_DOCS} hrefFor={hrefFor} />
      </section>
    </div>
  )
}
