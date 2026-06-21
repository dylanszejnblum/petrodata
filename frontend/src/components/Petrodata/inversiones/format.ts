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
    default:
      return 'var(--nd-text-disabled)'
  }
}

export function tierLabel(tier: string): string {
  switch (tier) {
    case 'confirmado':
      return 'Confirmado'
    case 'en_marcha':
      return 'En marcha'
    case 'proyectado':
      return 'Proyectado'
    default:
      return tier
  }
}
