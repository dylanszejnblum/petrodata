'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMounted } from '@/hooks/useMounted'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'
import type { InvCruce } from '@/api/inversiones'

const AGRO_COLOR = '#10b981'
const ENERGY_COLOR = 'var(--nd-accent)'

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

  const fmtVal = active === 'gdp' ? fmtPct : (v: number) => formatCompactUSD(v)

  if (!rows.length) {
    return (
      <div className="flex h-[280px] items-center justify-center font-mono text-sm text-nd-text-disabled md:h-[360px]">
        Sin datos de comercio.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {hasGdp && (
        <div className="inline-flex w-fit border border-nd-border" role="group" aria-label={t('cruceModeLabel')}>
          {(['usd', 'gdp'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={active === m}
              className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors"
              style={{
                color: active === m ? 'var(--nd-text-display)' : 'var(--nd-text-disabled)',
                background: active === m ? 'var(--nd-surface-raised)' : 'transparent',
              }}
            >
              {m === 'usd' ? t('cruceModeUsd') : t('cruceModeGdp')}
            </button>
          ))}
        </div>
      )}

      <div className="h-[280px] w-full md:h-[360px]">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--nd-border)' }}
                minTickGap={20}
              />
              <YAxis
                tickFormatter={(v) => fmtVal(v as number)}
                tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
                tickLine={false}
                axisLine={false}
                width={active === 'gdp' ? 44 : 52}
              />
              <Tooltip
                content={<CruceTooltip mode={active} />}
                cursor={{ stroke: 'var(--nd-border)', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="agro"
                name="agro"
                stroke={AGRO_COLOR}
                strokeWidth={1.5}
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
                strokeWidth={1.5}
                dot={false}
                connectNulls
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-nd-border pt-4">
        <LegendDot color={AGRO_COLOR} label="Agro (primarios + MOA)" />
        <LegendDot color={ENERGY_COLOR} label="Energía" />
        {active === 'gdp' && cruce.gdpSource && (
          <span className="ml-auto font-mono text-[10px] text-nd-text-disabled">
            {t('computedBy', { source: cruce.gdpSource.label })}
          </span>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 font-mono text-[11px] text-nd-text-secondary">
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
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  mode: Mode
}) {
  if (!active || !payload || !payload.length) return null
  const fmt = (v: number) => (mode === 'gdp' ? fmtPct(v) : formatCompactUSD(v))
  return (
    <div className="border border-nd-border bg-nd-surface/95 px-3 py-2 font-mono shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mb-1 border-b border-nd-border pb-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {label}
        {mode === 'gdp' ? ' · % PBI' : ''}
      </div>
      <ul className="flex flex-col gap-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-2 text-nd-text-secondary">
              <span className="inline-block size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
              {p.dataKey === 'agro' ? 'Agro' : 'Energía'}
            </span>
            <span className="tabular-nums text-nd-text-display">
              {p.value != null ? fmt(Number(p.value)) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
