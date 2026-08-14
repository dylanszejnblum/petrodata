import Link from 'next/link'
import Image from 'next/image'
import { Surface } from '@/ui/surface'
import { Badge } from '@/ui/badge'
import { CATEGORY_LABEL, type NewsItem } from '@/fixtures/news'
import { formatDate } from '@/lib/format'
import { bucketFor, photoFor } from './categories'

/* ============================================================================
   CARD DE NOTICIA — anatomía portada 1:1 del design kit real de vacamuerta.io
   (NewsFeatured.tsx + NewsSecondaryRow.tsx de producción), sobre tokens Estrato.

   Tres variantes:
   · NewsCardFeatured — "DESTACADA": hero oscuro con foto, doble velo de
     gradiente, esquinas de encuadre, píldora de categoría con punto que emite
     glow, sello de fecha gigante ("05 AGO '26"), título display, bajada,
     fuente · min de lectura y "Leer →".
   · NewsCardRow — fila compacta: miniatura + glifo de categoría + fecha corta,
     título en 2 líneas, bajada en 1, flecha.
   · NewsCard (flat) — tarjeta simple para grillas secundarias (relacionadas).

   Server components: la única interacción es el link.
   ========================================================================== */

/** "05 AGO" + "'26" — el sello de fecha sobredimensionado del kit */
function stampParts(iso: string): { big: string; year: string } {
  const d = new Date(`${iso}T00:00:00Z`)
  const big = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(d)
    .replace('.', '')
    .replace('-', ' ') // es-AR une con guion; el kit usa espacio: "05 AGO"
    .toUpperCase()
  return { big, year: `'${String(d.getUTCFullYear()).slice(2)}` }
}

/** "05 AGO" compacto para las filas */
function shortDate(iso: string): string {
  return stampParts(iso).big
}

export function CategoryGlyph({ icon, color, size = 14 }: { icon: string; color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d={icon} />
    </svg>
  )
}

export function NewsPhoto({ item, sizes, className = '' }: { item: NewsItem; sizes: string; className?: string }) {
  return (
    <Image
      src={item.image ?? photoFor(item)}
      alt=""
      fill
      sizes={sizes}
      /* Regla Estrato (Mariano, 2026-08-05): foto siempre B&N y OSCURECIDA,
         para garantizar contraste del texto claro sobre cualquier imagen */
      className={`object-cover grayscale brightness-[.68] ${className}`}
    />
  )
}

/* ---------------------------------------------------------------- DESTACADA */

export function NewsCardFeatured({ item }: { item: NewsItem }) {
  const bucket = bucketFor(item.category)
  const stamp = stampParts(item.date)

  return (
    <Link
      href={`/noticias/${item.id}`}
      className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[10px] border border-white/10 bg-inverse p-7 md:min-h-[562px]"
    >
      <NewsPhoto
        item={item}
        sizes="(min-width: 1024px) 452px, 100vw"
        className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      {/* Doble velo: legibilidad arriba/abajo + viñeta radial en los bordes */}
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,var(--scrim-soft)_0%,transparent_24%,transparent_42%,var(--scrim-mid)_62%,var(--scrim-hard)_82%,var(--surface-inverse)_100%)]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_0%,transparent_55%,var(--scrim-soft)_100%)]"
      />

      {/* Esquinas de encuadre (marca del kit) */}
      <span aria-hidden className="absolute inset-4">
        <span className="absolute left-0 top-0 size-3.5 border-l border-t border-white/30" />
        <span className="absolute right-0 top-0 size-3.5 border-r border-t border-white/30" />
        <span className="absolute bottom-0 left-0 size-3.5 border-b border-l border-white/30" />
        <span className="absolute bottom-0 right-0 size-3.5 border-b border-r border-white/30" />
      </span>

      <div className="relative flex items-start justify-between gap-4">
        {/* Píldora de categoría: punto del color del bucket, con glow */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-3.5 backdrop-blur">
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ background: bucket.color, boxShadow: `0 0 8px 1px ${bucket.color}99` }}
          />
          <span className="type-label !tracking-[0.18em] !text-white/80">
            {CATEGORY_LABEL[item.category]}
          </span>
        </span>

        {/* Sello de fecha */}
        <span className="flex flex-col items-end">
          <span className="type-label !tracking-[0.3em] !text-white/40">Publicado</span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="type-display text-3xl !text-white">{stamp.big}</span>
            <span className="text-[13px] text-white/50 tnums">{stamp.year}</span>
          </span>
        </span>
      </div>

      <div className="relative flex flex-col">
        <h3 className="type-display text-balance text-2xl !leading-[1.12] !text-white md:text-[1.8rem]">
          {item.title}
        </h3>
        <p className="mt-3.5 line-clamp-3 max-w-[340px] text-[15px] leading-relaxed text-white/55">
          {item.summary}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="truncate text-xs text-white/45 tnums">
            {item.source}
            {item.readingMin ? ` · ${item.readingMin} min de lectura` : ''}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-white/60">
            Leer <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------- FILA */

