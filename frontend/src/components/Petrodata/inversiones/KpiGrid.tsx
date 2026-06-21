import { getTranslations } from 'next-intl/server'
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

function KpiCard({ kpi, sourceText }: { kpi: InvKpi; sourceText: string }) {
  return (
    <div className="flex flex-col gap-3 bg-nd-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {kpi.label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]"
          style={{
            color: tierColor(kpi.tier),
            background: `color-mix(in srgb, ${tierColor(kpi.tier)} 12%, transparent)`,
          }}
        >
          {tierLabel(kpi.tier)}
        </span>
      </div>

      <span className="text-3xl md:text-4xl leading-none tabular-nums text-nd-text-display font-display">
        {formatFigure(kpi.figure.value, kpi.format)}
      </span>

      {kpi.delta ? <DeltaChip delta={kpi.delta} /> : <span className="h-[22px]" />}

      <span className="mt-1 font-mono text-[10px] leading-relaxed text-nd-text-disabled">
        {sourceText}
      </span>
    </div>
  )
}

export async function KpiGrid({ kpis }: { kpis: InvKpi[] }) {
  if (!kpis.length) return null
  const t = await getTranslations('inversiones')
  return (
    <div className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          sourceText={t('computedBy', { source: `${kpi.source.label} · ${kpi.source.asOf}` })}
        />
      ))}
    </div>
  )
}
