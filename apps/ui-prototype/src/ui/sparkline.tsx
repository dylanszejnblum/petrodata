'use client'

import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useMounted } from './chart-frame'

/* Sparkline única (fusión de las 2 de producción; gradientId por useId). */

export function Sparkline({
  data,
  color = 'var(--status-positive)',
  height = 32,
}: {
  data: { x: string; y: number }[]
  color?: string
  height?: number
}) {
  const uid = useId().replace(/:/g, '')
  const mounted = useMounted()
  if (!mounted || data.length === 0) return <div style={{ height }} className="w-full" />
  return (
    <div style={{ height }} className="w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${uid})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
