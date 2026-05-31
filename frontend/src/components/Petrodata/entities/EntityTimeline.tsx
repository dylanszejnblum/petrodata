'use client'

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, staggerIn, useInView, utils } from '@/components/Petrodata/uranium/anim'
import { formatMonth } from '@/utilities/formatNumber'
import type { TimelineStage } from './types'

export function EntityTimeline({ stages }: { stages: TimelineStage[] }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!inView) return
    const lineEl = lineRef.current
    const nodes = ref.current?.querySelectorAll('.tl-node')

    if (prefersReducedMotion()) {
      if (lineEl) utils.set(lineEl, { scaleX: 1 })
      if (nodes) utils.set(Array.from(nodes), { opacity: 1, translateY: 0 })
      return
    }

    if (lineEl) {
      animate(lineEl, { scaleX: [0, 1], duration: 1100, ease: 'outExpo' })
    }
    if (nodes && nodes.length) {
      staggerIn(Array.from(nodes), { startDelay: 380, step: 90 })
    }
  }, [inView, ref])

  if (stages.length === 0) return null

  const lastIndex = stages.length - 1

  return (
    <div ref={ref} className="relative w-full">
      {/* Desktop baseline — drawn behind the nodes (md+ only) */}
      <div className="pointer-events-none absolute inset-x-0 top-[5px] hidden md:block" aria-hidden>
        <div
          ref={lineRef}
          className="h-px w-full bg-nd-border-visible"
          style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
        />
      </div>

      {/* Mobile left rail */}
      <div
        className="pointer-events-none absolute bottom-2 left-[5px] top-2 w-px bg-nd-border-visible md:hidden"
        aria-hidden
      />

      {/* md+: evenly spaced row · mobile: vertical stack */}
      <ol className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-4">
        {stages.map((s, i) => {
          const isLast = i === lastIndex
          const markerStyle = isLast ? { backgroundColor: 'var(--nd-accent)' } : undefined
          return (
            <li
              key={`${i}-${s.stage}`}
              className="tl-node relative flex flex-1 items-start gap-4 md:flex-col md:items-center md:gap-3 md:text-center"
              style={{ opacity: 0 }}
            >
              <div
                className={`mt-0.5 size-2.5 shrink-0 md:mt-0 ${isLast ? '' : 'bg-nd-text-disabled'}`}
                style={markerStyle}
                aria-hidden
              />
              <div className="flex flex-col gap-1 md:items-center">
                <span
                  className={`font-mono text-[11px] uppercase leading-snug tracking-[0.08em] ${
                    isLast ? 'text-nd-accent' : 'text-nd-text-secondary'
                  }`}
                >
                  {s.stage}
                </span>
                {s.date && (
                  <span className="font-display text-sm leading-none text-nd-text-display tabular-nums">
                    {formatMonth(s.date)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
