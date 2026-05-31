'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiSchemas } from '@/api/client'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { formatCompact } from '@/utilities/formatNumber'
import { animate, prefersReducedMotion, stagger, utils } from '@/components/Petrodata/uranium/anim'

type TradeFlowDto = ApiSchemas['TradeFlowDto']
type Edge = ApiSchemas['TradeFlowEdgeDto']

type RibbonNode = {
  key: string
  country: string
  value: number
  /** vertical band on the side column */
  y: number
  h: number
  /** label/value anchor */
  labelY: number
}

const HEIGHT = 460
const NODE_W = 12
const GAP = 6
const MIN_BAND = 2
const PAD_Y = 28

function useContainerWidth() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, width }
}

/** Lay out a side column's nodes top-to-bottom, height ∝ value. */
function layoutSide(edges: Edge[], topN: number): RibbonNode[] {
  const sorted = [...edges].sort((a, b) => b.value_usd - a.value_usd).slice(0, topN)
  const total = sorted.reduce((s, e) => s + Math.max(0, e.value_usd), 0)
  if (sorted.length === 0 || total <= 0) return []
  const usable = HEIGHT - PAD_Y * 2 - GAP * (sorted.length - 1)
  let y = PAD_Y
  return sorted.map((e) => {
    const frac = Math.max(0, e.value_usd) / total
    const h = Math.max(MIN_BAND, frac * usable)
    const node: RibbonNode = {
      key: e.country,
      country: e.country,
      value: e.value_usd,
      y,
      h,
      labelY: y + h / 2,
    }
    y += h + GAP
    return node
  })
}

/** Cubic Bézier ribbon between two horizontal segments. */
function ribbonPath(
  x0: number,
  y0: number,
  h0: number,
  x1: number,
  y1: number,
  h1: number,
): string {
  const xm = (x0 + x1) / 2
  const t0 = y0
  const b0 = y0 + h0
  const t1 = y1
  const b1 = y1 + h1
  return [
    `M ${x0} ${t0}`,
    `C ${xm} ${t0} ${xm} ${t1} ${x1} ${t1}`,
    `L ${x1} ${b1}`,
    `C ${xm} ${b1} ${xm} ${b0} ${x0} ${b0}`,
    'Z',
  ].join(' ')
}

