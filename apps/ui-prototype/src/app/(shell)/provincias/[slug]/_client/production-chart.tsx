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
import { formatCompact, formatDecimal, formatInteger, formatMonth } from '@/lib/format'

/* Chart de producción provincial — serie ilustrativa derivada de la nacional
   en el server, este componente solo dibuja (props serializables). */

export type ProvincePoint = {
  period: string // 'YYYY-MM'
  oil: number // bbl/d
  gas: number // MMm3/d
}

export function ProvinceProductionChart({
  points,
  provinceName,
}: {
  points: ProvincePoint[]
  provinceName: string
}) {
  const first = points[0]
  const last = points[points.length - 1]
  const summary =
    first && last
      ? `Serie ilustrativa. De ${formatMonth(first.period)} a ${formatMonth(last.period)}: petróleo de ${formatInteger(first.oil)} a ${formatInteger(last.oil)} bbl/d y gas de ${formatDecimal(first.gas, 1)} a ${formatDecimal(last.gas, 1)} MMm3/d.`
      : undefined

  return (
    <ChartFrame title={`Producción histórica de ${provinceName}`} summary={summary} height="md">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="prov-oil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--data-oil)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--data-oil)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prov-gas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--data-gas)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--data-gas)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="period"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickFormatter={(v) => formatMonth(String(v))}
          />
          <YAxis
            yAxisId="oil"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <YAxis
            yAxisId="gas"
            orientation="right"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => formatInteger(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '2 4' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <ChartTooltipBox>
                  <p className="type-label mb-1.5">{formatMonth(String(label))}</p>
                  {payload.map((entry) => (
                    <p key={String(entry.dataKey)} className="flex items-center gap-2 tnums">
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full"
                        style={{ background: entry.color }}
                      />
                      {entry.dataKey === 'oil'
                        ? `Petróleo · ${formatInteger(Number(entry.value))} bbl/d`
                        : `Gas · ${formatDecimal(Number(entry.value), 1)} MMm3/d`}
                    </p>
                  ))}
                </ChartTooltipBox>
              )
            }}
          />
          <Area
            yAxisId="oil"
            type="monotone"
            dataKey="oil"
            name="Petróleo"
            stroke="var(--data-oil)"
            strokeWidth={1.5}
            fill="url(#prov-oil)"
          />
          <Area
            yAxisId="gas"
            type="monotone"
            dataKey="gas"
            name="Gas"
            stroke="var(--data-gas)"
            strokeWidth={1.5}
            fill="url(#prov-gas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
