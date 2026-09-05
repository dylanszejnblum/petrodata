'use client'

import { useEffect, useState } from 'react'
import { prefersReducedMotion, useInView } from '@/lib/motion'

/* Donut SVG (promovido del StatusDonut de producción: N segmentos,
   reduced-motion, sin dependencia de Recharts). */

export function Donut({
  segments,
  center,
  centerLabel,
  size = 180,
  title,
}: {
  segments: { value: number; color: string; label: string }[]
  center?: React.ReactNode
  centerLabel?: string
  size?: number
  title: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion()) {
      setProgress(1)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      setProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const r = 82
  const C = 2 * Math.PI * r
  let offset = 0

  return (
    <div ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg role="img" aria-label={title} viewBox="0 0 220 220" width={size} height={size}>
        <circle cx="110" cy="110" r={r} fill="none" stroke="var(--border-default)" strokeWidth="24" />
        {segments.map((s, i) => {
          const frac = (s.value / total) * progress
          const dash = `${frac * C} ${C}`
          const el = (
            <circle
              key={i}
              cx="110"
              cy="110"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="24"
              strokeDasharray={dash}
              strokeDashoffset={-offset * C}
              transform="rotate(-90 110 110)"
            />
          )
          offset += (s.value / total) * progress
          return el
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="type-kpi text-[1.8rem]">{center}</div>
          {centerLabel && <div className="type-label mt-1">{centerLabel}</div>}
        </div>
      </div>
    </div>
  )
}