export function TradeSankey({ flow, topN }: { flow: TradeFlowDto; topN: number }) {
  const t = useTranslations('trade')
  const { ref, width } = useContainerWidth()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hover, setHover] = useState<{ label: string; value: number; x: number; y: number } | null>(
    null,
  )

  const accent = commodityColor(flow.mineral).color

  const imports = layoutSide(flow.imports ?? [], topN)
  const exportsN = layoutSide(flow.exports ?? [], topN)

  const hasData = (flow.imports?.length ?? 0) > 0 || (flow.exports?.length ?? 0) > 0

  // Geometry. Columns: left nodes, center Argentina, right nodes.
  const w = width || 800
  const leftX = 0
  const centerX = w / 2 - NODE_W / 2
  const rightX = w - NODE_W

  // Argentina central node spans the larger of the two stacks.
  const impTotal = imports.reduce((s, n) => s + n.value, 0)
  const expTotal = exportsN.reduce((s, n) => s + n.value, 0)
  const argTop = PAD_Y
  const argBottom = HEIGHT - PAD_Y
  const argH = argBottom - argTop

  // Distribute Argentina node attachment points proportionally per side.
  let impCursor = argTop
  const impLinks = imports.map((n) => {
    const seg = impTotal > 0 ? (n.value / impTotal) * argH : 0
    const link = { node: n, argY: impCursor, argH: Math.max(MIN_BAND, seg) }
    impCursor += seg
    return link
  })
  let expCursor = argTop
  const expLinks = exportsN.map((n) => {
    const seg = expTotal > 0 ? (n.value / expTotal) * argH : 0
    const link = { node: n, argY: expCursor, argH: Math.max(MIN_BAND, seg) }
    expCursor += seg
    return link
  })

  // Animate ribbons on flow change (opacity), gated for reduced motion.
  const sig = `${flow.mineral}|${String(flow.year)}|${topN}`
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const ribbons = svg.querySelectorAll<SVGPathElement>('[data-ribbon]')
    if (ribbons.length === 0) return
    if (prefersReducedMotion()) {
      utils.set(ribbons, { opacity: 1 })
      return
    }
    utils.set(ribbons, { opacity: 0 })
    animate(ribbons, {
      opacity: [0, 1],
      duration: 600,
      delay: stagger(40),
      ease: 'outQuad',
    })
  }, [sig])

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-nd-border bg-nd-surface">
        <p className="font-mono text-sm text-nd-text-disabled">{t('noData')}</p>
      </div>
    )
  }

  const moveTip = (e: React.MouseEvent, label: string, value: number) => {
    const rect = ref.current?.getBoundingClientRect()
    setHover({
      label,
      value,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    })
  }

  return (
    <div ref={ref} className="relative w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${w} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${t('origins')} / ${t('argentina')} / ${t('destinations')}`}
      >
        {/* Import ribbons: origin → Argentina (accent) */}
        {impLinks.map((l) => (
          <path
            key={`imp-${l.node.key}`}
            data-ribbon
            d={ribbonPath(
              leftX + NODE_W,
              l.node.y,
              l.node.h,
              centerX,
              l.argY,
              l.argH,
            )}
            fill={accent}
            fillOpacity={hover && hover.label === l.node.country ? 0.55 : 0.2}
            stroke="none"
            style={{ transition: 'fill-opacity 150ms' }}
            onMouseMove={(e) => moveTip(e, l.node.country, l.node.value)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* Export ribbons: Argentina → destination (neutral/secondary) */}
        {expLinks.map((l) => (
          <path
            key={`exp-${l.node.key}`}
            data-ribbon
            d={ribbonPath(
              centerX + NODE_W,
              l.argY,
              l.argH,
              rightX,
              l.node.y,
              l.node.h,
            )}
            fill="var(--nd-text-secondary)"
            fillOpacity={hover && hover.label === l.node.country ? 0.5 : 0.16}
            stroke="none"
            style={{ transition: 'fill-opacity 150ms' }}
            onMouseMove={(e) => moveTip(e, l.node.country, l.node.value)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* Argentina center node */}
        <rect x={centerX} y={argTop} width={NODE_W} height={argH} fill={accent} />

        {/* Origin nodes */}
        {imports.map((n) => (
          <g key={`impn-${n.key}`}>
            <rect
              x={leftX}
              y={n.y}
              width={NODE_W}
              height={n.h}
              fill={accent}
              onMouseMove={(e) => moveTip(e, n.country, n.value)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        {/* Destination nodes */}
        {exportsN.map((n) => (
          <g key={`expn-${n.key}`}>
            <rect
              x={rightX}
              y={n.y}
              width={NODE_W}
              height={n.h}
              fill="var(--nd-text-secondary)"
              onMouseMove={(e) => moveTip(e, n.country, n.value)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {/* Column labels */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        <span>{t('origins')}</span>
        <span>{t('argentina')}</span>
        <span>{t('destinations')}</span>
      </div>

      {/* HTML overlay labels next to nodes (crisp text, mono). */}
      <div className="pointer-events-none absolute inset-0">
        {imports.map((n) => (
          <div
            key={`impl-${n.key}`}
            className="absolute flex items-center gap-1.5 font-mono text-[11px] text-nd-text-secondary"
            style={{
              left: NODE_W + 8,
              top: `${(n.labelY / HEIGHT) * 100}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="truncate text-nd-text-primary" style={{ maxWidth: 120 }}>
              {n.country}
            </span>
            <span className="tabular-nums text-nd-text-disabled">${formatCompact(n.value)}</span>
          </div>
        ))}
        {exportsN.map((n) => (
          <div
            key={`expl-${n.key}`}
            className="absolute flex items-center justify-end gap-1.5 font-mono text-[11px] text-nd-text-secondary"
            style={{
              right: NODE_W + 8,
              top: `${(n.labelY / HEIGHT) * 100}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="tabular-nums text-nd-text-disabled">${formatCompact(n.value)}</span>
            <span className="truncate text-nd-text-primary" style={{ maxWidth: 120 }}>
              {n.country}
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 border border-nd-border bg-nd-surface px-2 py-1 font-mono text-[11px] text-nd-text-primary shadow-sm"
          style={{
            left: Math.min(hover.x + 10, (width || 0) - 160),
            top: Math.max(hover.y - 36, 0),
          }}
        >
          <div className="text-nd-text-primary">{hover.label}</div>
          <div className="tabular-nums text-nd-text-disabled">${hover.value.toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}
