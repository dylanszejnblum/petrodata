// The decimal mark the locale writes: ',' for es-AR, '.' for en-US. A plain
// lookup rather than a hook, so server components and chart tick formatters can
// call it from anywhere; memoized because tick formatters run once per tick.
const decimalMarks: Record<string, string> = {}
export const decimalMark = (locale: string): string =>
  (decimalMarks[locale] ??= (1.1).toLocaleString(locale).charAt(1))

// Suffix thresholds and trailing-zero trimming are locale-independent; only the
// decimal mark follows the locale, so a compact figure never renders "22.3B"
// next to an Intl es-AR "11,1B" on the same page.
export const formatCompact = (num: number, locale = 'es-AR'): string => {
  const abs = Math.abs(num)
  const mark = decimalMark(locale)

  const format = (value: number, suffix: string) => {
    const formatted = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)
    return `${formatted.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1').replace('.', mark)}${suffix}`
  }

  if (abs >= 1_000_000_000_000) return format(num / 1_000_000_000_000, 'T')
  if (abs >= 1_000_000_000) return format(num / 1_000_000_000, 'B')
  if (abs >= 1_000_000) return format(num / 1_000_000, 'M')
  if (abs >= 1_000) return format(num / 1_000, 'K')

  return num.toFixed(1).replace(/\.0+$/, '').replace('.', mark)
}

export const formatPercent = (ratio: number, locale = 'es-AR', digits = 1): string =>
  `${(ratio * 100).toFixed(digits).replace('.', decimalMark(locale))}%`

// Prices and other plain decimal figures. Separate from formatCompact: these are
// never abbreviated, so "1234.5" stays "1.234,5" rather than becoming "1,2K".
export const formatDecimal = (num: number, locale = 'es-AR', digits = 2): string =>
  num.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const formatMonth = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
