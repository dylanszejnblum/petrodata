import type { InvKpi } from '../_lib/types'

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



/** "2026-04" → "abr '26" · anual ("2025") tal cual. Receta única para
 *  las fechas de los tooltips de charts (Ramp/Actividad/Macro/bento). */
export function fmtPeriod(period: string): string {
  if (!period.includes('-')) return period
  const [y, m] = period.split('-')
  if (!m) return period
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${month} '${y.slice(2)}`
}

/** "2026-04" → "04-2026" · "2026-08-07[ …]" → "07-08-2026" · resto tal cual */
export function fmtUpdate(asOf: string): string {
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(asOf)
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`
  const ym = /^(\d{4})-(\d{2})$/.exec(asOf)
  return ym ? `${ym[2]}-${ym[1]}` : asOf
}
