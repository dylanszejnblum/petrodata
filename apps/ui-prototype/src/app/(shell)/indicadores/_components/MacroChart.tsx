'use client'

// One chart, three shapes — for the sourced economic series (inflation = area,
// FX = line, fiscal / energy surplus = signed bars). Tokens Estrato, a juego
// con RampChart. Bars colour positive green / negative red so the fiscal swing
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
import { useMounted } from '../_lib/useMounted'
import { formatCompact } from '../_lib/formatNumber'
import { fmtPeriod } from './format'
import type { InvPolicyChart } from '../_lib/types'

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
  tick: { fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' },
} as const

export function MacroChart({ chart }: { chart: InvPolicyChart }) {
  const mounted = useMounted()
  const rows = chart.points
  if (!rows.length) return null

  const yFmt = (v: number) => (chart.unit === '%/mes' ? `${v}%` : formatCompact(v))
  const tip = (
    <Tooltip content={<MacroTooltip unit={chart.unit} />} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
  )
  const grid = <CartesianGrid stroke="var(--border-default)" strokeDasharray="2 4" vertical={false} />
  const xAxis = (
    <XAxis
      dataKey="period"
      tickFormatter={fmtPeriod}
      tick={AXIS.tick}
      tickLine={false}
      axisLine={{ stroke: 'var(--border-default)' }}
      minTickGap={28}
    />
  )
  const yAxis = (
    <YAxis tickFormatter={(v) => yFmt(v as number)} tick={AXIS.tick} tickLine={false} axisLine={false} width={48} />
  )

  return (
    <div className="h-[200px] w-full md:h-[240px]">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          {chart.kind === 'area' ? (
            <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`mg-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--data-oil)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--data-oil)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              {grid}
              {xAxis}
              {yAxis}
              {tip}
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--data-oil)"
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
                stroke="var(--data-gas)"
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
              <ReferenceLine y={0} stroke="var(--border-default)" />
              <Bar dataKey="value" isAnimationActive animationDuration={800}>
                {rows.map((r) => (
                  <Cell key={r.period} fill={r.value >= 0 ? 'var(--status-positive)' : 'var(--status-negative)'} />
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
    /* Tooltip oscuro Estrato: misma receta que los charts 01-04 */
    <div className="rounded-[8px] border border-white/15 bg-[#04060a] px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]">
      <div className="type-label-md mb-1.5 border-b border-white/10 pb-1.5 !text-on-dark-2">
        {fmtPeriod(String(label))}
      </div>
      <div className="text-[12px] tnums text-white">{fmtValue(row.value, unit)}</div>
    </div>
  )
}
