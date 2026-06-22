// Single source of truth for SEN well-status classification, shared by the map
// markers (dot colour) and the well popup (status badge) so they never drift.

export type WellStatusKind = 'active' | 'injector' | 'stopped' | 'study' | 'abandoned' | 'unknown'

export function classifyWellStatus(status: string | null | undefined): WellStatusKind {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s.includes('producción efectiva') || s.includes('produccion efectiva')) return 'active'
  if (s.includes('inyector')) return 'injector'
  if (s.includes('parado') || s.includes('transitorio')) return 'stopped'
  if (s.includes('estudio')) return 'study'
  if (/abandon/i.test(s)) return 'abandoned'
  return 'unknown'
}
