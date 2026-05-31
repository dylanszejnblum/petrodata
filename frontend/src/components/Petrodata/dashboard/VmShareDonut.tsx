'use client'

import { useTranslations } from 'next-intl'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { AnimatedCounter } from './AnimatedCounter'

export function VmShareDonut({ shareBoe }: { shareBoe: number }) {
  const t = useTranslations('dashboard.vmDonut')
  const pct = Math.max(0, Math.min(1, shareBoe))
  const conventional = 1 - pct
  const data = [
    { name: t('vmLegend'), value: pct, fill: 'var(--nd-success)' },
    { name: t('conventionalLegend'), value: conventional, fill: 'var(--nd-surface-raised)' },
  ]

  return (
    <div className="bg-nd-surface p-5 flex flex-col">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('title')}
      </span>

      <div className="relative mt-4 mx-auto" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={84}
              startAngle={90}
              endAngle={-270}
              stroke="var(--nd-surface)"
              strokeWidth={2}
              animationDuration={900}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="flex flex-col items-center">
            <AnimatedCounter
              to={pct * 100}
              kind="percent"
              className="text-nd-text-display text-3xl tabular-nums leading-none"
              style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
            />
            <span
              className="mt-1 text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('centerLabel')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] border-t border-nd-border pt-3">
        <LegendDot color="var(--nd-success)" label={t('vmLegend')} value={`${(pct * 100).toFixed(1)}%`} />
        <LegendDot
          color="var(--nd-surface-raised)"
          label={t('conventionalLegend')}
          value={`${(conventional * 100).toFixed(1)}%`}
          ring
        />
      </div>
    </div>
  )
}

function LegendDot({
  color,
  label,
  value,
  ring = false,
}: {
  color: string
  label: string
  value: string
  ring?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: ring ? 'inset 0 0 0 1px var(--nd-border)' : undefined,
        }}
        aria-hidden
      />
      <span
        className="text-nd-text-secondary"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-nd-text-display tabular-nums"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {value}
      </span>
    </div>
  )
}
