'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion, useInView } from '@/lib/motion'

/* ProportionBarList — colapsa ContributionTable/OperatorLeaderboard/
   TopOperators(×2) de producción: ranking con barra de proporción animada. */

export function ProportionBarList({
  items,
  max,
  formatValue,
}: {
  items: { key: string; label: React.ReactNode; value: number; display: string; color?: string }[]
  max?: number
  formatValue?: (v: number) => string
}) {
  const { ref, inView } = useInView<HTMLOListElement>()
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const top = max ?? Math.max(...items.map((i) => i.value), 1)

  useEffect(() => {
    if (!inView) return
    const reduced = prefersReducedMotion()
    bars.current.forEach((el, i) => {
      if (!el) return
      const pct = el.dataset.pct ?? '0'
      if (reduced) {
        el.style.width = `${pct}%`
        return
      }
      el.style.width = '0%'
      el.style.transition = `width var(--duration-slow) var(--ease-out) ${i * 70}ms`
      requestAnimationFrame(() => {
        el.style.width = `${pct}%`
      })
    })
  }, [inView])

  return (
    <ol ref={ref} className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item, i) => (
        <li key={item.key} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3">
          <span className={`type-label tnums ${i === 0 ? '!text-primary' : ''}`}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[13px] font-medium text-body">{item.label}</span>
            </div>
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-line">
              <span
                ref={(el) => {
                  bars.current[i] = el
                }}
                data-pct={Math.round((item.value / top) * 100)}
                className="block h-full rounded-full"
                style={{ width: 0, background: item.color ?? 'var(--text-primary)' }}
              />
            </div>
          </div>
          <span className="type-label tnums !text-secondary">
            {formatValue ? formatValue(item.value) : item.display}
          </span>
        </li>
      ))}
    </ol>
  )
}