export function NewsCardRow({ item }: { item: NewsItem }) {
  const bucket = bucketFor(item.category)

  return (
    <Link
      href={`/noticias/${item.id}`}
      /* flex-1: en la columna de la destacada, las filas se reparten la altura
         del hero para terminar parejas (igual que producción) */
      className="grid flex-1 grid-cols-[88px_1fr_auto] items-center gap-4 overflow-hidden rounded-[10px] border bg-surface p-3 transition-colors duration-150 hover:border-line-strong sm:grid-cols-[112px_1fr_auto] sm:gap-[18px]"
    >
      <span className="relative block h-full min-h-[76px] overflow-hidden rounded-[8px] bg-inverse-2 sm:min-h-[92px]">
        <NewsPhoto item={item} sizes="112px" />
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-2.5">
          <CategoryGlyph icon={bucket.icon} color={bucket.color} />
          <span className="type-label-md truncate !tracking-[0.14em] !text-secondary">
            {CATEGORY_LABEL[item.category]}
          </span>
          <span className="type-label-md shrink-0 !tracking-[0.05em]">
            · {shortDate(item.date)}
          </span>
        </span>

        {/* line-clamp define su propio display; no agregar `block` (lo pisaría) */}
        <span className="mt-2 line-clamp-2 text-pretty text-base font-medium leading-snug tracking-[-0.01em] text-primary sm:text-lg">
          {item.title}
        </span>

        {item.summary && (
          <span className="mt-1.5 line-clamp-1 text-[13px] leading-snug text-secondary">
            {item.summary}
          </span>
        )}
      </span>

      <span aria-hidden className="text-sm text-tertiary">
        →
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------ CARD DE GRILLA */

/** "05 AGO 2026 · 4 MIN LECTURA" */
function metaLine(item: NewsItem): string {
  const d = new Date(`${item.date}T00:00:00Z`)
  const date = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(d)
    .replace(/\./g, '')
    .replace('-', ' ')
    .toUpperCase()
  return item.readingMin ? `${date} · ${item.readingMin} MIN LECTURA` : date
}

/** Card de grilla del feed: foto con la categoría estampada encima, titular,
    bajada y pie con fuente + "Leer →" (port 1:1 del NewsCard real). */
export function NewsCardGrid({ item }: { item: NewsItem }) {
  const bucket = bucketFor(item.category)

  return (
    <Link
      href={`/noticias/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border bg-surface transition-colors duration-150 hover:border-line-strong"
    >
      <span className="relative block h-[200px] shrink-0 overflow-hidden bg-raised md:h-[236px]">
        <NewsPhoto
          item={item}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0)_42%,rgba(0,0,0,0.6)_100%)]"
        />
        {/* Categoría estampada sobre la foto + hairline hacia la derecha */}
        <span className="absolute inset-x-6 bottom-4 flex items-center gap-2.5">
          <CategoryGlyph icon={bucket.icon} color={bucket.color} size={16} />
          <span className="type-label-md whitespace-nowrap font-semibold !tracking-[0.14em] !text-white">
            {CATEGORY_LABEL[item.category]}
          </span>
          <span aria-hidden className="h-px flex-1 bg-white/40" />
        </span>
      </span>

      <span className="flex flex-1 flex-col p-6">
        <span className="type-label-md !tracking-[0.14em] tnums">{metaLine(item)}</span>

        <span className="type-display mt-3 line-clamp-3 text-balance text-xl !leading-snug !tracking-[-0.01em]">
          {item.title}
        </span>

        {item.summary && (
          <span className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-secondary">
            {item.summary}
          </span>
        )}

        {/* pt exterior = aire MÍNIMO entre la bajada y la divisoria (mt-auto
            solo colapsa a 0 en cards llenas); 18px arriba y abajo de la línea */}
        <span className="mt-auto pt-[18px]">
          <span className="flex items-center justify-between gap-3 border-t pt-[18px]">
            <span className="truncate text-xs tracking-[0.02em] text-secondary">{item.source}</span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-primary">
              Leer <span aria-hidden>→</span>
            </span>
          </span>
        </span>
      </span>
    </Link>
  )
}

/* --------------------------------------------- compat: alias con variantes */

export function NewsCard({
  item,
  variant = 'grid',
}: {
  item: NewsItem
  variant?: 'photo' | 'flat' | 'grid'
}) {
  if (variant === 'photo') return <NewsCardFeatured item={item} />
  if (variant === 'flat') {
    const meta = `${formatDate(item.date)} · ${item.source}`
    return (
      <Link href={`/noticias/${item.id}`} className="block h-full">
        <article className="h-full">
          <Surface interactive className="flex h-full flex-col">
            <div>
              <Badge tone="neutral">{CATEGORY_LABEL[item.category]}</Badge>
            </div>
            <h3 className="type-card-title mt-3 !text-[1.05rem]">{item.title}</h3>
            <p className="mt-2 line-clamp-3 text-[13px] text-secondary">{item.summary}</p>
            <p className="type-label tnums mt-auto pt-4">{meta}</p>
          </Surface>
        </article>
      </Link>
    )
  }
  return <NewsCardGrid item={item} />
}
