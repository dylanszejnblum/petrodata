'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { formatCompact, formatPercent } from '@/utilities/formatNumber'
import { animateCounter, useInView } from '@/components/Petrodata/uranium/anim'
import type { StatItem } from './types'

function compactGridClass(count: number): string {
  if (count >= 5) return 'grid-cols-2 sm:grid-cols-6 lg:grid-cols-5'
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4'
  if (count === 3) return 'grid-cols-2 sm:grid-cols-3'
  if (count === 2) return 'grid-cols-2'
  return 'grid-cols-1'
}

function compactItemClass(count: number, index: number): string {
  if (count >= 5) {
    if (index === count - 1) return 'col-span-2 sm:col-span-3 lg:col-span-1'
    if (index === count - 2) return 'col-span-1 sm:col-span-3 lg:col-span-1'
    return 'col-span-1 sm:col-span-2 lg:col-span-1'
  }
  if (count === 3 && index === 2) return 'col-span-2 sm:col-span-1'
  return 'col-span-1'
}

/** Row of scroll-triggered animated KPI counters. */
export function StatCounters({
  items,
  density = 'default',
}: {
  items: StatItem[]
  density?: 'default' | 'compact'
}) {
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR')
  const { ref, inView } = useInView<HTMLDListElement>()
  const valueRefs = useRef<(HTMLElement | null)[]>([])
  const compact = density === 'compact'

  useEffect(() => {
    if (!inView) return
    const anims = items.map((it, i) => {
      const el = valueRefs.current[i]
      if (!el) return undefined
      const fmt =
        it.format === 'compact'
          ? (v: number) => formatCompact(v, locale)
          : it.format === 'percent'
            ? (v: number) => formatPercent(v, locale)
            : (v: number) => nf.format(Math.round(v))
      return animateCounter(el, it.value, {
        duration: density === 'compact' ? 1200 : 2000,
        delay: i * (density === 'compact' ? 90 : 180),
        format: fmt,
      })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const fmtStatic = (it: StatItem) =>
    it.format === 'compact'
      ? formatCompact(it.value, locale)
      : it.format === 'percent'
        ? formatPercent(it.value, locale)
        : nf.format(Math.round(it.value))

  return (
    <dl
      ref={ref}
      className={
        compact
          ? `grid min-w-0 max-w-full gap-px bg-nd-border ${compactGridClass(items.length)}`
          : 'grid min-w-0 max-w-full gap-px bg-nd-border'
      }
      style={
        compact
          ? undefined
          : { gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }
      }
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`flex min-w-0 flex-col bg-nd-surface ${
            compact ? 'min-h-24 justify-between gap-3 p-4 md:p-5' : 'gap-2 p-5'
          } ${compact ? compactItemClass(items.length, i) : ''}`}
        >
          <dt className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {it.label}
          </dt>
          <dd
            ref={(el) => {
              valueRefs.current[i] = el
            }}
            className={`${compact ? 'text-2xl xl:text-3xl' : 'text-3xl md:text-4xl'} leading-none tabular-nums text-nd-text-display font-display`}
          >
            {fmtStatic(it)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
