import type { NewsItem } from '@/fixtures/news'
import { NewsPhoto } from './NewsCard'

/* ============================================================================
   RAIL DERECHO DEL ARTÍCULO — componentes del pipeline de noticias.
   Solo existe en desktop (lg+); en móvil el video se integra al cuerpo.
   ========================================================================== */

/** Player de video de la nota (mock: poster + play; en producción, el embed
    real que traiga el pipeline). Solo se muestra si item.video === true. */
export function VideoCard({ item }: { item: NewsItem }) {
  return (
    <figure aria-label="Video de la nota" className="m-0">
      <button
        type="button"
        aria-label={`Reproducir video: ${item.title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-[10px] border border-white/10 bg-inverse"
      >
        <NewsPhoto item={item} sizes="336px" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--scrim-mid)_100%)]" />
        {/* Play */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/40 backdrop-blur-sm transition-transform duration-150 group-hover:scale-105"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
        <span className="type-label absolute bottom-3 left-4 !text-on-dark-2">
          Video · {item.source}
        </span>
      </button>
    </figure>
  )
}

/** Espacio publicitario — SIEMPRE rotulado (práctica obligatoria).
    Mock: placeholder IAB "large rectangle" 336×280 (estándar, como el
    300×250 pero mayor); variante tall = "half page" 300×600.
    En producción, el slot del ad server. */
export function AdSlot({ tall = false }: { tall?: boolean }) {
  return (
    <aside aria-label="Publicidad" className="flex flex-col gap-1.5">
      <span className="type-label self-start">Publicidad</span>
      <div
        className={`grid w-full place-items-center rounded-[10px] border border-dashed border-line-strong bg-raised ${
          tall ? 'min-h-[600px]' : 'min-h-[280px]'
        }`}
      >
        <span className="type-label !text-tertiary tnums">{tall ? '300 × 600' : '336 × 280'}</span>
      </div>
    </aside>
  )
}
