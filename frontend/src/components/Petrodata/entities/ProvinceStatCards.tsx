'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatPercent } from '@/utilities/formatNumber'
import { useUnits } from '@/providers/Units'
import { GAS_UNIT_LABEL, formatGas } from '@/utilities/units'

export type ProvinceStats = {
  oilBblD: number
  gasMmcfD: number
  vmPct: number
  /** Year-over-year change (fraction), null when there is no 13th month back. */
  oilYoy: number | null
  gasYoy: number | null
  asOf: string | null
}

const OIL = '#3fb883'
const GAS = '#38b6b6'
const VM = '#e2703f'

export function ProvinceStatCards({ stats }: { stats: ProvinceStats }) {
  const t = useTranslations('provinces')
  const locale = useLocale()
  const { gasUnit } = useUnits()
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    maximumFractionDigits: 0,
  })
  const nf1 = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    maximumFractionDigits: 1,
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        locale={locale}
        accent={OIL}
        label={t('oilProduction')}
        value={nf.format(stats.oilBblD)}
        unit="bbl/d"
        sublabel={stats.asOf}
        delta={stats.oilYoy}
      />
      <Card
        locale={locale}
        accent={GAS}
        label={t('gasProduction')}
        value={formatGas(stats.gasMmcfD, gasUnit, locale)}
        unit={GAS_UNIT_LABEL[gasUnit]}
        sublabel={stats.asOf}
        delta={stats.gasYoy}
      />
      <Card
        locale={locale}
        accent={VM}
        label={t('vmShare')}
        value={nf1.format(stats.vmPct * 100)}
        unit="%"
        sublabel={t('ofFormation')}
        delta={null}
      />
    </div>
  )
}

function Card({
  accent,
  label,
  value,
  unit,
  sublabel,
  delta,
  locale,
}: {
  accent: string
  label: string
  value: string
  unit: string
  sublabel: string | null
  delta: number | null
  locale: string
}) {
  const t = useTranslations('provinces')
  const up = (delta ?? 0) >= 0

  return (
    <div className="flex min-h-36 flex-col justify-between gap-4 rounded-[10px] border border-nd-border bg-nd-surface p-5">
      <div className="flex items-center gap-2">
        <span
          className="size-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px 1px ${accent}` }}
          aria-hidden
        />
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-nd-text-disabled font-mono">
          {label}
        </span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold leading-none tabular-nums text-nd-text-display font-display">
            {value}
          </span>
          <span className="text-[11px] text-nd-text-disabled font-mono">{unit}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.1em] text-nd-text-disabled font-mono">
            {sublabel}
          </span>
          {delta != null && (
            <span
              className="text-[11px] font-semibold tabular-nums font-mono"
              style={{ color: up ? 'var(--nd-success)' : 'var(--nd-accent)' }}
              title={t('yoy')}
            >
              {up ? '▲' : '▼'} {formatPercent(Math.abs(delta), locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
