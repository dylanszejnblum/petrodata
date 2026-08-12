'use client'

// Donut chart of uranium projects by lifecycle stage. Segments grow radially
// (arc length 0 → full) on scroll into view, staggered. Reduced-motion shows
// the full donut immediately. Monochrome "Nothing" styling: sharp corners,
// mono labels, Doto display numbers, per-slice accent colours.

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { prefersReducedMotion, useInView } from './anim'
import type { StatusSlice } from './types'
import { formatDecimal } from '@/utilities/formatNumber'

const VIEW = 220
const CENTER = VIEW / 2
const RADIUS = 82
const STROKE = 26
const CIRC = 2 * Math.PI * RADIUS

const STAGGER_MS = 120
const GROW_MS = 700

export function StatusDonut({ data }: { data: StatusSlice[] }) {
  const t = useTranslations('uraniumHub.donut')
  const locale = useLocale()
  const { ref, inView } = useInView<HTMLDivElement>()
  // progress is a single 0→1 value driving every segment; per-segment stagger
  // is applied by clamping each segment's portion of the timeline.
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const total = data.reduce((sum, s) => sum + s.count, 0)

  // Cumulative offsets so segments sit sequentially around the ring.
  let cumulative = 0
  const segments = data.map((slice) => {
    const fraction = total > 0 ? slice.count / total : 0
    const arc = fraction * CIRC
    const offset = cumulative
    cumulative += arc
    return { ...slice, fraction, arc, offset }
  })

  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion()) {
      setProgress(1)
      return
    }
    const segCount = Math.max(segments.length, 1)
    const totalMs = GROW_MS + STAGGER_MS * (segCount - 1)
    let start: number | null = null

    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min((now - start) / totalMs, 1)
      setProgress(t)
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick)
      }
    }
    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, segments.length])

  const segCount = Math.max(segments.length, 1)
  const totalMs = GROW_MS + STAGGER_MS * (segCount - 1)
  const elapsed = progress * totalMs

  return (
    <div ref={ref} className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
      <div className="relative shrink-0 self-center">
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-44 w-44 md:h-52 md:w-52" role="img">
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {segments.map((seg, i) => {
              // Each segment grows over its own GROW_MS window, offset by stagger.
              const segStart = i * STAGGER_MS
              const local = Math.min(Math.max((elapsed - segStart) / GROW_MS, 0), 1)
              const eased = 1 - Math.pow(1 - local, 3) // easeOutCubic
              const drawn = seg.arc * eased
              return (
                <circle
                  key={seg.label}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  strokeDasharray={`${drawn} ${CIRC - drawn}`}
                  strokeDashoffset={-seg.offset}
                />
              )
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-nd-text-display tabular-nums">{total}</span>
          <span className="mt-1 max-w-[7rem] text-center text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {t('title')}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {segments.map((seg) => {
          const pct = seg.fraction * 100
          return (
            <li key={seg.label} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
                aria-hidden="true"
              />
              <span className="flex-1 font-mono text-[11px] text-nd-text-secondary">{seg.label}</span>
              <span className="font-mono text-[11px] text-nd-text-primary tabular-nums">{seg.count}</span>
              <span className="w-10 text-right font-mono text-[11px] text-nd-text-disabled tabular-nums">
                {formatDecimal(pct, locale, 0)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
