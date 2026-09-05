'use client'

import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, ChartFrame, ChartTooltipBox } from '@/ui/chart-frame'
import { SegmentedControl } from '@/ui/segmented'
import { formatDecimal } from '@/lib/format'

/* Cotización simulada — serie determinística generada desde el precio actual
   (seno + drift, sin Math.random ni Date.now): siempre la misma curva por ticker. */

type Range = '1M' | '6M' | '1Y'

const RANGE_POINTS: Record<Range, number> = { '1M': 10, '6M': 30, '1Y': 60 }

/** Fecha de cierre fija del mock (el prototipo no usa el reloj real). */
const END_UTC = Date.UTC(2026, 7, 5)
const STEP_DAYS = 6 // 60 puntos ≈ 1 año

type Point = { date: string; label: string; price: number }

function buildSeries(price: number): Point[] {
  return Array.from({ length: 60 }, (_, i) => {
    const value = price * (1 + Math.sin(i / 6) * 0.04 + (i - 30) * 0.001)
    const d = new Date(END_UTC - (59 - i) * STEP_DAYS * 86400000)
    return {
      date: d.toISOString().slice(0, 10),
      label: d
        .toLocaleDateString('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        .replace('.', ''),
      price: value,
    }
  })
}

export function StockChart({ ticker, price }: { ticker: string; price: number }) {
  const [range, setRange] = useState<Range>('6M')
  const series = useMemo(() => buildSeries(price), [price])
  const visible = series.slice(-RANGE_POINTS[range])
  const first = visible[0].price
  const last = visible[visible.length - 1].price
  const summary = `Serie simulada de ${ticker}: de US$ ${formatDecimal(first, 2)} a US$ ${formatDecimal(last, 2)} en el rango elegido.`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-label m-0">Cotización · {ticker} (simulada)</p>
        <SegmentedControl<Range>
          value={range}
          onChange={setRange}
          options={[
            { value: '1M', label: '1M' },
            { value: '6M', label: '6M' },
            { value: '1Y', label: '1Y' },
          ]}
          aria-label="Rango de cotización"
        />
      </div>
      <ChartFrame title={`Evolución de la acción de ${ticker}`} summary={summary} height="md">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-default)' }}
              minTickGap={28}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => formatDecimal(v, 0)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border-default)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as Point
                return (
                  <ChartTooltipBox>
                    <p className="type-label m-0">{p.label}</p>
                    <p className="tnums m-0 mt-1 font-medium">US$ {formatDecimal(p.price, 2)}</p>
                  </ChartTooltipBox>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--data-gas)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--data-gas)', stroke: 'var(--data-gas)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}
