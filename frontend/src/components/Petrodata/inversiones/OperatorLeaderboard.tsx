import type { InvOperador } from '@/api/inversiones'

export function OperatorLeaderboard({ operadores }: { operadores: InvOperador[] }) {
  if (!operadores.length) return null
  const top = operadores.slice(0, 8)
  const maxShare = Math.max(...top.map((o) => o.sharePct), 1)
  const nf = new Intl.NumberFormat('es-AR')

  return (
    <div className="flex flex-col">
      {top.map((op, i) => (
        <div
          key={op.slug}
          className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 border-b border-nd-border py-3"
        >
          <span className="font-mono text-[11px] tabular-nums text-nd-text-disabled">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate font-sans text-sm text-nd-text-display">{op.name}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-nd-text-secondary">
                {nf.format(Math.round(op.oilBblD))} bbl/d
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-nd-border">
              <div
                className="h-full"
                style={{
                  width: `${(op.sharePct / maxShare) * 100}%`,
                  background: 'var(--nd-accent)',
                }}
              />
            </div>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-nd-text-secondary">
            {op.sharePct.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
          </span>
        </div>
      ))}
    </div>
  )
}
