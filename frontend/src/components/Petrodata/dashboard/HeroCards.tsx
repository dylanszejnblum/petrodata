'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'
import { MiniSparkline, type SparkPoint } from './Sparkline'

export type StatCardData = {
  label: string
  value: number
  /** "compact" → 174M, "integer" → 174,296,381, "percent" → 66.7%. */
  format: 'compact' | 'integer' | 'percent'
  unit?: string
  /** Month-over-month change as a decimal (0.032 = +3.2%). null = no signal. */
  mom: number | null
  /** Translated suffix for the MoM badge (e.g. "MoM"). */
  momSuffix: string
  sparkline: SparkPoint[]
  accent: string
}

export function HeroCards({ cards }: { cards: StatCardData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border">
      {cards.map((c) => (
        <HeroCard key={c.label} card={c} />
      ))}
    </div>
  )
}

function HeroCard({ card }: { card: StatCardData }) {
  const momLabel = formatMoM(card.mom, card.momSuffix)
  const isUp = (card.mom ?? 0) > 0
  const isDown = (card.mom ?? 0) < 0
  const trendColor = isUp
    ? 'var(--nd-success)'
    : isDown
      ? 'var(--nd-warning)'
      : 'var(--nd-text-disabled)'

  return (
    <div className="bg-nd-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {card.label}
        </span>
        {momLabel && (
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums"
            style={{ fontFamily: 'var(--font-space-mono)', color: trendColor }}
          >
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : null}
            {momLabel}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <AnimatedCounter
          to={card.value}
          kind={card.format}
          className="text-nd-text-display text-3xl md:text-4xl leading-none tabular-nums"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        />
        {card.unit && (
          <span
            className="text-nd-text-disabled text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {card.unit}
          </span>
        )}
      </div>
      <MiniSparkline data={card.sparkline} color={card.accent} height={28} />
    </div>
  )
}

function formatMoM(mom: number | null, suffix: string): string | null {
  if (mom == null || !Number.isFinite(mom)) return null
  const pct = mom * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}% ${suffix}`
}
