'use client'

// Brent-vs-breakeven trend. The measured Brent series is drawn as an area whose
// baseline sits at the breakeven reference, so the shaded band IS the headroom:
// success-tinted where Brent trades above breakeven, warning-tinted below. A
// dashed reference line marks the breakeven and the latest point is highlighted.
// The headroom figure ticks up on scroll-into-view; reduced motion renders the
// final state at once. All figures are also stated in the legend.

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMounted } from '@/hooks/useMounted'
import { animateCounter, prefersReducedMotion, useInView } from './anim'
import type { InvBreakeven } from '@/api/inversiones'

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

function fmtDate(iso: string): string {
  // "2026-04-21" → "abr '26"
  const [y, m] = iso.split('-')
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${month} '${y.slice(2)}`
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function BreakevenTrend({ breakeven }: { breakeven: InvBreakeven }) {
  const t = useTranslations('indicadores')
  const mounted = useMounted()
  const { brentUsd, referenceUsd, headroomUsd } = breakeven
  const rows = (breakeven.series ?? []).map((p) => ({ date: p.date, value: p.value }))

  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const headRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!inView || !headRef.current) return
    if (prefersReducedMotion()) {
      headRef.current.textContent = nf0.format(Math.round(headroomUsd))
      return
    }
    const a = animateCounter(headRef.current, Math.round(headroomUsd), {
      duration: 1500,
      delay: 250,
      format: (v) => nf0.format(Math.round(v)),
    })
    return () => {
      a?.pause?.()
    }
  }, [inView, headroomUsd])

  const values = rows.map((r) => r.value)
  const dataMin = values.length ? Math.min(...values, referenceUsd) : referenceUsd
  const dataMax = values.length ? Math.max(...values, referenceUsd) : referenceUsd
  // Fraction from the TOP of the area's vertical extent at which the breakeven
  // reference sits. Above this offset the band is headroom (success); below it
  // is shortfall (warning). When Brent never crosses the reference, the offset
  // collapses to 0 or 1 and the band renders single-colour — as intended.
  const off = dataMax > dataMin ? clamp01((dataMax - referenceUsd) / (dataMax - dataMin)) : 0.5
  const last = rows[rows.length - 1]
  const positive = headroomUsd >= 0
  const stateColor = positive ? 'var(--nd-success)' : 'var(--nd-warning)'

  return (
    <div ref={ref} className="flex flex-col gap-5 bg-nd-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            Headroom sobre breakeven
          </span>
          <span className="mt-1 block text-3xl tabular-nums text-nd-text-display md:text-4xl font-display">
            US$<span ref={headRef}>{nf0.format(Math.round(headroomUsd))}</span>
            <span className="ml-1 text-base text-nd-text-secondary">/bbl</span>
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]"
          style={{ color: stateColor, background: `color-mix(in srgb, ${stateColor} 12%, transparent)` }}
        >
          Confirmado
        </span>
      </div>

      {rows.length >= 2 ? (
        <div className="h-[200px] w-full md:h-[240px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-be-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="var(--nd-success)" stopOpacity={0.45} />
                    <stop offset={off} stopColor="var(--nd-success)" stopOpacity={0.04} />
                    <stop offset={off} stopColor="var(--nd-warning)" stopOpacity={0.04} />
                    <stop offset={1} stopColor="var(--nd-warning)" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="grad-be-stroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={off} stopColor="var(--nd-success)" />
                    <stop offset={off} stopColor="var(--nd-warning)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--nd-border)' }}
                  minTickGap={36}
                />
                <YAxis
                  domain={[Math.floor(dataMin * 0.96), Math.ceil(dataMax * 1.04)]}
                  tickFormatter={(v) => `US$${nf0.format(v as number)}`}
                  tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  content={<BeTooltip referenceUsd={referenceUsd} />}
                  cursor={{ stroke: 'var(--nd-border)', strokeWidth: 1 }}
                />
                <ReferenceLine
                  y={referenceUsd}
                  stroke="var(--nd-text-secondary)"
                  strokeDasharray="5 4"
                  strokeWidth={1}
                  label={{
                    value: `Breakeven US$${nf0.format(referenceUsd)}`,
                    position: 'insideTopLeft',
                    fill: 'var(--nd-text-secondary)',
                    fontSize: 10,
                    fontFamily: 'var(--font-space-mono)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  baseValue={referenceUsd}
                  stroke="url(#grad-be-stroke)"
                  strokeWidth={1.75}
                  fill="url(#grad-be-fill)"
                  isAnimationActive={!prefersReducedMotion()}
                  animationDuration={900}
                />
                {last && (
                  <ReferenceDot
                    x={last.date}
                    y={last.value}
                    r={4}
                    fill={stateColor}
                    stroke="var(--nd-surface)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center font-mono text-sm text-nd-text-disabled md:h-[240px]">
          Sin serie histórica de Brent.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
        <span className="text-nd-text-secondary">
          <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ background: stateColor }} />{' '}
          Brent · {breakeven.source.asOf} · US${nf0.format(Math.round(brentUsd))}
        </span>
        <span className="text-nd-text-disabled">
          Ref. US${nf0.format(referenceUsd)} — {breakeven.referenceSource.label}
        </span>
      </div>

      <span className="font-mono text-[10px] text-nd-text-disabled">
        {t('computedBy', { source: `${breakeven.source.label} · ${breakeven.source.asOf}` })}
      </span>
    </div>
  )
}

type TooltipPayload = { value?: number; payload?: { date: string; value: number } }

function BeTooltip({
  active,
  payload,
  referenceUsd,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  referenceUsd: number
}) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const head = row.value - referenceUsd
  const positive = head >= 0
  return (
    <div className="border border-nd-border bg-nd-surface/95 px-3 py-2 font-mono shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mb-1 border-b border-nd-border pb-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {fmtDate(row.date)}
      </div>
      <div className="text-[12px] tabular-nums text-nd-text-display">Brent US${nf1.format(row.value)}</div>
      <div
        className="text-[11px] tabular-nums"
        style={{ color: positive ? 'var(--nd-success)' : 'var(--nd-warning)' }}
      >
        {positive ? '+' : ''}
        {nf1.format(head)} vs breakeven
      </div>
    </div>
  )
}
