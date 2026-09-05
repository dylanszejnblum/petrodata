'use client'

import { formatDeltaPct } from './format'

/* Chip YoY de las anclas de charts (02/03/04): el signo manda —
   positivo/negativo con tokens de estado y fondo del mismo tono al 12%. */
export function YoyChip({ pct }: { pct: number }) {
  const tone = pct >= 0 ? 'var(--status-positive)' : 'var(--status-negative)'
  return (
    <span
      className="tnums rounded-full px-2 py-0.5 text-[11px]"
      style={{ color: tone, background: `color-mix(in srgb, ${tone} 12%, transparent)` }}
    >
      {formatDeltaPct(pct)} YoY
    </span>
  )
}
