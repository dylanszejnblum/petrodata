'use client'

/* Cruce agro vs energía — alineado con las cards 01/02/03 (receta de
   Mariano, 2026-08-08): dato ancla animado (exportaciones de energía del
   último año + YoY), semántica de color Estrato — ENERGÍA en verde data-oil
   (protagonista), AGRO en gris neutro (vara de comparación) — y tooltip
   oscuro con fecha legible. El toggle US$ / %PBI se conserva. */

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from '../_lib/messages'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMounted } from '../_lib/useMounted'
import { formatCompactUSD } from '../_lib/formatCompactUSD'
import { animateCounter, prefersReducedMotion, useInView } from '../_lib/anim'
import type { InvCruce } from '../_lib/types'
import { YoyChip } from './YoyChip'

const ENERGY_COLOR = 'var(--data-oil)'
const AGRO_COLOR = 'var(--text-tertiary)'

type Mode = 'usd' | 'gdp'

type Row = { period: string; agro: number | null; energia: number | null }

const fmtPct = (v: number) => `${v.toFixed(1)}%`

export function CruceChart({ cruce }: { cruce: InvCruce }) {
  const t = useTranslations('indicadores')
  const mounted = useMounted()
  const [mode, setMode] = useState<Mode>('usd')

  const hasGdp = cruce.points.some((p) => p.agroPctGdp != null || p.energiaPctGdp != null)
  const active: Mode = hasGdp ? mode : 'usd'

  const rows: Row[] = cruce.points.map((p) => ({
    period: p.period,
    agro: active === 'gdp' ? p.agroPctGdp : p.agroUsd,
    energia: active === 'gdp' ? p.energiaPctGdp : p.energiaUsd,
  }))

  /* Dato ancla: energía del último año con dato + variación vs año anterior */
  const withEnergy = cruce.points.filter((p) => p.energiaUsd != null)
  const lastYear = withEnergy[withEnergy.length - 1]
  const prevYear = withEnergy[withEnergy.length - 2]
  const yoyPct =
    lastYear?.energiaUsd && prevYear?.energiaUsd
      ? (lastYear.energiaUsd / prevYear.energiaUsd - 1) * 100
      : null

  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const headRef = useRef<HTMLSpanElement>(null)

  /* ancla en formato es-AR (coma decimal), consistente con el bento */
  const fmtAnchor = (v: number) => formatCompactUSD(v).replace('.', ',')

  useEffect(() => {
    if (!inView || !headRef.current || !lastYear?.energiaUsd) return
    if (prefersReducedMotion()) {
      headRef.current.textContent = fmtAnchor(lastYear.energiaUsd)
      return
    }
    const a = animateCounter(headRef.current, lastYear.energiaUsd, {
      duration: 1500,
      delay: 250,
      format: fmtAnchor,
    })
    return () => {
      a?.pause?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, lastYear])

  const fmtVal = active === 'gdp' ? fmtPct : (v: number) => formatCompactUSD(v)

  if (!rows.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-tertiary md:h-[240px]">
        {t('charts.noTrade')}
      </div>
    )
  }

  return (
    <div ref={ref} className="flex flex-col gap-5">
      {/* Dato ancla + toggle (paridad con las cards 01/02/03) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {lastYear?.energiaUsd != null && (
          <div>
            <span className="type-label block">
              Exportaciones de energía · {lastYear.period}
            </span>
            <span className="mt-1 flex items-baseline gap-2">
              <span className="type-kpi block text-3xl md:text-4xl">
                <span ref={headRef}>{fmtAnchor(lastYear.energiaUsd)}</span>
              </span>
              {yoyPct != null && <YoyChip pct={yoyPct} />}
            </span>
          </div>
        )}

        {hasGdp && (
          <div className="inline-flex w-fit overflow-hidden rounded-[8px] border" role="group" aria-label={t('cruceModeLabel')}>
            {(['usd', 'gdp'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active === m}
                className="px-3 py-1.5 text-[11px] uppercase tracking-[var(--tracking-label)] transition-colors"
                style={{
                  color: active === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: active === m ? 'var(--surface-raised)' : 'transparent',
                }}
              >
                {m === 'usd' ? t('cruceModeUsd') : t('cruceModeGdp')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[200px] w-full md:h-[240px]">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border-default)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-default)' }}
                minTickGap={20}
              />
              <YAxis
                tickFormatter={(v) => fmtVal(v as number)}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                tickLine={false}
                axisLine={false}
                width={active === 'gdp' ? 44 : 52}
              />
              <Tooltip
                content={
                  <CruceTooltip
                    mode={active}
                    agroLabel={t('charts.agro')}
                    energyLabel={t('charts.energy')}
                    pctGdpSuffix={t('charts.pctGdpSuffix')}
                  />
                }
                cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }}
              />
              {/* agro primero (fondo), energía encima (protagonista) */}
              <Line
                type="monotone"
                dataKey="agro"
                name="agro"
                stroke={AGRO_COLOR}
                strokeWidth={1.25}
                dot={false}
                connectNulls
                isAnimationActive
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="energia"
                name="energia"
                stroke={ENERGY_COLOR}
                strokeWidth={1.75}
                dot={false}
                connectNulls
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4">
        <LegendDot color={ENERGY_COLOR} label={t('charts.energy')} />
        <LegendDot color={AGRO_COLOR} label={t('charts.agroLegend')} />
        {active === 'gdp' && cruce.gdpSource && (
          <span className="ml-auto text-[10px] text-tertiary">
            {cruce.gdpSource.label}
          </span>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-secondary">
      <span className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}

type TooltipPayload = { dataKey?: string | number; value?: number; color?: string }

function CruceTooltip({
  active,
  payload,
  label,
  mode,
  agroLabel,
  energyLabel,
  pctGdpSuffix,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  mode: Mode
  agroLabel?: string
  energyLabel?: string
  pctGdpSuffix?: string
}) {
  if (!active || !payload || !payload.length) return null
  const fmt = (v: number) => (mode === 'gdp' ? fmtPct(v) : formatCompactUSD(v))
  /* Tooltip oscuro Estrato: card negra radio 8, fecha legible (on-dark-2);
     la energía se lista primero (protagonista) */
  const ordered = [...payload].sort((a) => (a.dataKey === 'energia' ? -1 : 1))
  return (
    <div className="rounded-[8px] border border-white/15 bg-[#04060a] px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]">
      <div className="type-label-md mb-1.5 border-b border-white/10 pb-1.5 !text-on-dark-2">
        {label}
        {mode === 'gdp' ? ` · ${pctGdpSuffix}` : ''}
      </div>
      <ul className="flex flex-col gap-1">
        {ordered.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-2 text-on-dark-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: p.dataKey === 'energia' ? 'var(--data-oil)' : 'rgba(255,255,255,0.45)' }}
                aria-hidden
              />
              {p.dataKey === 'agro' ? agroLabel : energyLabel}
            </span>
            <span className="tnums text-white">{p.value != null ? fmt(Number(p.value)) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
