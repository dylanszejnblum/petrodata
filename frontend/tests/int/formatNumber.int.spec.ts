import { describe, it, expect } from 'vitest'

import { formatCompact, formatPercent } from '@/utilities/formatNumber'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'

// The page prints compact figures next to Intl-formatted ones, so the decimal
// mark has to follow the locale. Everything else (suffix thresholds, trailing
// zero trimming, negatives) must stay exactly as it was.
describe('compact formatters', () => {
  it('uses the locale decimal mark', () => {
    expect(formatCompact(22_300_000_000)).toBe('22,3B')
    expect(formatCompact(22_300_000_000, 'en-US')).toBe('22.3B')
    expect(formatCompactUSD(22_300_000_000)).toBe('$22,3B')
    expect(formatCompactUSD(22_300_000_000, 'en-US')).toBe('$22.3B')
    expect(formatPercent(0.035)).toBe('3,5%')
    expect(formatPercent(0.035, 'en-US')).toBe('3.5%')
  })

  it('keeps the suffix thresholds', () => {
    expect(formatCompact(999)).toBe('999')
    expect(formatCompact(1_500)).toBe('1,5K')
    expect(formatCompact(2_500_000)).toBe('2,5M')
    expect(formatCompact(3_500_000_000)).toBe('3,5B')
    expect(formatCompact(4_500_000_000_000)).toBe('4,5T')
    expect(formatCompactUSD(1_500)).toBe('$1,5K')
    expect(formatCompactUSD(4_500_000_000_000)).toBe('$4,5T')
  })

  it('trims trailing zeros', () => {
    expect(formatCompact(2_000_000)).toBe('2M')
    expect(formatCompact(2_100_000)).toBe('2,1M')
    expect(formatCompact(120_000_000_000)).toBe('120B')
    expect(formatCompact(12)).toBe('12')
    // formatCompactUSD only ever trimmed a single trailing zero, so sub-10
    // values keep both decimals ("$2,00M"). Left as-is on purpose.
    expect(formatCompactUSD(2_000_000)).toBe('$2,00M')
    expect(formatCompactUSD(20_000_000)).toBe('$20M')
    expect(formatCompactUSD(12)).toBe('$12,00')
  })

  it('handles negatives', () => {
    expect(formatCompact(-1_500_000)).toBe('-1,5M')
    expect(formatCompact(-1_500_000, 'en-US')).toBe('-1.5M')
    expect(formatCompact(-12.5)).toBe('-12,5')
    expect(formatCompactUSD(-1_500_000)).toBe('$-1,5M')
    expect(formatPercent(-0.035)).toBe('-3,5%')
  })

  // The locale defaults to es-AR, so a call site that forgets to pass one fails
  // silently: Spanish separators on an English page. Catch it here instead.
  it('is called with an explicit locale everywhere', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => !f.includes('formatNumber') && !f.includes('formatCompactUSD'))
      .map((f) => `src/${f}`)
    const formatters =
      /\b(formatCompactUSD|formatCompact|formatPercent|formatGas|formatGrade|formatResource)\(([^()]*)\)/
    const offenders: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (line.includes('function ')) return // the declarations themselves
          const call = formatters.exec(line)
          if (call && !/\blocale\b/.test(call[2])) offenders.push(`${file}:${i + 1}`)
        })
    }
    expect(offenders).toEqual([])
  })

  // Bare toFixed() always emits a '.', so it is only safe where the output is
  // machine-read (SVG path data, query params) — never for anything a reader
  // sees. Everything else must go through the formatters above.
  it('uses no bare toFixed in user-facing output', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    // Machine-readable numbers: a comma decimal would be a syntax error here.
    const allowed = [
      'uranium/PriceChart.tsx', // SVG path data
      'entities/StockPriceChart.tsx', // SVG path data
      'entities/ProvinceProductionChart.tsx', // SVG path data
      'MapExperience.tsx', // bbox query param, already comma-delimited
      'projects/[name]/page.tsx', // lat/long, rendered as "lat, lng"
      'blocks/Chart/Component.client.tsx', // Payload CMS block, own en-US formatter
    ]
    const offenders: string[] = []
    for (const f of readdirSync('src', { recursive: true, encoding: 'utf8' })) {
      if (!/\.tsx$/.test(f) || allowed.some((a) => f.includes(a))) continue
      readFileSync(`src/${f}`, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (line.includes('.toFixed(')) offenders.push(`src/${f}:${i + 1}`)
        })
    }
    expect(offenders).toEqual([])
  })
})
