'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useMounted } from '@/hooks/useMounted'

export type SparkPoint = { x: string; y: number }

export function Sparkline({
  data,
  height = 36,
  color = 'var(--nd-success)',
  gradientId,
}: {
  data: SparkPoint[]
  height?: number
  color?: string
  gradientId: string
}) {
  const mounted = useMounted()
  if (!data.length) {
    return <div style={{ height }} className="w-full" />
  }
  return (
    <div style={{ height }} className="w-full">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
