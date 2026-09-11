'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame, AXIS_TICK, GRID_PROPS, ChartTooltipBox } from '@/ui/chart-frame'
import { formatDecimal, formatMonth } from '@/lib/format'

/* Precio spot histórico del uranio — AreaChart tokenizado (réplica del
   PriceChart de producción sin la estética terminal). */

type Point = { period: string; usdLb: number }

const monthOf = (period: string) => formatMonth(`${period}-01`)

export function UraniumPriceChart({ series }: { series: Point[] }) {
  return (
    <ChartFrame
      title="Precio spot del uranio"
      summary={`Serie mensual de ${series.length} puntos, en dólares por libra de U₃O₈.`}
      height="md"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="uranio-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--data-gas)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--data-gas)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="period"
            tick={AXIS_TICK}
            tickFormatter={monthOf}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatDecimal(v, 0)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as Point
              return (
                <ChartTooltipBox>
                  <p className="type-label mb-1">{monthOf(p.period)}</p>
                  <p className="tnums font-medium">{formatDecimal(p.usdLb, 1)} US$/lb</p>
                </ChartTooltipBox>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="usdLb"
            stroke="var(--data-gas)"
            strokeWidth={2}
            fill="url(#uranio-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
