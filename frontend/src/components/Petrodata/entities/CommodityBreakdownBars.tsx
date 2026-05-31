'use client'

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, stagger, useInView, utils } from '@/components/Petrodata/uranium/anim'
import { formatCompact, formatPercent } from '@/utilities/formatNumber'
import type { BreakdownItem } from './types'

export function CommodityBreakdownBars({ items }: { items: BreakdownItem[] }) {
  const { ref, inView } = useInView<HTMLDivElement>()

  const sorted = [...items].sort((a, b) => b.count - a.count)
  const max = sorted.length ? sorted[0].count : 0
  const total = sorted.reduce((sum, it) => sum + it.count, 0)

  useEffect(() => {
    if (!inView) return
    const fills = ref.current?.querySelectorAll('.cb-fill')
    if (!fills || !fills.length) return

    if (prefersReducedMotion()) {
      utils.set(Array.from(fills), { scaleX: 1 })
      return
    }

    animate(Array.from(fills), {
      scaleX: [0, 1],
      duration: 900,
      ease: 'outExpo',
      delay: stagger(80, { start: 120 }),
    })
  }, [inView, ref])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="flex flex-col gap-4">
      {sorted.map((item, i) => {
        const widthPct = max > 0 ? (item.count / max) * 100 : 0
        const sharePct = total > 0 ? item.count / total : 0
        return (
          <div key={`${i}-${item.name}`} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 font-mono text-sm text-nd-text-secondary">
                <span
                  className="inline-block size-2 shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                {item.name}
              </span>
              <span className="font-mono text-sm text-nd-text-display tabular-nums">
                {formatCompact(item.count)}
              </span>
            </div>
            <div className="relative h-2 w-full bg-nd-surface-raised">
              <div
                className="cb-fill absolute inset-y-0 left-0"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: item.color,
                  transformOrigin: 'left',
                  transform: 'scaleX(0)',
                }}
                aria-hidden
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled tabular-nums">
              {formatPercent(sharePct)} of total
            </span>
          </div>
        )
      })}
    </div>
  )
}
