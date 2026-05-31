import React from 'react'

type StatusColor = 'success' | 'warning' | 'accent' | 'neutral'

const statusColorMap: Record<StatusColor, string> = {
  success: 'var(--nd-success)',
  warning: 'var(--nd-warning)',
  accent: 'var(--nd-accent)',
  neutral: 'var(--nd-text-display)',
}

export function SegmentedProgressBar({
  value,
  max,
  color = 'neutral',
  height = 8,
  segments = 20,
}: {
  value: number
  max: number
  color?: StatusColor
  height?: number
  segments?: number
}) {
  const filledCount = Math.round((value / max) * segments)
  const isOverflow = value > max

  return (
    <div className="flex gap-0.5 w-full" style={{ height }}>
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled = i < filledCount
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              backgroundColor: isFilled
                ? isOverflow
                  ? 'var(--nd-accent)'
                  : statusColorMap[color]
                : 'var(--nd-border)',
            }}
          />
        )
      })}
    </div>
  )
}
