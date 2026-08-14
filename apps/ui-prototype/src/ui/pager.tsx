import Link from 'next/link'

export function Pager({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
}) {
  const prev = page > 1
  const next = page < totalPages
  const item = 'inline-flex min-h-9 items-center rounded-[8px] border border-line-strong bg-surface px-3.5 text-[12.5px] font-medium text-primary hover:bg-raised'
  const disabled = 'inline-flex min-h-9 items-center rounded-[8px] border px-3.5 text-[12.5px] text-tertiary opacity-60'
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      {prev ? (
        <Link href={hrefFor(page - 1)} className={item}>
          ← Anterior
        </Link>
      ) : (
        <span aria-disabled className={disabled}>← Anterior</span>
      )}
      <span className="type-label tnums">
        Página {page} de {totalPages}
      </span>
      {next ? (
        <Link href={hrefFor(page + 1)} className={item}>
          Siguiente →
        </Link>
      ) : (
        <span aria-disabled className={disabled}>Siguiente →</span>
      )}
    </nav>
  )
}
