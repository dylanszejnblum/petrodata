'use client'

// KPI grid for the investment-thesis page. Each figure ticks up from 0 when the
// grid scrolls into view (staggered), with a tier-coloured accent stripe that
// grows under hover. Mirrors the reduced-motion-safe pattern in UraniumStats.tsx:
// the final value renders in SSR/no-JS so the cards are always legible.

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { animateCounter, useInView } from './anim'
import type { InvKpi } from '@/api/inversiones'
import { formatDeltaPct, formatFigure, tierColor, tierLabel } from './format'

function DeltaChip({ delta }: { delta: NonNullable<InvKpi['delta']> }) {
  const positive = delta.pct >= 0
  const color = positive ? 'var(--nd-success)' : 'var(--nd-accent)'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums"
      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {formatDeltaPct(delta.pct)} {delta.base}
    </span>
  )
}

function KpiCard({
  kpi,
  sourceText,
  figureRef,
}: {
  kpi: InvKpi
  sourceText: string
  figureRef: (el: HTMLSpanElement | null) => void
}) {
  const accent = tierColor(kpi.tier)
  return (
    <div className="group relative flex flex-col gap-3 bg-nd-surface p-5 transition-colors duration-300 hover:bg-nd-surface-raised">
      {/* tier accent stripe — grows across the top on hover */}
      <span
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {kpi.label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]"
          style={{
            color: accent,
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
          }}
        >
          {tierLabel(kpi.tier)}
        </span>
      </div>

      <span
        ref={figureRef}
        className="text-3xl md:text-4xl leading-none tabular-nums text-nd-text-display font-display"
      >
        {formatFigure(kpi.figure.value, kpi.format)}
      </span>

      {kpi.delta ? <DeltaChip delta={kpi.delta} /> : <span className="h-[22px]" />}

      <span className="mt-1 font-mono text-[10px] leading-relaxed text-nd-text-disabled">
        {sourceText}
      </span>
    </div>
  )
}

export function KpiGrid({ kpis }: { kpis: InvKpi[] }) {
  const t = useTranslations('indicadores')
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 })
  const figureRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!inView || !kpis.length) return
    const anims = kpis.map((kpi, i) => {
      const el = figureRefs.current[i]
      if (!el) return undefined
      return animateCounter(el, kpi.figure.value, {
        duration: 1700,
        delay: i * 110,
        format: (v) => formatFigure(v, kpi.format),
      })
    })
    return () => anims.forEach((a) => a?.pause?.())
  }, [inView, kpis])

  if (!kpis.length) return null
  return (
    <div ref={ref} className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, i) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          sourceText={t('computedBy', { source: `${kpi.source.label} · ${kpi.source.asOf}` })}
          figureRef={(el) => {
            figureRefs.current[i] = el
          }}
        />
      ))}
    </div>
  )
}
