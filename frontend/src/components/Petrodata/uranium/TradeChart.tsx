'use client'

import { useEffect, useMemo, useRef } from 'react'
import { formatCompact } from '@/utilities/formatNumber'
import { URANIUM } from './theme'
import { animate, prefersReducedMotion, stagger, useInView, utils } from './anim'
import type { TradeRow } from './types'
import { useLocale } from 'next-intl'

const PLOT_H = 280

export function TradeChart({
  rows,
  importsLabel,
  exportsLabel,
}: {
  rows: TradeRow[]
  importsLabel: string
  exportsLabel: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const locale = useLocale()
  const plotRef = useRef<HTMLDivElement>(null)

  const { years, max } = useMemo(() => {
    const byYear = new Map<number, { year: number; import: number; export: number }>()
    for (const r of rows) {
      let entry = byYear.get(r.year)
      if (!entry) {
        entry = { year: r.year, import: 0, export: 0 }
        byYear.set(r.year, entry)
      }
      entry[r.type] += r.value
    }
    const years = Array.from(byYear.values()).sort((a, b) => a.year - b.year)
    const max = years.reduce((m, y) => Math.max(m, y.import, y.export), 0) || 1
    return { years, max }
  }, [rows])

  // ~3 compact USD axis labels (top → bottom).
  const yAxis = useMemo(
    () => [1, 0.5, 0].map((frac) => ({ frac, value: max * frac })),
    [max],
  )

  useEffect(() => {
    if (!inView) return
    const bars = plotRef.current?.querySelectorAll('.trade-bar')
    if (!bars || !bars.length) return
    const arr = Array.from(bars)
    if (prefersReducedMotion()) {
      utils.set(arr, { scaleY: 1 })
      return
    }
    utils.set(arr, { scaleY: 0 })
    animate(arr, {
      scaleY: [0, 1],
      duration: 800,
      ease: 'outExpo',
      delay: stagger(40),
    })
  }, [inView, years])

  return (
    <div ref={ref} className="w-full">
      {/* Legend */}
      <div className="mb-5 flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5" style={{ backgroundColor: URANIUM.teal }} aria-hidden />
          {importsLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5" style={{ backgroundColor: URANIUM.amber }} aria-hidden />
          {exportsLabel}
        </span>
      </div>

      <div className="flex w-full gap-3">
        {/* Y axis labels */}
        <div
          className="relative shrink-0 font-mono text-[10px] tabular-nums text-nd-text-disabled"
          style={{ height: PLOT_H, width: 44 }}
          aria-hidden
        >
          {yAxis.map((a, i) => (
            <span
              key={i}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: (1 - a.frac) * PLOT_H }}
            >
              {`$${formatCompact(a.value, locale)}`}
            </span>
          ))}
        </div>

        {/* Plot area — fits the full width (no horizontal scroll). Bars flex to
            share the width; year labels are sampled so they never overlap. */}
        <div className="min-w-0 flex-1">
          <div ref={plotRef} className="flex w-full items-end gap-px" style={{ height: PLOT_H }}>
            {years.map((y) => (
              <div key={y.year} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
                <Bar value={y.import} max={max} color={URANIUM.teal} label={importsLabel} />
                <Bar value={y.export} max={max} color={URANIUM.amber} label={exportsLabel} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex w-full gap-px border-t border-nd-border pt-2">
            {years.map((y, i) => (
              <span
                key={y.year}
                className="min-w-0 flex-1 text-center font-mono text-[10px] tabular-nums text-nd-text-disabled"
              >
                {showYearLabel(i, years.length) ? y.year : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Sample year labels so at most ~8 show evenly (plus the last) — never overlap. */
function showYearLabel(i: number, n: number): boolean {
  if (n <= 8) return true
  const step = Math.ceil(n / 8)
  return i % step === 0 || i === n - 1
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const locale = useLocale()
  const pct = Math.max((value / max) * 100, value > 0 ? 0.5 : 0)
  return (
    <div
      className="trade-bar w-full max-w-[16px] min-w-[2px]"
      style={{
        height: `${pct}%`,
        backgroundColor: color,
        transformOrigin: 'bottom',
        transform: 'scaleY(0)',
      }}
      role="img"
      aria-label={`${label}: ${formatCompact(value, locale)}`}
    />
  )
}
