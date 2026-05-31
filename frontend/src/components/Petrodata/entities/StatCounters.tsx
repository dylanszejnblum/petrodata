'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { formatCompact } from '@/utilities/formatNumber'
import { animateCounter, useInView } from '@/components/Petrodata/uranium/anim'
import type { StatItem } from './types'

/** Row of scroll-triggered animated KPI counters. */
export function StatCounters({ items }: { items: StatItem[] }) {
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR')
  const { ref, inView } = useInView<HTMLDivElement>()
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!inView) return
    const anims = items.map((it, i) => {
      const el = valueRefs.current[i]
      if (!el) return undefined
      const fmt = it.format === 'compact' ? (v: number) => formatCompact(v) : (v: number) => nf.format(Math.round(v))
      return animateCounter(el, it.value, { duration: 2000, delay: i * 180, format: fmt })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const fmtStatic = (it: StatItem) =>
    it.format === 'compact' ? formatCompact(it.value) : nf.format(Math.round(it.value))

  return (
    <div
      ref={ref}
      className="grid gap-px bg-nd-border"
      style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <div key={it.label} className="flex flex-col gap-2 bg-nd-surface p-5">
          <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {it.label}
          </span>
          <span
            ref={(el) => {
              valueRefs.current[i] = el
            }}
            className="text-3xl md:text-4xl leading-none tabular-nums text-nd-text-display font-display"
          >
            {fmtStatic(it)}
          </span>
        </div>
      ))}
    </div>
  )
}
