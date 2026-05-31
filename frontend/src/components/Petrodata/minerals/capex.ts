/**
 * Parses capex strings like "620 M USD", "1.2 B USD", "750M", "$450 MM" into a
 * normalized value in MILLIONS of USD.
 *
 * Returns null if no number can be extracted. We accept K/M/MM/B suffixes
 * (MM = million, common in mining decks) and an optional $/USD.
 */
export function parseCapexUsdM(capex: string | null | undefined): number | null {
  if (!capex) return null
  const cleaned = capex.replace(/\$/g, '').trim()
  const m = cleaned.match(/^([\d.,]+)\s*(MM|M|B|K)?\s*(USD)?/i)
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  const unit = (m[2] || '').toUpperCase()
  if (unit === 'B') return num * 1000 // billions → millions
  if (unit === 'K') return num / 1000 // thousands → millions
  // M / MM / empty → assume already in millions
  return num
}
