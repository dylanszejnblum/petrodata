'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiSchemas } from '@/api/client'
import { api } from '@/api/client'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { formatCompact } from '@/utilities/formatNumber'
import { prefersReducedMotion } from '@/components/Petrodata/uranium/anim'
import { TradeSankey } from './TradeSankey'

type TradeFlowDto = ApiSchemas['TradeFlowDto']
type Edge = ApiSchemas['TradeFlowEdgeDto']

const TOP_N_OPTIONS = [5, 10, Infinity] as const
const STEP_MS = 1200

/** year is typed Record<string,never>|null on the DTO; treat as number|null. */
function yearOf(flow: TradeFlowDto): number | null {
  const y = flow.year as unknown
  return typeof y === 'number' ? y : null
}

export function TradeFlowExplorer({
  initial,
  minerals,
}: {
  initial: TradeFlowDto
  minerals: string[]
}) {
  const t = useTranslations('trade')

  const [selectedMineral, setSelectedMineral] = useState<string>(initial.mineral)
  const [selectedYear, setSelectedYear] = useState<number | null>(yearOf(initial))
  const [topN, setTopN] = useState<number>(10)
  const [data, setData] = useState<TradeFlowDto>(initial)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)

  const years = data.available_years ?? []
  const minYear = years.length ? Math.min(...years) : null
  const maxYear = years.length ? Math.max(...years) : null

  // Fetch a flow client-side; keep previous data visible during the fetch.
  const fetchFlow = useCallback(
    async (mineral: string, year: number | null) => {
      setLoading(true)
      try {
        const result = await api.GET('/api/v2/minerals/trade/flow', {
          params: { query: { mineral, year: year ?? undefined } },
          cache: 'no-store',
        })
        const dto = result.data?.data
        if (dto) {
          setData(dto)
          setSelectedYear(yearOf(dto))
        }
      } catch {
        // keep previous data on failure
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Mineral change → refetch (year resets to backend default).
  const onMineral = (m: string) => {
    if (m === selectedMineral) return
    setPlaying(false)
    setSelectedMineral(m)
    void fetchFlow(m, null)
  }

  // Year change → refetch.
  const onYear = (y: number) => {
    if (y === selectedYear) return
    setSelectedYear(y)
    void fetchFlow(selectedMineral, y)
  }

  // Auto-advance loop. Respects reduced motion (never auto-plays).
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!playing || prefersReducedMotion()) return
    if (years.length < 2 || minYear == null || maxYear == null) return
    timerRef.current = setInterval(() => {
      setSelectedYear((prev) => {
        const cur = prev ?? maxYear
        const idx = years.indexOf(cur)
        const next = years[(idx + 1) % years.length]
        void fetchFlow(selectedMineral, next)
        return next
      })
    }, STEP_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [playing, years, minYear, maxYear, selectedMineral, fetchFlow])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const balance = data.balance_usd ?? 0
  const surplus = balance > 0
  const balanceColor = surplus ? 'var(--nd-success)' : 'var(--nd-accent)'

  const reduced = typeof window !== 'undefined' && prefersReducedMotion()

  return (
    <div className="border border-nd-border bg-nd-surface">
      {/* Controls */}
      <div className="flex flex-col gap-5 border-b border-nd-border p-5 md:p-6">
        {/* Mineral selector */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {t('mineral')}
          </span>
          <div className="flex flex-wrap gap-px bg-nd-border">
            {minerals.map((m) => {
              const active = m === selectedMineral
              const { color } = commodityColor(m)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMineral(m)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 bg-nd-surface px-3 py-2 font-mono text-xs transition-opacity hover:opacity-100 ${
                    active
                      ? 'text-nd-text-display opacity-100'
                      : 'text-nd-text-secondary opacity-70'
                  }`}
                  style={active ? { boxShadow: `inset 0 -2px 0 0 ${color}` } : undefined}
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2"
                    style={{ backgroundColor: color }}
                  />
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          {/* Year slider + play */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {t('year')}
              </span>
              <span className="font-mono text-sm tabular-nums text-nd-text-display">
                {selectedYear ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? t('pause') : t('play')}
                disabled={reduced || years.length < 2}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-nd-border bg-nd-surface text-nd-text-primary disabled:opacity-40"
              >
                <span aria-hidden className="font-mono text-xs">
                  {playing ? '❚❚' : '▶'}
                </span>
              </button>
              <input
                type="range"
                min={minYear ?? 0}
                max={maxYear ?? 0}
                step={1}
                value={selectedYear ?? maxYear ?? 0}
                disabled={!years.length}
                aria-label={t('year')}
                onChange={(e) => {
                  // snap to the nearest available year
                  const raw = Number(e.target.value)
                  const nearest = years.reduce(
                    (best, y) => (Math.abs(y - raw) < Math.abs(best - raw) ? y : best),
                    years[0] ?? raw,
                  )
                  onYear(nearest)
                }}
                className="h-1 w-full appearance-none bg-nd-border accent-nd-accent"
                style={{ accentColor: 'var(--nd-accent)' }}
              />
            </div>
          </div>

          {/* Top-N toggle */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
              {t('show')}
            </span>
            <div className="flex gap-px bg-nd-border">
              {TOP_N_OPTIONS.map((n) => {
                const active = n === topN
                return (
                  <button
                    key={String(n)}
                    type="button"
                    onClick={() => setTopN(n)}
                    aria-pressed={active}
                    className={`bg-nd-surface px-3 py-2 font-mono text-xs ${
                      active ? 'text-nd-text-display' : 'text-nd-text-secondary opacity-70'
                    }`}
                    style={
                      active ? { boxShadow: 'inset 0 -2px 0 0 var(--nd-accent)' } : undefined
                    }
                  >
                    {n === Infinity ? t('all') : t('topN', { n })}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Balance badge */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs">
          <span className="text-nd-text-disabled">
            {t('imports')}{' '}
            <span className="tabular-nums text-nd-text-primary">
              ${formatCompact(data.total_import_usd ?? 0)}
            </span>
          </span>
          <span className="text-nd-text-disabled">
            {t('exports')}{' '}
            <span className="tabular-nums text-nd-text-primary">
              ${formatCompact(data.total_export_usd ?? 0)}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-2 border px-2 py-1"
            style={{ borderColor: balanceColor, color: balanceColor }}
          >
            <span className="uppercase tracking-[0.08em]">
              {surplus ? t('surplus') : t('deficit')}
            </span>
            <span className="tabular-nums">${formatCompact(Math.abs(balance))}</span>
          </span>
          {loading && (
            <span className="animate-pulse text-nd-text-disabled" aria-live="polite">
              …
            </span>
          )}
        </div>
      </div>

      {/* Visualization: Sankey on desktop, bars on mobile */}
      <div
        className="p-5 md:p-6 transition-opacity"
        style={{ opacity: loading ? 0.5 : 1 }}
      >
        <div className="hidden md:block">
          <TradeSankey flow={data} topN={topN} />
        </div>
        <div className="md:hidden">
          <BarsFallback flow={data} topN={topN} />
        </div>
      </div>
    </div>
  )
}

/** Mobile fallback: horizontal bars per country, imports (accent) + exports (muted). */
function BarsFallback({ flow, topN }: { flow: TradeFlowDto; topN: number }) {
  const t = useTranslations('trade')
  const accent = commodityColor(flow.mineral).color

  const top = (edges: Edge[]) =>
    [...edges].sort((a, b) => b.value_usd - a.value_usd).slice(0, topN)
  const imports = top(flow.imports ?? [])
  const exportsN = top(flow.exports ?? [])

  const hasData = imports.length > 0 || exportsN.length > 0
  if (!hasData) {
    return <p className="font-mono text-sm text-nd-text-disabled">{t('noData')}</p>
  }

  const maxImp = Math.max(1, ...imports.map((e) => e.value_usd))
  const maxExp = Math.max(1, ...exportsN.map((e) => e.value_usd))

  const Bars = ({
    title,
    edges,
    max,
    color,
  }: {
    title: string
    edges: Edge[]
    max: number
    color: string
  }) => (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {title}
      </span>
      {edges.length === 0 ? (
        <span className="font-mono text-xs text-nd-text-disabled">{t('noData')}</span>
      ) : (
        edges.map((e) => (
          <div key={e.country} className="flex flex-col gap-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="truncate text-nd-text-primary">{e.country}</span>
              <span className="tabular-nums text-nd-text-disabled">
                ${formatCompact(e.value_usd)}
              </span>
            </div>
            <div className="h-2 w-full bg-nd-border">
              <div
                className="h-full origin-left"
                style={{
                  backgroundColor: color,
                  transform: `scaleX(${Math.max(0.02, e.value_usd / max)})`,
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <Bars title={t('origins')} edges={imports} max={maxImp} color={accent} />
      <Bars
        title={t('destinations')}
        edges={exportsN}
        max={maxExp}
        color="var(--nd-text-secondary)"
      />
    </div>
  )
}
