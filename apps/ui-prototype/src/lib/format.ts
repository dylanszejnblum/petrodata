/* Formateo único de Estrato — locale-aware (fix del COMP-07 de la auditoría).
   El prototipo corre en es-AR; la firma exige locale para que en producción
   nadie pueda volver a hardcodearlo. */

export type AppLocale = 'es' | 'en'

const INTL: Record<AppLocale, string> = { es: 'es-AR', en: 'en-US' }

export function formatInteger(value: number, locale: AppLocale = 'es'): string {
  return new Intl.NumberFormat(INTL[locale], { maximumFractionDigits: 0 }).format(value)
}

export function formatDecimal(value: number, digits = 1, locale: AppLocale = 'es'): string {
  return new Intl.NumberFormat(INTL[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCompact(value: number, locale: AppLocale = 'es'): string {
  return new Intl.NumberFormat(INTL[locale], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(value: number, digits = 1, locale: AppLocale = 'es'): string {
  return `${formatDecimal(value * 100, digits, locale)}%`
}

export function formatUSDCompact(value: number, locale: AppLocale = 'es'): string {
  return `US$ ${formatCompact(value, locale)}`
}

/** "may 2026" / "May 2026" */
export function formatMonth(iso: string, locale: AppLocale = 'es'): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d
    .toLocaleDateString(INTL[locale], { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .replace('.', '')
}

export function formatDate(iso: string, locale: AppLocale = 'es'): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString(INTL[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Delta MoM como "▲ 3,2%" | "▼ 1,4%" | null */
export function formatDelta(mom: number | null, locale: AppLocale = 'es'): {
  arrow: '▲' | '▼'
  label: string
  dir: 'up' | 'down'
} | null {
  if (mom == null || !Number.isFinite(mom) || mom === 0) return null
  return {
    arrow: mom > 0 ? '▲' : '▼',
    dir: mom > 0 ? 'up' : 'down',
    label: `${formatDecimal(Math.abs(mom * 100), 1, locale)}%`,
  }
}

/** Compacto a la argentina: NUNCA "K".
 *
 *  `Intl` en notación compacta abrevia los miles con "K" —"6,9 K"—, que no se
 *  usa en Argentina y que encima de una unidad que ya tiene magnitud produce
 *  lecturas absurdas: "6,9 K MUSD" son miles de millones de dólares escritos
 *  de la forma más confusa posible.
 *
 *  Acá los miles van con separador de miles, que es como se escriben, y sólo
 *  de un millón para arriba se abrevia con "M", que sí es de uso corriente.
 *
 *    6.900        y no  6,9 K
 *    557.149      y no  557,1 k
 *    17 M         igual que antes
 */
export function formatCompactAR(value: number, locale: AppLocale = 'es'): string {
  return Math.abs(value) < 1_000_000 ? formatInteger(value, locale) : formatCompact(value, locale)
}
