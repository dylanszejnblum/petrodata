import { getTranslations } from 'next-intl/server'
import type { InvBreakeven } from '@/api/inversiones'

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** Brent (measured) vs a cited breakeven reference. The gap is the headroom. */
export async function BreakevenGauge({ breakeven }: { breakeven: InvBreakeven }) {
  const t = await getTranslations('inversiones')
  const { brentUsd, referenceUsd, headroomUsd } = breakeven
  const scaleMax = Math.max(brentUsd, referenceUsd) * 1.15
  const brentPct = (brentUsd / scaleMax) * 100
  const refPct = (referenceUsd / scaleMax) * 100

  return (
    <div className="flex flex-col gap-4 bg-nd-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            Headroom sobre breakeven
          </span>
          <span className="mt-1 block text-3xl tabular-nums text-nd-text-display md:text-4xl font-display">
            US${nf0.format(Math.round(headroomUsd))}
            <span className="ml-1 text-base text-nd-text-secondary">/bbl</span>
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]"
          style={{ color: 'var(--nd-success)', background: 'color-mix(in srgb, var(--nd-success) 12%, transparent)' }}
        >
          Confirmado
        </span>
      </div>

      {/* gauge track */}
      <div className="relative h-2 w-full bg-nd-border">
        {/* reference marker */}
        <div
          className="absolute top-[-4px] bottom-[-4px] w-px bg-nd-text-disabled"
          style={{ left: `${refPct}%` }}
          aria-hidden
        />
        {/* brent fill */}
        <div className="absolute inset-y-0 left-0" style={{ width: `${brentPct}%`, background: 'var(--nd-accent)' }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
        <span className="text-nd-text-secondary">
          <span className="inline-block size-2 rounded-full align-middle" style={{ background: 'var(--nd-accent)' }} />{' '}
          Brent US${nf0.format(Math.round(brentUsd))} · {breakeven.source.asOf}
        </span>
        <span className="text-nd-text-disabled">
          Ref. US${nf0.format(referenceUsd)} — {breakeven.referenceSource.label}
        </span>
      </div>

      <span className="font-mono text-[10px] text-nd-text-disabled">
        {t('computedBy', { source: `${breakeven.source.label} · ${breakeven.source.asOf}` })}
      </span>
    </div>
  )
}
