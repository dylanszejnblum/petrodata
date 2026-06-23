import type { InvKpi } from '@/api/inversiones'

/** Format a raw value with the KPI's prefix/suffix/decimals in Argentine locale
 *  (`.` thousands, `,` decimals). Values are stored raw and formatted here. */
export function formatFigure(
  value: number,
  fmt: InvKpi['format'],
  locale = 'es-AR',
): string {
  const n = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
  }).format(value)
  return `${fmt.prefix ?? ''}${n}${fmt.suffix ?? ''}`
}

/** Signed percentage for delta chips, e.g. "+31,7%". */
export function formatDeltaPct(pct: number, locale = 'es-AR'): string {
  const n = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(pct)
  return `${n}%`
}

/** Tier accent color. Only `confirmado` exists today; future tiers slot in. */
export function tierColor(tier: string): string {
  switch (tier) {
    case 'confirmado':
      return 'var(--nd-success)'
    case 'en_marcha':
      return '#0284c7'
    case 'proyectado':
      return '#f59e0b'
    case 'referencia':
      return 'var(--nd-text-secondary)'
    default:
      return 'var(--nd-text-disabled)'
  }
}

/** Translation key for a tier label, under the `indicadores` namespace. Call
 *  sites resolve it with `t(tierLabelKey(tier))` so labels follow the UI locale
 *  (the raw Spanish tier code, e.g. `confirmado`, never reaches the UI). */
export function tierLabelKey(tier: string): string {
  switch (tier) {
    case 'confirmado':
      return 'tiers.confirmado'
    case 'en_marcha':
      return 'tiers.en_marcha'
    case 'proyectado':
      return 'tiers.proyectado'
    case 'referencia':
      return 'tiers.referencia'
    default:
      return 'tiers.confirmado'
  }
}
