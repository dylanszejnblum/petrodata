export const formatCompact = (num: number, fractionDigits = 1): string => {
  const abs = Math.abs(num)

  const format = (value: number, suffix: string) => {
    const formatted =
      value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(fractionDigits) : value.toFixed(fractionDigits + 1)
    return `${formatted.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}${suffix}`
  }

  if (abs >= 1_000_000_000_000) return format(num / 1_000_000_000_000, 'T')
  if (abs >= 1_000_000_000) return format(num / 1_000_000_000, 'B')
  if (abs >= 1_000_000) return format(num / 1_000_000, 'M')
  if (abs >= 1_000) return format(num / 1_000, 'K')

  return num.toFixed(fractionDigits).replace(/\.0+$/, '')
}

export const formatPercent = (ratio: number, fractionDigits = 1): string =>
  `${(ratio * 100).toFixed(fractionDigits)}%`

export const formatMonth = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
