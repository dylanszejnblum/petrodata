'use client'

import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useMounted } from '@/hooks/useMounted'

export type SparkPoint = { x: string; y: number }

export function MiniSparkline({
  data,
  color = 'var(--nd-success)',
  height = 28,
}: {
  data: SparkPoint[]
  color?: string
  height?: number
}) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `mini-spark-${uid}`
  const mounted = useMounted()
  if (!data.length) return <div style={{ height }} />
  return (
    <div style={{ height }} className="w-full">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
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
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
