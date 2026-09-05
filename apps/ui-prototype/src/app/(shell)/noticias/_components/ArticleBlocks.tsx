import type { NewsItem } from '@/fixtures/news'
import { NewsCardRow } from './NewsCard'

/* ============================================================================
   BLOQUES DEL CUERPO DEL ARTÍCULO — componentes del pipeline de noticias.
   Rompen la monotonía del texto con interrupciones con propósito, en el
   lenguaje Estrato: líneas divisorias, rombos, voz técnica en etiquetas.
   En producción, el pipeline editorial decide dónde va cada bloque.
   ========================================================================== */

/** Intertítulo — capítulos escaneables cada 3-4 párrafos */
export function ArticleSubhead({ children }: { children: React.ReactNode }) {
  return <h2 className="type-h2 mb-1 mt-10 !text-[1.15rem]">{children}</h2>
}

/** Pull quote — la frase con el dato, en display grande, con barra de acento
    vertical del color de la categoría (sin rombo ni líneas horizontales —
    ajuste de Mariano). El código real ya trae pullQuote(): la oración con cifra. */
export function PullQuote({
  children,
  accent = 'var(--text-primary)',
}: {
  children: React.ReactNode
  accent?: string
}) {
  return (
    <figure aria-label="Cita destacada" className="my-9 mx-0">
      <blockquote
        className="m-0 border-l-2 py-1 pl-5 md:pl-6"
        style={{ borderColor: accent }}
      >
        <p className="type-display m-0 text-balance !text-[1.35rem] !leading-[1.3] md:!text-[1.5rem]">
          {children}
        </p>
      </blockquote>
    </figure>
  )
}

/** Cifra destacada — el número de la nota como stat visual, no enterrado */
export function StatCallout({
  value,
  label,
  note,
  accent = 'var(--text-primary)',
}: {
  value: string
  label: string
  note?: string
  accent?: string
}) {
  return (
    <aside aria-label={`Dato destacado: ${label}`} className="my-9">
      <span aria-hidden className="block h-px bg-line" />
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-5">
        <span className="type-kpi text-[2.4rem]" style={{ color: accent }}>
          {value}
        </span>
        <div className="min-w-0">
          <p className="type-label-md m-0 !text-secondary">{label}</p>
          {note && <p className="type-label m-0 mt-1 tnums">{note}</p>}
        </div>
      </div>
      <span aria-hidden className="block h-px bg-line" />
    </aside>
  )
}

/** "Leé también" — nota relacionada incrustada a mitad de lectura */
export function InlineRelated({ item }: { item: NewsItem }) {
  return (
    <aside aria-label="Leé también" className="my-9">
      <p className="type-label-md mb-3 flex items-center gap-2 !tracking-[0.14em] !text-primary">
        Leé también
        <span aria-hidden className="h-px flex-1 bg-line" />
      </p>
      <NewsCardRow item={item} />
    </aside>
  )
}
