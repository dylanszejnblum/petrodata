'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { OperatorAvatar } from '@/components/Petrodata/map/OperatorAvatar'
import { formatCompact, formatMonth } from '@/utilities/formatNumber'
import { useMounted } from '@/hooks/useMounted'
import type { ChartRow, OperatorSeriesMeta } from './operatorPalette'

export function ProductionChart({
  rows,
  operators,
}: {
  rows: ChartRow[]
  operators: OperatorSeriesMeta[]
}) {
  const mounted = useMounted()
  if (rows.length === 0 || operators.length === 0) {
    return (
      <div
        className="h-[280px] md:h-[400px] flex items-center justify-center text-nd-text-disabled text-sm font-mono"
      >
        No production data available.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[280px] md:h-[400px] w-full">
        {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              {operators.map((op) => (
                <linearGradient key={op.slug} id={`grad-${op.slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={op.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={op.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date_month"
              tickFormatter={(v) => formatMonth(v).split(' ')[0]}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--nd-border)' }}
              minTickGap={20}
            />
            <YAxis
              tickFormatter={(v) => formatCompact(v as number)}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip operators={operators} />} cursor={{ stroke: 'var(--nd-border)', strokeWidth: 1 }} />
            {operators.map((op) => (
              <Area
                key={op.slug}
                type="monotone"
                dataKey={op.slug}
                name={op.name}
                stackId="boe"
                stroke={op.color}
                strokeWidth={1.5}
                fill={`url(#grad-${op.slug})`}
                isAnimationActive
                animationDuration={800}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
      <Legend operators={operators} />
    </div>
  )
}

function Legend({ operators }: { operators: OperatorSeriesMeta[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-nd-border pt-4">
      {operators.map((op) => (
        <div key={op.slug} className="flex items-center gap-2">
          <OperatorAvatar slug={op.slug} name={op.name} size="sm" />
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: op.color }}
            aria-hidden
          />
          <span
            className="text-nd-text-secondary text-[11px] font-mono"
          >
            {op.name}
          </span>
        </div>
      ))}
    </div>
  )
}

type RechartsTooltipPayload = {
  value?: number
  dataKey?: string | number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  operators,
}: {
  active?: boolean
  payload?: RechartsTooltipPayload[]
  label?: string | number
  operators: OperatorSeriesMeta[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const byName = new Map(operators.map((op) => [op.slug, op]))
  // Recharts orders payload by series order; show stacked total at top
  const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
  return (
    <div
      className="rounded-none border border-nd-border bg-nd-surface/95 backdrop-blur-md px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] font-mono"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-nd-border pb-1.5 mb-1.5">
        <span className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]">
          {label ? formatMonth(String(label)) : ''}
        </span>
        <span className="text-nd-text-display text-[12px] tabular-nums">
          {formatCompact(total)} BOE
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {payload
          .slice()
          .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
          .map((row) => {
            const op = byName.get(String(row.dataKey))
            return (
              <li
                key={String(row.dataKey)}
                className="flex items-center justify-between gap-4 text-[11px]"
              >
                <span className="flex items-center gap-2 text-nd-text-secondary">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  {op?.name ?? row.dataKey}
                </span>
                <span className="text-nd-text-display tabular-nums">
                  {formatCompact(Number(row.value) || 0)}
                </span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
