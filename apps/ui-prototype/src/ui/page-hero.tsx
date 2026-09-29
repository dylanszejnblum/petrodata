/* PageHero — el bloque eyebrow + h1 + copy que producción copia a mano en 3 páginas. */

export function PageHero({
  eyebrow,
  title,
  children,
  right,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pb-8 pt-10">
      <div className="min-w-0 max-w-[46rem]">
        <p className="type-label-md mb-2.5 flex items-center gap-2">
          <span aria-hidden className="size-1.5 bg-primary" />
          {eyebrow}
        </p>
        <h1 className="type-h1 text-balance break-words text-[clamp(2rem,5vw,2.6rem)]">{title}</h1>
        {children && <p className="mt-3 text-[14.5px] text-secondary">{children}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
