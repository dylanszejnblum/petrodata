'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMounted } from '@/hooks/useMounted'
import { formatCompact } from '@/utilities/formatNumber'
import type { InvSeriePoint } from '@/api/inversiones'

type Row = {
  period: string
  oil: number | null // confirmed segment
  oilPrelim: number | null // preliminary tail (dashed)
  raw: number
  preliminary: boolean
}

function buildRows(points: InvSeriePoint[]): Row[] {
  const firstPrelim = points.findIndex((p) => p.preliminary)
  return points.map((p, i) => {
    const isPrelim = p.preliminary
    // Connect the dashed tail to the last confirmed point.
    const connect = firstPrelim > 0 && i === firstPrelim - 1
    return {
      period: p.period,
      oil: isPrelim ? null : p.oilBblD,
      oilPrelim: isPrelim || connect ? p.oilBblD : null,
      raw: p.oilBblD,
      preliminary: isPrelim,
    }
  })
}

function fmtPeriod(period: string): string {
  // "2026-04" → "abr '26"
  const [y, m] = period.split('-')
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${month} '${y.slice(2)}`
}

export function RampChart({ points }: { points: InvSeriePoint[] }) {
  const mounted = useMounted()
  const rows = buildRows(points)
  const hasPrelim = points.some((p) => p.preliminary)

  if (!rows.length) {
    return (
      <div className="flex h-[280px] items-center justify-center font-mono text-sm text-nd-text-disabled md:h-[400px]">
        Sin datos de producción.
      </div>
    )
  }

  return (
    <div className="h-[280px] w-full md:h-[400px]">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="grad-oil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--nd-accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--nd-accent)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={fmtPeriod}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--nd-border)' }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v) => formatCompact(v as number)}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<RampTooltip />} cursor={{ stroke: 'var(--nd-border)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="oil"
              stroke="var(--nd-accent)"
              strokeWidth={1.5}
              fill="url(#grad-oil)"
              connectNulls={false}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="oilPrelim"
              stroke="var(--nd-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              fill="url(#grad-oil)"
              fillOpacity={0.4}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      {hasPrelim && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-disabled">
          <span className="mr-1 inline-block h-px w-4 align-middle" style={{ borderTop: '1px dashed var(--nd-accent)' }} />
          Dato preliminar (mes parcial)
        </p>
      )}
    </div>
  )
}

type TooltipPayload = { value?: number; payload?: Row }

function RampTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
}) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="border border-nd-border bg-nd-surface/95 px-3 py-2 font-mono shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-4 border-b border-nd-border pb-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        <span>{fmtPeriod(String(label))}</span>
        {row.preliminary && <span style={{ color: 'var(--nd-accent)' }}>preliminar</span>}
      </div>
      <div className="text-[12px] tabular-nums text-nd-text-display">
        {new Intl.NumberFormat('es-AR').format(Math.round(row.raw))} bbl/d
      </div>
    </div>
  )
}
