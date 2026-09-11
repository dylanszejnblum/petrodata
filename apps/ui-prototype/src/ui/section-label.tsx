import Link from 'next/link'

/* Regla de sección del kit — port 1:1 del SectionLabel real de producción:
   índice opcional, rótulo 11px caps tracking 0.2em en color display, hairline,
   y nota derecha (que puede ser link, ej. "Todas las noticias →"). */

export function SectionLabel({
  index,
  title,
  note,
  noteHref,
  as: Tag = 'h2',
}: {
  index?: string
  title: string
  note?: string
  noteHref?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div className="flex items-center gap-3">
      {index && <span className="type-label-md !text-tertiary font-semibold tnums">{index}</span>}
      <Tag className="type-label-md m-0 font-medium !tracking-[0.2em] !text-primary">{title}</Tag>
      <span aria-hidden className="h-px flex-1 bg-line" />
      {note &&
        (noteHref ? (
          <Link
            href={noteHref}
            className="type-label shrink-0 !tracking-[0.1em] !text-secondary transition-colors duration-150 hover:!text-primary"
          >
            {note}
          </Link>
        ) : (
          <span className="type-label tnums shrink-0 !tracking-[0.1em] hidden sm:block">{note}</span>
        ))}
    </div>
  )
}
