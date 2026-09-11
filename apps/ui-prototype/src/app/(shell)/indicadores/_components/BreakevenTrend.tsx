'use client'

// Brent-vs-breakeven trend. The measured Brent series is drawn as an area whose
// baseline sits at the breakeven reference, so the shaded band IS the headroom:
// success-tinted where Brent trades above breakeven, warning-tinted below. A
// dashed reference line marks the breakeven and the latest point is highlighted.
// The headroom figure ticks up on scroll-into-view; reduced motion renders the
// final state at once. All figures are also stated in the legend.

import { useEffect, useRef } from 'react'
import { useTranslations } from '../_lib/messages'
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
import { useMounted } from '../_lib/useMounted'
import { animateCounter, prefersReducedMotion, useInView } from '../_lib/anim'
import type { InvBreakeven } from '../_lib/types'
import { fmtPeriod } from './format'

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

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
      headRef.current.textContent = nf1.format(headroomUsd)
      return
    }
    const a = animateCounter(headRef.current, headroomUsd, {
      duration: 1500,
      delay: 250,
      format: (v) => nf1.format(v),
    })
    return () => {
      a?.pause?.()
    }
  }, [inView, headroomUsd])

  const values = rows.map((r) => r.value)
  const dataMin = values.length ? Math.min(...values, referenceUsd) : referenceUsd
  const dataMax = values.length ? Math.max(...values, referenceUsd) : referenceUsd
  /* Escala con piso GARANTIZADO (fix de Mariano, 2026-08-08): la línea de
     breakeven siempre queda dentro del área visible con aire debajo —
     al menos 15% del rango (o US$5) — sin importar el precio del petróleo.
     Con la fórmula original (min×0.96), cuando el mínimo ES el breakeven,
     la referencia quedaba pegada al eje X, tapada por los labels. */
  const span = Math.max(dataMax - dataMin, 1)
  const paddedMin = dataMin - Math.max(span * 0.15, 5)
  const paddedMax = dataMax + Math.max(span * 0.06, 2)
  /* Ticks REDONDOS y equiespaciados (fix de Mariano, 2026-08-08): sin esto,
     Recharts divide el dominio crudo y salen precios feos (43, 63, 83, 103…)
     que se leen como escala no uniforme. Paso "lindo" (10/20/25/50…) y
     dominio alineado a sus múltiplos. */
  const rawStep = (paddedMax - paddedMin) / 4
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const step = [1, 2, 2.5, 5, 10].map((c) => c * pow).find((c) => c >= rawStep) ?? 10 * pow
  const domainMin = Math.floor(paddedMin / step) * step
  const domainMax = Math.ceil(paddedMax / step) * step
  const yTicks: number[] = []
  for (let v = domainMin; v <= domainMax + 1e-9; v += step) yTicks.push(Math.round(v * 100) / 100)
  // Fraction from the TOP of the area's vertical extent at which the breakeven
  // reference sits. Above this offset the band is headroom (success); below it
  // is shortfall (warning). When Brent never crosses the reference, the offset
  // collapses to 0 or 1 and the band renders single-colour — as intended.
  const off = dataMax > dataMin ? clamp01((dataMax - referenceUsd) / (dataMax - dataMin)) : 0.5
  const last = rows[rows.length - 1]
  const positive = headroomUsd >= 0
  const stateColor = positive ? 'var(--status-positive)' : 'var(--status-caution)'

  return (
    <div ref={ref} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="type-label block">
            {t('charts.breakevenHeadroom')}
          </span>
          <span className="type-kpi mt-1 block text-3xl md:text-4xl">
            US$<span ref={headRef}>{nf1.format(headroomUsd)}</span>
            <span className="ml-1 text-base font-normal text-secondary">/bbl</span>
          </span>
        </div>
      </div>

      {rows.length >= 2 ? (
        <div className="h-[200px] w-full md:h-[240px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-be-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="var(--status-positive)" stopOpacity={0.45} />
                    <stop offset={off} stopColor="var(--status-positive)" stopOpacity={0.04} />
                    <stop offset={off} stopColor="var(--status-caution)" stopOpacity={0.04} />
                    <stop offset={1} stopColor="var(--status-caution)" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="grad-be-stroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={off} stopColor="var(--status-positive)" />
                    <stop offset={off} stopColor="var(--status-caution)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-default)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtPeriod}
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  minTickGap={36}
                />
                <YAxis
                  domain={[domainMin, domainMax]}
                  ticks={yTicks}
                  tickFormatter={(v) => `US$${nf0.format(v as number)}`}
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  content={<BeTooltip referenceUsd={referenceUsd} />}
                  cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }}
                />
                <ReferenceLine
                  y={referenceUsd}
                  stroke="var(--text-secondary)"
                  strokeDasharray="5 4"
                  strokeWidth={1}
                  label={{
                    value: `Breakeven US$${nf0.format(referenceUsd)}`,
                    position: 'insideTopLeft',
                    fill: 'var(--text-secondary)',
                    fontSize: 10,
                    fontFamily: 'var(--font-schibsted)',
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
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-tertiary md:h-[240px]">
          {t('charts.noBrent')}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <span className="text-secondary">
          <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ background: stateColor }} />{' '}
          Brent · {breakeven.source.asOf} · US${nf1.format(brentUsd)}
        </span>
        <span className="text-tertiary">
          Ref. US${nf0.format(referenceUsd)} — {breakeven.referenceSource.label}
        </span>
      </div>

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
  /* Tooltip oscuro Estrato: card negra, radio 8px, status vivos del tema
     dark — el caso negativo va en CAUTION (ámbar), la misma semántica que
     la banda del chart, no en rojo */
  return (
    <div className="rounded-[8px] border border-white/15 bg-[#04060a] px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]">
      {/* la fecha es encabezado, no metadata: on-dark-2 y 11px para que se lea */}
      <div className="type-label-md mb-1.5 border-b border-white/10 pb-1.5 !text-on-dark-2">
        {fmtPeriod(row.date)}
      </div>
      <div className="text-[12px] tnums text-white">Brent US${nf1.format(row.value)}</div>
      <div
        className="text-[11px] tnums"
        style={{ color: positive ? '#2fe0a4' : '#c49a3f' }}
      >
        {positive ? '+' : ''}
        {nf1.format(head)} vs breakeven
      </div>
    </div>
  )
}
