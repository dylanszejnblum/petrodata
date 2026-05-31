// Pure module (NO 'use client'): safe to import from server components.

export type OperatorSeriesMeta = {
  slug: string
  name: string
  color: string
}

/** One row per month, with one numeric field per operator slug. */
export type ChartRow = { date_month: string } & Record<string, number>

const OPERATOR_PALETTE: Record<string, string> = {
  ypf: '#3b82f6',
  totalenergies: '#ef4444',
  'total-austral': '#ef4444',
  tecpetrol: '#10b981',
  pae: '#f59e0b',
  'pan-american-energy': '#f59e0b',
  'pan-american': '#f59e0b',
  pluspetrol: '#8b5cf6',
  vista: '#06b6d4',
  chevron: '#ec4899',
  shell: '#fbbf24',
  petrobras: '#84cc16',
  equinor: '#a855f7',
}

const FALLBACK_COLORS = ['#64748b', '#f97316', '#22d3ee', '#facc15', '#a78bfa']

export function operatorColor(slug: string, fallbackIndex = 0): string {
  return (
    OPERATOR_PALETTE[slug.toLowerCase()] ??
    FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
  )
}
