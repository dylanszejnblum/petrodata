'use client'

// Economic contribution per operator: headline totals, then a ranked list with
// gross-value proportion bars (same grow-on-scroll treatment as the operator
// leaderboard) and a methodology footnote built from the API's assumptions.

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { ApiSchemas } from '@/api/client'
import { formatCompact, formatDecimal } from '@/utilities/formatNumber'
import { animate, prefersReducedMotion, useInView } from './anim'

type Contribution = ApiSchemas['OperatorContributionDto']

export function ContributionTable({ data }: { data: Contribution }) {
  const t = useTranslations('indicadores.contribution')
  const locale = useLocale()
  const usd = (v: number) => `US$ ${formatCompact(v, locale)}`
  const pct = (ratio: number, digits = 1) =>
    `${(ratio * 100).toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`

  const top = data.operators.slice(0, 8)
  const maxGross = Math.max(...top.map((o) => o.gross_value_usd), 1)

  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!inView || !top.length || prefersReducedMotion()) return
    const anims = barRefs.current.map((el, i) => {
      if (!el) return undefined
      const target = Number(el.dataset.pct ?? '0')
      el.style.width = '0%'
      return animate(el, { width: `${target}%`, duration: 900, delay: i * 80, ease: 'outCubic' })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  if (!data.operators.length) return null

  const totals = data.totals
  const a = data.assumptions
  const headline: Array<{ label: string; value: string; note?: string }> = [
    { label: t('grossValue'), value: usd(totals.gross_value_annualized_usd), note: t('annualizedNote') },
    ...(totals.value_share_of_gdp != null
      ? [{ label: t('ofGdp', { year: totals.gdp_year ?? '' }), value: pct(totals.value_share_of_gdp) }]
      : []),
    { label: t('royalties'), value: usd(totals.royalties_usd), note: t('windowNote', { months: data.window.months }) },
    ...(totals.energy_exports_usd != null
      ? [{ label: t('exports'), value: usd(totals.energy_exports_usd), note: t('windowNote', { months: data.window.months }) }]
      : []),
  ]

  return (
    <div ref={ref}>
      {/* Headline totals */}
      <div className="mb-8 grid grid-cols-2 gap-px bg-nd-border md:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label} className="bg-nd-surface p-4">
            <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
              {h.label}
            </span>
            <span className="mt-2 block font-mono text-xl tabular-nums text-nd-text-display md:text-2xl">
              {h.value}
            </span>
            {h.note ? (
              <span className="mt-1 block font-mono text-[10px] text-nd-text-disabled">{h.note}</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Ranked operators by gross production value */}
      <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_repeat(5,auto)] items-baseline gap-x-4 border-b border-nd-border pb-2 md:grid">
        <span />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colOperator')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colShare')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colValueShare')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colGross')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colRoyalties')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{t('colExports')}</span>
      </div>
      {top.map((op, i) => {
        const barPct = (op.gross_value_usd / maxGross) * 100
        const leader = i === 0
        return (
          <div
            key={op.operator_slug}
            className="group grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-nd-border py-3 transition-colors duration-200 hover:bg-nd-surface-raised/60 md:grid-cols-[1.5rem_minmax(0,1fr)_repeat(5,auto)]"
          >
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: leader ? 'var(--nd-accent)' : 'var(--nd-text-disabled)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <span
                className="block truncate font-sans text-sm text-nd-text-display"
                style={{ fontWeight: leader ? 600 : 400 }}
              >
                {op.operator_name}
              </span>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-nd-border">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={barPct}
                  className="h-full"
                  style={{ width: `${barPct}%`, background: 'var(--nd-accent)', opacity: leader ? 1 : 0.85 }}
                />
              </div>
            </div>
            <span className="hidden font-mono text-[11px] tabular-nums text-nd-text-secondary md:block">
              {pct(op.share_boe)}
            </span>
            <span className="hidden font-mono text-[11px] tabular-nums text-nd-text-secondary md:block">
              {pct(op.gross_value_usd / (totals.gross_value_usd || 1))}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-nd-text-display">
              {usd(op.gross_value_usd)}
            </span>
            <span className="hidden font-mono text-[11px] tabular-nums text-nd-text-secondary md:block">
              {usd(op.royalties_usd)}
            </span>
            <span className="hidden font-mono text-[11px] tabular-nums text-nd-text-secondary md:block">
              {op.attributed_exports_usd != null ? usd(op.attributed_exports_usd) : '—'}
            </span>
          </div>
        )
      })}

      {/* Methodology */}
      <p className="mt-4 max-w-3xl font-mono text-[11px] leading-relaxed text-nd-text-disabled">
        {t('methodology', {
          brent: a.brent_avg_usd_bbl != null ? formatDecimal(a.brent_avg_usd_bbl, locale, 1) : '—',
          discount: a.oil_discount_usd_bbl,
          pist: a.gas_pist_avg_usd_mmbtu != null ? formatDecimal(a.gas_pist_avg_usd_mmbtu, locale, 2) : '—',
          royalty: Math.round(a.royalty_rate * 100),
          from: data.window.from.slice(0, 7),
          to: data.window.to.slice(0, 7),
        })}
      </p>
    </div>
  )
}
