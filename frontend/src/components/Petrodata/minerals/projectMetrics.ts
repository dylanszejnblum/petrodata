// Helpers for surfacing per-project headline metrics out of the ProjectListItemDto's
// `commodity_highlights` map. The map's shape varies per project, e.g.
// { Silver: { measured_kOz: 76684, grade_g_t: 80 }, Gold: { ... } }
// We pick the primary commodity's most informative grade + tonnage when present.

import { formatCompact } from '@/utilities/formatNumber'

type Highlights = Record<string, unknown>

const COMMODITY_TOKEN: Record<string, string[]> = {
  uranium: ['u3o8', 'rar', 'u'],
  copper: ['cu'],
  gold: ['au'],
  silver: ['ag'],
  lithium: ['lce', 'li2co3', 'li'],
  lead: ['pb'],
  zinc: ['zn'],
}

const CATEGORY_PRIORITY = ['measured', 'indicated', 'proven', 'probable', 'inferred', 'rar']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pickCommodityBlock(
  highlights: Highlights | null | undefined,
  commodity: string,
): Record<string, unknown> | null {
  if (!highlights) return null
  // Direct title-case match
  const direct = highlights[commodity]
  if (isRecord(direct)) return direct
  // Lowercase fallback
  const lower = highlights[commodity.toLowerCase()]
  if (isRecord(lower)) return lower
  // Otherwise scan all values: pick the first object whose key matches the commodity loosely
  for (const [k, v] of Object.entries(highlights)) {
    if (isRecord(v) && k.toLowerCase().includes(commodity.toLowerCase())) return v
  }
  return null
}

function prettyUnit(raw: string): string {
  if (!raw) return ''
  // "kOz" → "kOz", "g_t" → "g/t", "MLbs" → "MLbs", "kt" → "kt", "Tn" → "Tn", "pct" → "%"
  if (raw.toLowerCase() === 'pct') return '%'
  return raw.replace(/_/g, '/')
}

/** Returns `{value, unit}` for the most informative grade entry. */
export function pickGrade(
  highlights: Highlights | null | undefined,
  commodity: string,
): { value: number; unit: string; key: string } | null {
  const block = pickCommodityBlock(highlights, commodity)
  if (!block) return null
  const tokens = (COMMODITY_TOKEN[commodity.toLowerCase()] ?? [commodity.toLowerCase()])
  // Grade keys typically include "_g_t", "_pct", "_grade_g_t", "_ppm", "%"
  const gradeMatches = Object.entries(block).filter(([k, v]) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return false
    const lk = k.toLowerCase()
    const isGradeLike =
      lk.includes('_g_t') ||
      lk.includes('grade') ||
      lk.startsWith('pct_') ||
      lk.endsWith('_pct') ||
      lk.includes('ppm') ||
      lk.includes('mg_l')
    return isGradeLike
  })
  if (gradeMatches.length === 0) return null
  // Prefer the entry whose key contains a commodity token
  const biased =
    gradeMatches.find(([k]) =>
      tokens.some((t) => k.toLowerCase().includes(t.toLowerCase())),
    ) ?? gradeMatches[0]
  const [key, raw] = biased
  return { value: raw as number, unit: deriveUnit(key), key }
}

function deriveUnit(key: string): string {
  const lk = key.toLowerCase()
  if (lk.includes('g_t')) return 'g/t'
  if (lk.includes('ppm')) return 'ppm'
  if (lk.includes('mg_l')) return 'mg/L'
  if (lk.startsWith('pct_') || lk.endsWith('_pct')) return '%'
  // fall back to last token after first underscore
  const parts = key.split('_')
  return prettyUnit(parts.slice(1).join('_'))
}

/** Returns `{value, unit, category}` for the most informative resource tonnage. */
export function pickResource(
  highlights: Highlights | null | undefined,
  commodity: string,
): { value: number; unit: string; category: string } | null {
  const block = pickCommodityBlock(highlights, commodity)
  if (!block) return null
  const tokens = COMMODITY_TOKEN[commodity.toLowerCase()] ?? [commodity.toLowerCase()]

  const candidates: { key: string; value: number; categoryIdx: number }[] = []
  for (const [k, v] of Object.entries(block)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue
    const lk = k.toLowerCase()
    // Skip grade-like keys
    if (
      lk.includes('_g_t') ||
      lk.includes('grade') ||
      lk.startsWith('pct_') ||
      lk.endsWith('_pct') ||
      lk.includes('ppm') ||
      lk.includes('mg_l')
    ) {
      continue
    }
    // Find which category this key belongs to
    const categoryIdx = CATEGORY_PRIORITY.findIndex((cat) => lk.startsWith(cat))
    if (categoryIdx === -1) continue
    candidates.push({ key: k, value: v, categoryIdx })
  }
  if (candidates.length === 0) return null

  // Bias to commodity token, then category priority, then value desc
  candidates.sort((a, b) => {
    const aMatches = tokens.some((t) => a.key.toLowerCase().includes(t)) ? 0 : 1
    const bMatches = tokens.some((t) => b.key.toLowerCase().includes(t)) ? 0 : 1
    if (aMatches !== bMatches) return aMatches - bMatches
    if (a.categoryIdx !== b.categoryIdx) return a.categoryIdx - b.categoryIdx
    return b.value - a.value
  })

  const top = candidates[0]
  return {
    value: top.value,
    unit: extractUnitFromKey(top.key),
    category: CATEGORY_PRIORITY[top.categoryIdx],
  }
}

function extractUnitFromKey(key: string): string {
  // Strip the category prefix to get the unit segment, e.g.
  // "measured_kOz" → "kOz", "indicated_U3O8_MLbs" → "U3O8 MLbs"
  const idx = key.indexOf('_')
  if (idx < 0) return key
  const tail = key.slice(idx + 1)
  return tail.replace(/_/g, ' ')
}

export function formatGrade(g: { value: number; unit: string } | null): string {
  if (!g) return '—'
  const v = g.unit === '%' ? g.value.toFixed(2) : g.value.toFixed(1)
  return `${v} ${g.unit}`.trim()
}

export function formatResource(r: { value: number; unit: string } | null): string {
  if (!r) return '—'
  return `${formatCompact(r.value)} ${r.unit}`.trim()
}
