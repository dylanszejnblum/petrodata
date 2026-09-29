'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, ChartFrame, ChartTooltipBox, GRID_PROPS } from '@/ui/chart-frame'
import { formatDecimal } from '@/lib/format'

/* ChartFrame con un chart Recharts real usando las props tokenizadas
   AXIS_TICK / GRID_PROPS y el ChartTooltipBox. */

const DATA = [
  { mes: 'Ene', gas: 148.2 },
  { mes: 'Feb', gas: 151.9 },
  { mes: 'Mar', gas: 149.4 },
  { mes: 'Abr', gas: 158.7 },
  { mes: 'May', gas: 165.1 },
  { mes: 'Jun', gas: 171.8 },
  { mes: 'Jul', gas: 174.3 },
]

function TooltipDemo({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <ChartTooltipBox>
      <p className="type-label mb-0.5">{label} 2026</p>
      <p className="tnums font-medium text-body">{formatDecimal(payload[0].value, 1)} MMm³/d</p>
    </ChartTooltipBox>
  )
}

export function ChartFrameDemo() {
  return (
    <ChartFrame
      title="Producción de gas, enero a julio 2026"
      summary="Sube de 148,2 a 174,3 MMm³/d con un récord en julio."
      height="md"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DATA} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="mes" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} domain={[140, 180]} />
          <Tooltip content={<TooltipDemo />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Area
            type="monotone"
            dataKey="gas"
            stroke="var(--data-gas)"
            strokeWidth={1.75}
            fill="var(--data-gas)"
            fillOpacity={0.12}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
