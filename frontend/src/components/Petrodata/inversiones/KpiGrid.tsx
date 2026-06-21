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

function KpiCard({ kpi }: { kpi: InvKpi }) {
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

      <a
        href={kpi.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 font-mono text-[10px] leading-relaxed text-nd-text-disabled transition-colors hover:text-nd-text-secondary"
      >
        {kpi.source.label} · {kpi.source.asOf} ↗
      </a>
    </div>
  )
}

export function KpiGrid({ kpis }: { kpis: InvKpi[] }) {
  if (!kpis.length) return null
  return (
    <div className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
