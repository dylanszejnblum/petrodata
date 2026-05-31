import React from 'react'

type StatCardProps = {
  label: string
  value: string | number
  unit?: string
  statusColor?: 'success' | 'warning' | 'accent' | 'neutral'
  subValue?: string
}

const statusColorMap = {
  success: 'var(--nd-success)',
  warning: 'var(--nd-warning)',
  accent: 'var(--nd-accent)',
  neutral: 'var(--nd-text-display)',
}

export function StatCard({ label, value, unit, statusColor = 'neutral', subValue }: StatCardProps) {
  return (
    <div className="p-6 border border-nd-border bg-nd-surface rounded-none">
      <span
        className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-3"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className="text-4xl md:text-5xl tracking-tight leading-none"
          style={{
            fontFamily: 'Doto, var(--font-space-mono)',
            color: statusColorMap[statusColor],
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-nd-text-secondary text-[11px] tracking-[0.06em] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {unit}
          </span>
        )}
      </div>
      {subValue && (
        <span
          className="text-nd-text-disabled text-xs mt-2 block"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {subValue}
        </span>
      )}
    </div>
  )
}
