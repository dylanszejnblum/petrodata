'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDecimal, formatMonth } from '@/utilities/formatNumber'
import { URANIUM } from './theme'
import { drawPath, fadeIn, useInView } from './anim'
import type { PricePoint, PriceExtreme } from './types'
import { useLocale } from 'next-intl'

const HEIGHT = 360
const PAD = { top: 24, right: 16, bottom: 28, left: 52 }

type Scaled = { x: number; y: number; point: PricePoint; t: number }

export function PriceChart({
  points,
  low,
  high,
  unit,
}: {
  points: PricePoint[]
  low: PriceExtreme | null
  high: PriceExtreme | null
  unit: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const locale = useLocale()
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>()
  const lineRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const [hover, setHover] = useState<Scaled | null>(null)

  // Measure pixel width via ResizeObserver for crisp, real-pixel rendering.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const model = useMemo(() => {
    if (points.length === 0 || width === 0) return null

    const times = points.map((p) => new Date(p.date).getTime())
    const prices = points.map((p) => p.price)
    const tMin = times[0]
    const tMax = times[times.length - 1]
    const pMin = Math.min(...prices)
    const pMax = Math.max(...prices)
    const tSpan = tMax - tMin || 1
    const pSpan = pMax - pMin || 1

    const plotW = width - PAD.left - PAD.right
    const plotH = HEIGHT - PAD.top - PAD.bottom

    const sx = (t: number) => PAD.left + ((t - tMin) / tSpan) * plotW
    const sy = (p: number) => PAD.top + (1 - (p - pMin) / pSpan) * plotH

    const scaled: Scaled[] = points.map((point, i) => ({
      point,
      t: times[i],
      x: sx(times[i]),
      y: sy(point.price),
    }))

    const linePath = scaled.map((s, i) => `${i === 0 ? 'M' : 'L'}${s.x.toFixed(2)} ${s.y.toFixed(2)}`).join(' ')
    const baseline = HEIGHT - PAD.bottom
    const fillPath = `${linePath} L${scaled[scaled.length - 1].x.toFixed(2)} ${baseline} L${scaled[0].x.toFixed(2)} ${baseline} Z`

    // ~4 horizontal gridlines (price).
    const gridCount = 4
    const yGrid = Array.from({ length: gridCount }, (_, i) => {
      const p = pMin + (pSpan * i) / (gridCount - 1)
      return { price: p, y: sy(p) }
    })

    // ~5 x-axis year ticks.
    const yearFrom = new Date(tMin).getUTCFullYear()
    const yearTo = new Date(tMax).getUTCFullYear()
    const tickCount = 5
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const year = Math.round(yearFrom + ((yearTo - yearFrom) * i) / (tickCount - 1))
      const t = Date.UTC(year, 0, 1)
      const clamped = Math.min(Math.max(t, tMin), tMax)
      return { year, x: sx(clamped) }
    })

    const nearestByDate = (extreme: PriceExtreme | null): Scaled | null => {
      if (!extreme) return null
      const target = new Date(extreme.date).getTime()
      let best = scaled[0]
      let bestDiff = Infinity
      for (const s of scaled) {
        const d = Math.abs(s.t - target)
        if (d < bestDiff) {
          bestDiff = d
          best = s
        }
      }
      return best
    }

    return {
      scaled,
      linePath,
      fillPath,
      yGrid,
      xTicks,
      lowDot: nearestByDate(low),
      highDot: nearestByDate(high),
    }
  }, [points, width, low, high])

  // Draw the line on first scroll-in-view; fade in the area fill afterwards.
  useEffect(() => {
    if (!inView || !model) return
    const lineEl = lineRef.current
    const fillEl = fillRef.current
    if (lineEl) drawPath(lineEl, { duration: 4000, delay: 300 })
    if (fillEl) fadeIn(fillEl, { delay: 3500 })
  }, [inView, model])

  // Combine container ref (for measuring) and in-view ref.
  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node
    inViewRef.current = node
  }

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!model) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = model.scaled[0]
    let bestDiff = Infinity
    for (const s of model.scaled) {
      const d = Math.abs(s.x - x)
      if (d < bestDiff) {
        bestDiff = d
        best = s
      }
    }
    setHover(best)
  }

  return (
    <div ref={setRefs} className="relative h-[300px] md:h-[380px] w-full" onPointerLeave={() => setHover(null)}>
      {model && (
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block h-full w-full"
          onPointerMove={handlePointer}
          role="img"
          aria-label={`Uranium price ${unit}`}
        >
          {/* Horizontal gridlines + price labels */}
          {model.yGrid.map((g, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={g.y}
                y2={g.y}
                stroke="var(--nd-border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={g.y + 3}
                textAnchor="end"
                className="font-mono tabular-nums"
                fontSize={10}
                fill="var(--nd-text-disabled)"
              >
                {`$${Math.round(g.price)}`}
              </text>
            </g>
          ))}

          {/* X-axis year ticks */}
          {model.xTicks.map((tk, i) => (
            <text
              key={`xt-${i}`}
              x={tk.x}
              y={HEIGHT - PAD.bottom + 18}
              textAnchor="middle"
              className="font-mono tabular-nums"
              fontSize={10}
              fill="var(--nd-text-disabled)"
            >
              {tk.year}
            </text>
          ))}

          {/* Area fill */}
          <path ref={fillRef} d={model.fillPath} fill={URANIUM.teal} opacity={0.12} style={{ opacity: 0 }} />

          {/* Price line */}
          <path ref={lineRef} d={model.linePath} fill="none" stroke={URANIUM.teal} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* All-time low marker */}
          {model.lowDot && (
            <g>
              <circle cx={model.lowDot.x} cy={model.lowDot.y} r={4} fill={URANIUM.teal} />
              <text
                x={model.lowDot.x}
                y={model.lowDot.y + 18}
                textAnchor="middle"
                className="font-mono tabular-nums"
                fontSize={10}
                fill={URANIUM.teal}
              >
                {`$${formatDecimal(model.lowDot.point.price, locale, 0)}`}
              </text>
            </g>
          )}

          {/* All-time high marker */}
          {model.highDot && (
            <g>
              <circle cx={model.highDot.x} cy={model.highDot.y} r={4} fill={URANIUM.amber} />
              <text
                x={model.highDot.x}
                y={model.highDot.y - 10}
                textAnchor="middle"
                className="font-mono tabular-nums"
                fontSize={10}
                fill={URANIUM.amber}
              >
                {`$${formatDecimal(model.highDot.point.price, locale, 0)}`}
              </text>
            </g>
          )}

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="var(--nd-border-visible)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={hover.x} cy={hover.y} r={3.5} fill={URANIUM.teal} stroke="var(--nd-surface)" strokeWidth={1.5} />
            </g>
          )}
        </svg>
      )}

      {/* Hover tooltip box */}
      {hover && model && (
        <div
          className="pointer-events-none absolute z-10 border border-nd-border bg-nd-surface px-2.5 py-1.5 font-mono tabular-nums"
          style={{
            left: Math.min(Math.max(hover.x, PAD.left), width - 120),
            top: PAD.top,
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {formatMonth(hover.point.date)}
          </div>
          <div className="text-sm text-nd-text-display" style={{ color: URANIUM.teal }}>
            {`$${formatDecimal(hover.point.price, locale)}`}
          </div>
        </div>
      )}
    </div>
  )
}
