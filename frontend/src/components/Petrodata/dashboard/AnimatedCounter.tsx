'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { formatCompact, formatDecimal } from '@/utilities/formatNumber'

type Format = 'compact' | 'integer' | 'percent'

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)

function format(value: number, kind: Format, locale: string): string {
  if (kind === 'percent') return `${formatDecimal(value, locale, 1)}%`
  if (kind === 'integer') return Math.round(value).toLocaleString(locale)
  return formatCompact(value, locale)
}

export function AnimatedCounter({
  to,
  duration = 1400,
  kind = 'integer',
  className,
  style,
}: {
  to: number
  duration?: number
  kind?: Format
  className?: string
  style?: React.CSSProperties
}) {
  const locale = useLocale()
  const ref = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)

  // Trigger when the element scrolls into view (once).
  useEffect(() => {
    if (!ref.current || started) return
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true)
      return
    }
    const el = ref.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [started])

  // Drive the count-up with RAF + ease-out.
  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const from = 0
    const delta = to - from

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = easeOutQuart(t)
      setValue(from + delta * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setValue(to)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [started, to, duration])

  return (
    <span ref={ref} className={className} style={style}>
      {format(value, kind, locale)}
    </span>
  )
}
