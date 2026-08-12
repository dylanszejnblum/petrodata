'use client'

import { BarChart3, Droplet, FileText, LineChart } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'
import { useLocale } from 'next-intl'
import { useUnits } from '@/providers/Units'
import { GAS_UNIT_LABEL, gasValue } from '@/utilities/units'
import { formatPercent } from '@/utilities/formatNumber'

export type StatCardData = {
  label: string
  value: number
  /** "compact" → 174M, "integer" → 174,296,381, "percent" → 66.7%. */
  format: 'compact' | 'integer' | 'percent'
  unit?: string
  /** `value` is a MMcf/d gas figure — convert/relabel to the user's unit. */
  gas?: boolean
  /** Month-over-month change as a decimal (0.032 = +3.2%). null = no signal. */
  mom: number | null
  /** Bottom-left caption, e.g. "MAY 2026 · MoM" or "BOE". */
  footnote: string
  /** Key into ICONS — a component can't cross the server/client boundary. */
  icon: keyof typeof ICONS
  accent: string
}

const ICONS = { line: LineChart, droplet: Droplet, bars: BarChart3, doc: FileText }

export function HeroCards({ cards }: { cards: StatCardData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <HeroCard key={c.label} card={c} />
      ))}
    </div>
  )
}

function HeroCard({ card }: { card: StatCardData }) {
  const locale = useLocale()
  const { gasUnit } = useUnits()
  const value = card.gas ? gasValue(card.value, gasUnit) : card.value
  const unit = card.gas ? GAS_UNIT_LABEL[gasUnit] : card.unit
  const Icon = ICONS[card.icon]
  const isUp = (card.mom ?? 0) > 0
  const isDown = (card.mom ?? 0) < 0
  const momLabel = formatMoM(card.mom, locale)

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-[10px] border border-nd-border bg-nd-surface p-5">
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: card.accent }} />
        <span className="text-nd-text-secondary text-[10px] uppercase tracking-[0.08em] font-mono">
          {card.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <AnimatedCounter
          to={value}
          kind={card.format}
          className="text-nd-text-display text-3xl md:text-4xl leading-none tabular-nums font-display"
        />
        {unit && <span className="text-nd-text-disabled text-[11px] font-mono">{unit}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono">
          {card.footnote}
        </span>
        {momLabel && (
          <span
            className="text-[11px] tabular-nums font-mono"
            style={{ color: isUp ? 'var(--nd-success)' : 'var(--nd-accent)' }}
          >
            {isUp ? '▲' : isDown ? '▼' : ''} {momLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function formatMoM(mom: number | null, locale: string): string | null {
  if (mom == null || !Number.isFinite(mom)) return null
  return formatPercent(Math.abs(mom), locale)
}
