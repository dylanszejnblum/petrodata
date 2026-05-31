export type CommodityName =
  | 'Silver'
  | 'Gold'
  | 'Copper'
  | 'Lithium'
  | 'Uranium'
  | 'Lead'
  | 'Zinc'
  | (string & {}) // allow extension

// Saturated palette so colors read clearly on the Carto positron basemap (very
// light grey/white) AND as small dots in the UI overlays. Tailwind -500/-600.
const PALETTE: Record<string, { color: string; ink: string }> = {
  silver: { color: '#64748b', ink: 'var(--nd-black)' }, // slate-500
  gold: { color: '#eab308', ink: 'var(--nd-black)' }, // yellow-500
  copper: { color: '#f97316', ink: 'var(--nd-black)' }, // orange-500
  lithium: { color: '#8b5cf6', ink: 'var(--nd-black)' }, // violet-500
  uranium: { color: '#10b981', ink: 'var(--nd-black)' }, // emerald-500
  lead: { color: '#52525b', ink: 'var(--nd-black)' }, // zinc-600
  zinc: { color: '#0284c7', ink: 'var(--nd-black)' }, // sky-600
  // Spanish aliases (SIACAM / minerals API return Spanish commodity names).
  plata: { color: '#64748b', ink: 'var(--nd-black)' },
  oro: { color: '#eab308', ink: 'var(--nd-black)' },
  cobre: { color: '#f97316', ink: 'var(--nd-black)' },
  litio: { color: '#8b5cf6', ink: 'var(--nd-black)' },
  uranio: { color: '#10b981', ink: 'var(--nd-black)' },
  plomo: { color: '#52525b', ink: 'var(--nd-black)' },
}

const FALLBACK = { color: '#71717a', ink: 'var(--nd-black)' } // zinc-500

export function commodityColor(name: string | null | undefined): { color: string; ink: string } {
  if (!name) return FALLBACK
  return PALETTE[name.toLowerCase()] ?? FALLBACK
}

export function commoditySlug(name: string | null | undefined): string {
  return (name ?? 'unknown').toLowerCase()
}

export function commodityLabel(slug: string): string {
  // Title-case a slug like "uranium" → "Uranium"
  if (!slug) return 'Unknown'
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase()
}
