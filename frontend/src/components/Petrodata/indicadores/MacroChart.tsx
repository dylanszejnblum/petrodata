'use client'

// One chart, three shapes — for the sourced economic series (inflation = area,
// FX = line, fiscal / energy surplus = signed bars). Themed with nd-* tokens to
// match RampChart. Bars colour positive green / negative red so the fiscal swing
// and the energy-surplus flip read at a glance.

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMounted } from '@/hooks/useMounted'
import { formatCompact } from '@/utilities/formatNumber'
import type { InvPolicyChart } from '@/api/inversiones'

function fmtPeriod(period: string): string {
  if (!period.includes('-')) return period // annual ("2025")
  const [y, m] = period.split('-')
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${month} '${y.slice(2)}`
}

function fmtValue(value: number, unit: string): string {
  switch (unit) {
    case '%/mes':
      return `${value.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
    case 'ARS/USD':
      return `$${formatCompact(value)}`
    case 'ARS millones':
    case 'US$ MM':
      return formatCompact(value)
    default:
      return value.toLocaleString('es-AR', { maximumFractionDigits: 1 })
  }
}

const AXIS = {
  tick: { fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' },
} as const

export function MacroChart({ chart }: { chart: InvPolicyChart }) {
  const mounted = useMounted()
  const rows = chart.points
  if (!rows.length) return null

  const yFmt = (v: number) => (chart.unit === '%/mes' ? `${v}%` : formatCompact(v))
  const tip = (
    <Tooltip content={<MacroTooltip unit={chart.unit} />} cursor={{ stroke: 'var(--nd-border)', strokeWidth: 1 }} />
  )
  const grid = <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
  const xAxis = (
    <XAxis
      dataKey="period"
      tickFormatter={fmtPeriod}
      tick={AXIS.tick}
      tickLine={false}
      axisLine={{ stroke: 'var(--nd-border)' }}
      minTickGap={28}
    />
  )
  const yAxis = (
    <YAxis tickFormatter={(v) => yFmt(v as number)} tick={AXIS.tick} tickLine={false} axisLine={false} width={48} />
  )

  return (
    <div className="h-[220px] w-full md:h-[260px]">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          {chart.kind === 'area' ? (
            <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`mg-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nd-accent)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--nd-accent)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              {grid}
              {xAxis}
              {yAxis}
              {tip}
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--nd-accent)"
                strokeWidth={1.5}
                fill={`url(#mg-${chart.id})`}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          ) : chart.kind === 'line' ? (
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              {grid}
              {xAxis}
              {yAxis}
              {tip}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--nd-interactive)"
                strokeWidth={1.75}
                dot={false}
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          ) : (
            <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              {grid}
              {xAxis}
              {yAxis}
              {tip}
              <ReferenceLine y={0} stroke="var(--nd-border)" />
              <Bar dataKey="value" isAnimationActive animationDuration={700}>
                {rows.map((r) => (
                  <Cell key={r.period} fill={r.value >= 0 ? 'var(--nd-success)' : 'var(--nd-accent)'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}

type TipPayload = { payload?: { period: string; value: number } }

function MacroTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: TipPayload[]
  label?: string | number
  unit: string
}) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="border border-nd-border bg-nd-surface/95 px-3 py-2 font-mono shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mb-1 border-b border-nd-border pb-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {fmtPeriod(String(label))}
      </div>
      <div className="text-[12px] tabular-nums text-nd-text-display">{fmtValue(row.value, unit)}</div>
    </div>
  )
}
