'use client'

// Interactive stock price chart for a public company. Fetches OHLC history from
// /api/v2/companies/prices/{ticker} with a range selector (1M/3M/6M/1Y/5Y),
// draws the close-price line with anime.js, and shows an OHLC + 52-week summary.
// Preserves its layout with an explicit unavailable state when history is missing.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { api, type ApiSchemas } from '@/api/client'
import { drawPath, fadeIn, useInView } from '@/components/Petrodata/uranium/anim'
import { formatDecimal } from '@/utilities/formatNumber'

type History = ApiSchemas['StockHistoryDto']

const RANGES = [
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
] as const
type RangeKey = (typeof RANGES)[number]['key']

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function StockPriceChart({
  ticker,
  embedded = false,
}: {
  ticker: string
  embedded?: boolean
}) {
  const t = useTranslations('companies')
  const locale = useLocale()
  const [range, setRange] = useState<RangeKey>('6mo')
  const [data, setData] = useState<History | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.GET('/api/v2/companies/prices/{ticker}', {
          params: { path: { ticker }, query: { range } },
          cache: 'no-store',
        })
        if (alive) {
          const nextData = res.data?.data ?? null
          setData(nextData)
        }
      } catch {
        if (alive) {
          setData(null)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [ticker, range])

  const points = useMemo(() => {
    const h = data?.history ?? []
    return h
      .map((p) => ({ date: p.date, close: num(p.close) }))
      .filter((p): p is { date: string; close: number } => p.close != null)
  }, [data])

  const current = num(data?.current_price)
  const changePct = num(data?.change_pct)
  const high52 = num(data?.high_52w)
  const low52 = num(data?.low_52w)
  const last = data?.history?.[data.history.length - 1]
  const nf = useMemo(
    () => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', { maximumFractionDigits: 2 }),
    [locale],
  )
  const up = (changePct ?? 0) >= 0
  const lineColor = up ? 'var(--nd-success)' : 'var(--nd-accent)'

  if (!loading && points.length < 2) {
    return <StockPriceEmpty embedded={embedded} label={t('priceChart.unavailable')} />
  }

  return (
    <div
      className={`${embedded ? 'bg-nd-surface' : 'border border-nd-border bg-nd-surface'} min-w-0 max-w-full overflow-hidden p-3 sm:p-4 md:p-5`}
      aria-busy={loading}
    >
      <div className="mb-3 flex flex-col items-stretch gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {t('priceChart.eyebrow')}
          </span>
          {current != null && (
            <span className="font-display text-2xl tabular-nums text-nd-text-display">
              ${nf.format(current)}
            </span>
          )}
          {changePct != null && (
            <span className="text-sm tabular-nums font-mono" style={{ color: lineColor }}>
              {up ? '▲' : '▼'} {formatDecimal(Math.abs(changePct), locale, 2)}%
            </span>
          )}
        </div>
        <div
          className="grid w-full min-w-0 max-w-full grid-cols-5 gap-px bg-nd-border sm:w-[220px]"
          role="group"
          aria-label={t('priceChart.rangeLabel')}
        >
          {RANGES.map((r) => {
            const active = r.key === range
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                aria-pressed={active}
                className={`min-h-11 min-w-0 bg-nd-surface px-1 py-1 text-[11px] tabular-nums sm:px-2 font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-nd-interactive ${
                  active
                    ? 'text-nd-text-display'
                    : 'text-nd-text-secondary hover:text-nd-text-display active:bg-nd-surface-raised'
                }`}
                style={active ? { boxShadow: 'inset 0 -2px 0 0 var(--nd-accent)' } : undefined}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      <Line
        points={points}
        color={lineColor}
        loading={loading}
        loadingLabel={t('priceChart.loading')}
        ariaLabel={t('priceChart.chartLabel', { ticker })}
      />

      {/* OHLC + 52w summary */}
      <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 text-[11px] tabular-nums sm:grid-cols-6 sm:gap-x-4 sm:gap-y-1.5 font-mono">
        <Cell label="O" value={fmt(num(last?.open), nf)} />
        <Cell label="H" value={fmt(num(last?.high), nf)} />
        <Cell label="L" value={fmt(num(last?.low), nf)} />
        <Cell label="C" value={fmt(num(last?.close), nf)} />
        <Cell label={t('priceChart.high52w')} value={fmt(high52, nf)} />
        <Cell label={t('priceChart.low52w')} value={fmt(low52, nf)} />
      </dl>
    </div>
  )
}

function StockPriceEmpty({ embedded, label }: { embedded: boolean; label: string }) {
  return (
    <div
      className={`${embedded ? 'bg-nd-surface' : 'border border-nd-border bg-nd-surface'} flex min-h-[396px] min-w-0 max-w-full items-center justify-center overflow-hidden p-6 sm:min-h-[348px]`}
      role="status"
    >
      <p className="max-w-xs text-center text-sm text-nd-text-secondary font-mono">{label}</p>
    </div>
  )
}

function fmt(v: number | null, nf: Intl.NumberFormat): string {
  return v == null ? '—' : `$${nf.format(v)}`
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-nd-text-disabled uppercase tracking-[0.06em]">{label}</dt>
      <dd className="truncate whitespace-nowrap text-nd-text-secondary">{value}</dd>
    </div>
  )
}

const MOBILE_CHART = { height: 196, pad: { left: 42, right: 8, top: 12, bottom: 24 } }
const DESKTOP_CHART = { height: 220, pad: { left: 48, right: 12, top: 12, bottom: 24 } }

function Line({
  points,
  color,
  loading,
  loadingLabel,
  ariaLabel,
}: {
  points: { date: string; close: number }[]
  color: string
  loading: boolean
  loadingLabel: string
  ariaLabel: string
}) {
  const locale = useLocale()
  const { ref, inView } = useInView<HTMLDivElement>()
  const [w, setW] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const chartLayout = w > 0 && w < 420 ? MOBILE_CHART : DESKTOP_CHART

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [ref])

  const nf = useMemo(
    () => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', { maximumFractionDigits: 2 }),
    [locale],
  )

  const geom = useMemo(() => {
    if (w < 2 || points.length < 2) return null
    const n = points.length
    const closes = points.map((p) => p.close)
    const min = Math.min(...closes)
    const max = Math.max(...closes)
    const span = max - min || 1
    const { height, pad } = chartLayout
    const plotW = w - pad.left - pad.right
    const plotH = height - pad.top - pad.bottom
    const x = (i: number) => pad.left + (i / (n - 1)) * plotW
    const y = (c: number) => pad.top + (1 - (c - min) / span) * plotH
    const xs = points.map((_, i) => x(i))
    const ys = points.map((p) => y(p.close))
    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
      .join(' ')
    const area = `${line} L${xs[n - 1].toFixed(1)} ${height - pad.bottom} L${xs[0].toFixed(1)} ${height - pad.bottom} Z`

    // Reduce axis density as the chart narrows so labels never collide.
    const yCount = w < 420 ? 3 : 4
    const yTicks = Array.from({ length: yCount }, (_, k) => {
      const value = max - (span * k) / (yCount - 1)
      return { value, y: y(value) }
    })

    // X date ticks (~5, evenly spaced indices)
    const spanDays = (Date.parse(points[n - 1].date) - Date.parse(points[0].date)) / 86400000
    const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
      ...(spanDays > 120
        ? { month: 'short', year: '2-digit' }
        : { day: 'numeric', month: 'short' }),
      timeZone: 'UTC',
    })
    const count = Math.min(w < 420 ? 3 : w < 640 ? 4 : 5, n)
    const seen = new Set<number>()
    const xTicks = Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1)))
      .filter((i) => (seen.has(i) ? false : (seen.add(i), true)))
      .map((i) => ({ x: xs[i], label: fmt.format(new Date(points[i].date)) }))

    return { line, area, xs, ys, yTicks, xTicks, height, pad }
  }, [w, points, locale, chartLayout])

  useEffect(() => {
    if (!inView || !geom || !pathRef.current) return
    drawPath(pathRef.current, { duration: 1400, delay: 80 })
    if (fillRef.current) fadeIn(fillRef.current, { delay: 700, duration: 800 })
  }, [inView, geom])

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!geom) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < geom.xs.length; i++) {
      const d = Math.abs(geom.xs[i] - mx)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    setHover(best)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (points.length < 2 || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const currentIndex = hover ?? points.length - 1
    const direction = e.key === 'ArrowLeft' ? -1 : 1
    setHover(Math.min(points.length - 1, Math.max(0, currentIndex + direction)))
  }

  const hp =
    hover != null && geom ? { x: geom.xs[hover], y: geom.ys[hover], pt: points[hover] } : null
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div
      ref={ref}
      className="relative w-full min-w-0 max-w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-nd-interactive"
      style={{
        height: chartLayout.height,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 200ms',
      }}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      onFocus={() => points.length > 0 && setHover(points.length - 1)}
      onBlur={() => setHover(null)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-label={ariaLabel}
      role="group"
    >
      {loading && points.length < 2 && (
        <div className="absolute inset-0 flex items-center justify-center" role="status">
          <span className="text-[11px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {loadingLabel}
          </span>
        </div>
      )}
      {geom && w > 0 && (
        <svg width={w} height={geom.height} className="block" aria-hidden="true" focusable="false">
          {/* Y gridlines + price labels */}
          {geom.yTicks.map((tck, i) => (
            <g key={i}>
              <line
                x1={geom.pad.left}
                x2={w - geom.pad.right}
                y1={tck.y}
                y2={tck.y}
                stroke="var(--nd-border)"
                strokeWidth={1}
              />
              <text
                x={geom.pad.left - 6}
                y={tck.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-nd-text-disabled font-mono"
                style={{ fontSize: 10 }}
              >
                ${nf.format(tck.value)}
              </text>
            </g>
          ))}
          {/* X date ticks */}
          {geom.xTicks.map((tck, i) => (
            <text
              key={i}
              x={tck.x}
              y={geom.height - 8}
              textAnchor="middle"
              className="fill-nd-text-disabled font-mono"
              style={{ fontSize: 10 }}
            >
              {tck.label}
            </text>
          ))}
          {/* Area + line */}
          <path
            ref={fillRef}
            d={geom.area}
            fill={color}
            fillOpacity={0.1}
            stroke="none"
            style={{ opacity: 0 }}
          />
          <path
            ref={pathRef}
            d={geom.line}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hover crosshair + dot */}
          {hp && (
            <g>
              <line
                x1={hp.x}
                x2={hp.x}
                y1={geom.pad.top}
                y2={geom.height - geom.pad.bottom}
                stroke="var(--nd-border-visible)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={hp.x}
                cy={hp.y}
                r={3.5}
                fill={color}
                stroke="var(--nd-surface)"
                strokeWidth={1.5}
              />
            </g>
          )}
        </svg>
      )}
      {/* Tooltip */}
      {hp && (
        <>
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 border border-nd-border bg-nd-surface px-2 py-1 font-mono text-[11px] whitespace-nowrap"
            style={{ left: Math.min(Math.max(hp.x, 56), w - 56), top: 0 }}
          >
            <span className="tabular-nums text-nd-text-display">${nf.format(hp.pt.close)}</span>
            <span className="ml-2 text-nd-text-disabled">
              {dateFmt.format(new Date(hp.pt.date))}
            </span>
          </div>
          <span className="sr-only" aria-live="polite">
            {dateFmt.format(new Date(hp.pt.date))}: ${nf.format(hp.pt.close)}
          </span>
        </>
      )}
    </div>
  )
}
