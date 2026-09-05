'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, ChartFrame, ChartTooltipBox, GRID_PROPS } from '@/ui/chart-frame'
import { TOP_OPERATORS } from '@/fixtures/operators'
import { OPERATOR_SERIES } from '@/fixtures/production'
import { formatCompact, formatInteger, formatMonth } from '@/lib/format'

/* Área apilada de producción por operadora (top 5, últimos 12 meses).
   Client component: Recharts no corre en el server. */

type TooltipItem = {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
}

function OperatorTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ReadonlyArray<TooltipItem>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((acc, p) => acc + (typeof p.value === 'number' ? p.value : 0), 0)
  return (
    <ChartTooltipBox>
      <p className="type-label mb-2">{formatMonth(`${String(label)}-01`)}</p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {[...payload].reverse().map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-secondary">
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="tnums font-medium text-primary">
              {typeof p.value === 'number' ? formatInteger(p.value) : p.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center justify-between gap-4 border-t pt-1.5">
        <span className="type-label">Total</span>
        <span className="tnums font-medium text-primary">{formatInteger(total)} BOE/d</span>
      </p>
    </ChartTooltipBox>
  )
}

export function OperatorAreaChart() {
  return (
    <ChartFrame
      title="Producción por operadora"
      summary="Área apilada de los últimos 12 meses para las cinco operadoras principales, en barriles equivalentes por día."
      height="md"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={OPERATOR_SERIES} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="period"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tickFormatter={(v: string) => formatMonth(`${v}-01`)}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatCompact(v)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '2 4' }}
            content={<OperatorTooltip />}
          />
          {TOP_OPERATORS.map((op) => (
            <Area
              key={op.slug}
              type="monotone"
              dataKey={op.slug}
              name={op.name}
              stackId="operadoras"
              stroke={op.color}
              strokeWidth={1.5}
              fill={op.color}
              fillOpacity={0.24}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
