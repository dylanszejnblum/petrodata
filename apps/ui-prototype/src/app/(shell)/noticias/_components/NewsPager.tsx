import Link from 'next/link'
import { formatInteger } from '@/lib/format'

/* Pager del design real: conteo a la izquierda; ← Anterior · Página X de Y ·
   Siguiente → a la derecha, texto 11.5px caps. Componente del pipeline de
   noticias (server-side: la página resuelve hrefFor según sus searchParams). */

export function NewsPager({
  page,
  totalPages,
  total,
  hrefFor,
}: {
  page: number
  totalPages: number
  total: number
  hrefFor: (p: number) => string
}) {
  const btn = 'inline-flex items-center gap-1.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]'
  const enabled = `${btn} text-primary transition-opacity duration-150 hover:opacity-70`
  const disabled = `${btn} text-primary opacity-30`
  return (
    <nav
      aria-label="Paginación"
      className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-7"
    >
      <span className="text-[11.5px] tracking-[0.04em] text-tertiary tnums">
        {formatInteger(total)} documentos
      </span>
      <div className="flex items-center gap-6">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={enabled}>
            <span aria-hidden>←</span> Anterior
          </Link>
        ) : (
          <span aria-disabled className={disabled}>
            <span aria-hidden>←</span> Anterior
          </span>
        )}
        <span className="text-[11.5px] tracking-[0.04em] text-primary tnums">
          Página {page} de {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={enabled}>
            Siguiente <span aria-hidden>→</span>
          </Link>
        ) : (
          <span aria-disabled className={disabled}>
            Siguiente <span aria-hidden>→</span>
          </span>
        )}
      </div>
    </nav>
  )
}
