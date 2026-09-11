'use client'

// Economic contribution per operator: headline totals, then a ranked list with
// gross-value proportion bars (same grow-on-scroll treatment as the operator
// leaderboard) and a methodology footnote built from the API's assumptions.

import { useEffect, useRef } from 'react'
import { useTranslations } from '../_lib/messages'
import { formatCompact } from '../_lib/formatNumber'
import { animate, prefersReducedMotion, useInView } from '../_lib/anim'

import type { Contribution } from '../_lib/types'

const usd = (v: number) => `US$ ${formatCompact(v)}`
const pct = (ratio: number, digits = 1) =>
  `${(ratio * 100).toLocaleString('es-AR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`

export function ContributionTable({ data }: { data: Contribution }) {
  const t = useTranslations('indicadores.contribution')
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
    { label: t('grossValue'), value: usd(totals.gross_value_annualized_usd), note: t('annualizedNote', { brent: a.brent_avg_usd_bbl != null ? a.brent_avg_usd_bbl.toFixed(1).replace('.', ',') : '—' }) },
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
      <div className="mb-8 grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label} className="bg-surface p-4">
            <span className="type-label block">
              {h.label}
            </span>
            <span className="type-kpi mt-2 block text-xl md:text-2xl">
              {h.value}
            </span>
            {h.note ? (
              <span className="mt-1 block text-[10px] text-tertiary">{h.note}</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Ranked operators by gross production value.
          COLUMNAS FIJAS compartidas entre header y filas (corrección de
          Mariano, 2026-08-08): con repeat(5,auto) cada grilla calculaba
          anchos distintos y nada quedaba alineado. Números y sus títulos
          alineados a la derecha. */}
      <div className="row-bleed hidden grid-cols-[1.5rem_minmax(0,1fr)_5rem_5rem_6rem_6rem_7rem] items-baseline gap-x-4 border-b pb-2 md:grid">
        <span />
        <span className="type-label">{t('colOperator')}</span>
        <span className="type-label text-right">{t('colShare')}</span>
        <span className="type-label text-right">{t('colValueShare')}</span>
        <span className="type-label text-right">{t('colGross')}</span>
        <span className="type-label text-right">{t('colRoyalties')}</span>
        <span className="type-label text-right">{t('colExports')}</span>
      </div>
      {top.map((op, i) => {
        const barPct = (op.gross_value_usd / maxGross) * 100
        const leader = i === 0
        return (
          <div
            key={op.operator_slug}
            className="row-bleed group grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60 md:grid-cols-[1.5rem_minmax(0,1fr)_5rem_5rem_6rem_6rem_7rem]"
          >
            <span
              className="text-[11px] tnums"
              style={{ color: leader ? 'var(--data-oil)' : 'var(--text-tertiary)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <span
                className="block truncate text-sm text-primary"
                style={{ fontWeight: leader ? 600 : 400 }}
              >
                {op.operator_name}
              </span>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={barPct}
                  className="h-full rounded-full"
                  style={{ width: `${barPct}%`, background: 'var(--data-oil)', opacity: leader ? 1 : 0.85 }}
                />
              </div>
            </div>
            <span className="hidden text-right text-[11px] tnums text-secondary md:block">
              {pct(op.share_boe)}
            </span>
            <span className="hidden text-right text-[11px] tnums text-secondary md:block">
              {pct(op.gross_value_usd / (totals.gross_value_usd || 1))}
            </span>
            <span className="text-right text-[11px] tnums text-primary">
              {usd(op.gross_value_usd)}
            </span>
            <span className="hidden text-right text-[11px] tnums text-secondary md:block">
              {usd(op.royalties_usd)}
            </span>
            <span className="hidden text-right text-[11px] tnums text-secondary md:block">
              {op.attributed_exports_usd != null ? usd(op.attributed_exports_usd) : '—'}
            </span>
          </div>
        )
      })}

      {/* Methodology */}
      <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-tertiary">
        {t('methodology', {
          brent: a.brent_avg_usd_bbl != null ? a.brent_avg_usd_bbl.toFixed(1) : '—',
          discount: a.oil_discount_usd_bbl,
          pist: a.gas_pist_avg_usd_mmbtu != null ? a.gas_pist_avg_usd_mmbtu.toFixed(2) : '—',
          royalty: Math.round(a.royalty_rate * 100),
          from: data.window.from.slice(0, 7),
          to: data.window.to.slice(0, 7),
        })}
      </p>
    </div>
  )
}
