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
