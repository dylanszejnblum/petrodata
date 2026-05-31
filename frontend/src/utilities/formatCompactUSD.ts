export const formatCompactUSD = (num: number): string => {
  const abs = Math.abs(num)

  const format = (value: number, suffix: string) => {
    const formatted = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)
    return `$${formatted.replace(/\.0$/, '').replace(/(\.\d*[1-9])0$/, '$1')}${suffix}`
  }

  if (abs >= 1_000_000_000_000) return format(num / 1_000_000_000_000, 'T')
  if (abs >= 1_000_000_000) return format(num / 1_000_000_000, 'B')
  if (abs >= 1_000_000) return format(num / 1_000_000, 'M')
  if (abs >= 1_000) return format(num / 1_000, 'K')

  return `$${num.toFixed(2)}`
}
