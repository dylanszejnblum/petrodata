import type { ReactNode } from 'react'
import { SectionLabel } from './section-label'

/* Sección de página — receta única de las secciones numeradas:
   contenedor 80rem, SectionLabel (índice opcional + nota), blurb corto en
   secondary y el contenido. card=true envuelve el contenido en la card
   clara estándar.

   El ritmo vertical lo da el pb-16 de cada sección, así que entre dos
   secciones consecutivas el aire ya está. La PRIMERA después del hero no
   tiene nada arriba: ahí va `first`, que agrega el pt-10 que separa el
   rótulo de la hairline con la que cierra el hero. */
export function Section({
  index,
  title,
  note,
  blurb,
  card = false,
  first = false,
  children,
}: {
  index?: string
  title: string
  note?: string
  blurb: string
  card?: boolean
  first?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`mx-auto max-w-[80rem] px-4 md:px-8 pb-16 ${first ? 'pt-10 md:pt-12' : ''}`}
    >
      <div className="mb-3">
        <SectionLabel index={index} title={title} note={note} />
      </div>
      <p className="mb-5 max-w-2xl text-pretty text-sm leading-relaxed text-secondary">
        {blurb}
      </p>
      {card ? (
        <div className="rounded-[10px] border bg-surface p-5 md:p-6">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}
