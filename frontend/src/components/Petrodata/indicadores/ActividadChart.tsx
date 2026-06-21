'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMounted } from '@/hooks/useMounted'
import { formatCompact } from '@/utilities/formatNumber'
import type { InvActividad } from '@/api/inversiones'

type Row = { period: string; nuevosPozos: number; preliminary: boolean }

function fmtPeriod(period: string): string {
  const [y, m] = period.split('-')
  if (!m) return period
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${month} '${y.slice(2)}`
}

export function ActividadChart({ actividad }: { actividad: InvActividad }) {
  const mounted = useMounted()
  const rows: Row[] = actividad.points.map((p) => ({
    period: p.period,
    nuevosPozos: p.nuevosPozos,
    preliminary: p.preliminary,
  }))

  if (!rows.length) {
    return (
      <div className="flex h-[240px] items-center justify-center font-mono text-sm text-nd-text-disabled md:h-[300px]">
        Sin datos de actividad.
      </div>
    )
  }

  return (
    <div className="h-[240px] w-full md:h-[300px]">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--nd-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={fmtPeriod}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--nd-border)' }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => formatCompact(v as number)}
              tick={{ fill: 'var(--nd-text-disabled)', fontSize: 11, fontFamily: 'var(--font-space-mono)' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<ActividadTooltip />} cursor={{ fill: 'var(--nd-border)', fillOpacity: 0.3 }} />
            <Bar dataKey="nuevosPozos" isAnimationActive animationDuration={800}>
              {rows.map((r) => (
                <Cell
                  key={r.period}
                  fill="var(--nd-accent)"
                  fillOpacity={r.preliminary ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

type TooltipPayload = { value?: number; payload?: Row }

function ActividadTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="border border-nd-border bg-nd-surface/95 px-3 py-2 font-mono shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-4 border-b border-nd-border pb-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        <span>{fmtPeriod(row.period)}</span>
        {row.preliminary && <span style={{ color: 'var(--nd-accent)' }}>preliminar</span>}
      </div>
      <div className="text-[12px] tabular-nums text-nd-text-display">
        {new Intl.NumberFormat('es-AR').format(row.nuevosPozos)} pozos
      </div>
    </div>
  )
}
