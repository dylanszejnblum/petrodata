'use client'

// "What a day of Vaca Muerta is worth".
//
// Two figures, deliberately kept apart:
//  · the anchor — the gross production value the contribution endpoint actually
//    published for its trailing window (oil at Brent minus a quality discount,
//    gas at PIST, each month priced at that month's Brent);
//  · the scenario — what the oil alone would be worth at a Brent the reader
//    picks. Oil only: the published total cannot be split into oil and gas
//    client-side (the endpoint reports a simple Brent average, not the
//    production-weighted price it valued each month at), so re-pricing the whole
//    figure would be a fabrication.
//
// Both are gross: no operating costs, no taxes. Royalties are reported
// separately at the statutory rate.

import { useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

const MIN = 30
const MAX = 130
const ACCENT = '#3fb883'

export type DayValueInputs = {
  /** Barrels produced across the contribution window. */
  oilBbl: number
  /** Gross production value published for that window (oil + gas), in USD. */
  grossValueUsd: number
  /** Average Brent the endpoint reports for the window. */
  brentAvgUsd: number
  /** Quality discount applied to Brent, in USD/bbl. */
  oilDiscountUsd: number
  /** Months covered by the window, so the figures annualize honestly. */
  months: number
  gdpUsd: number | null
  gdpYear: number | null
  /** Live Brent, offered as a one-tap jump for the scenario. */
  brentSpotUsd: number | null
  breakevenUsd: number
}

export function DayValueCard({ inputs }: { inputs: DayValueInputs }) {
  const t = useTranslations('indicadores.dayValue')
  const locale = useLocale()
  const {
    oilBbl,
    grossValueUsd,
    brentAvgUsd,
    oilDiscountUsd,
    months,
    gdpUsd,
    gdpYear,
    brentSpotUsd,
    breakevenUsd,
  } = inputs

  const spot = brentSpotUsd != null ? Math.min(MAX, Math.max(MIN, brentSpotUsd)) : null
  const [price, setPrice] = useState(spot ?? Math.min(MAX, Math.max(MIN, brentAvgUsd)))
  const sliderId = useId()

  const nf = (v: number, decimals: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(v)

  // Anchor — published, annualized from the window's own length.
  const annualUsd = grossValueUsd * (12 / (months || 12))
  const perDay = annualUsd / 365 / 1_000_000
  const perYear = annualUsd / 1_000_000_000
  const gdpPct = gdpUsd ? (annualUsd / gdpUsd) * 100 : null

  // Scenario — the oil leg only, at the price the reader picks.
  const scenarioAnnualUsd = oilBbl * (price - oilDiscountUsd) * (12 / (months || 12))
  const scenarioPerYear = scenarioAnnualUsd / 1_000_000_000
  const scenarioPerDay = scenarioAnnualUsd / 365 / 1_000_000
  const margin = price - breakevenUsd

  return (
    <div className="flex flex-col gap-6 rounded-[10px] border border-nd-border bg-[linear-gradient(135deg,#16191d_0%,#20242a_55%,#2a2f36_100%)] p-6 md:p-7">
      {/* Anchor: what the last window actually produced in value */}
      <div>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em] font-mono"
          style={{ color: ACCENT }}
        >
          {t('label')}
        </span>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-4xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-white sm:text-5xl font-display">
            US$ {nf(perDay, 1)} M
          </span>
          <span className="text-sm text-white/50 font-mono">{t('perDay')}</span>
        </div>
        <p className="mt-3 text-sm tabular-nums text-white/70 font-sans">
          ≈ US$ {nf(perYear, 1)}B <span className="text-white/45">{t('perYear')}</span>
          {gdpPct != null && (
            <>
              {' · '}
              <span className="text-white/85">≈ {nf(gdpPct, 1)}%</span>{' '}
              <span className="text-white/45">
                {t('ofGdp')}
                {gdpYear ? ` ${gdpYear}` : ''}
              </span>
            </>
          )}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-white/40 font-mono">
          {t('anchorBasis', { months })}
        </p>
      </div>

      {/* Scenario: oil only, at a price the reader sets */}
      <div className="border-t border-white/10 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={sliderId}
            className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono"
          >
            {t('sliderLabel')}
          </label>
          <span className="text-lg font-semibold tabular-nums font-mono" style={{ color: ACCENT }}>
            US$ {nf(price, 1)}
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={MIN}
          max={MAX}
          step={0.5}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-3 w-full cursor-pointer"
          style={{ accentColor: ACCENT }}
        />
        <div className="mt-1.5 flex justify-between text-[9px] text-white/35 font-mono">
          <span>US$ {MIN}</span>
          <span>US$ {MAX}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {spot != null && (
            <PriceChip
              label={t('spotChip', { price: nf(spot, 1) })}
              active={Math.abs(price - spot) < 0.5}
              onClick={() => setPrice(spot)}
            />
          )}
          <PriceChip
            label={t('avgChip', { price: nf(brentAvgUsd, 1) })}
            active={Math.abs(price - brentAvgUsd) < 0.5}
            onClick={() => setPrice(brentAvgUsd)}
          />
        </div>

        {/* Subordinate to the anchor on purpose: the copy names it a what-if and
            the type stays small and dimmed, so it never reads as a second
            published total. */}
        <p className="mt-4 text-xs tabular-nums text-white/70 font-sans">
          <span className="text-white/45">{t('scenarioLabel')}</span>{' '}
          <span className="font-semibold text-white/80">US$ {nf(scenarioPerYear, 1)}B</span>{' '}
          <span className="text-white/45">
            {t('perYear')} · US$ {nf(scenarioPerDay, 1)}M {t('perDay')}
          </span>
        </p>
        <p className="mt-2 text-[11px] text-white/45 font-mono">
          {t('margin')}{' '}
          <span
            className="font-semibold"
            style={{ color: margin >= 0 ? ACCENT : 'var(--nd-accent)' }}
          >
            US$ {nf(margin, 1)}/bbl
          </span>
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-white/40 font-mono">
          {t('note', { discount: nf(oilDiscountUsd, 0), breakeven: nf(breakevenUsd, 0) })}
        </p>
      </div>
    </div>
  )
}

function PriceChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-2.5 py-1 text-[10px] tabular-nums transition-colors font-mono"
      style={{
        borderColor: active ? ACCENT : 'rgba(255,255,255,0.2)',
        color: active ? ACCENT : 'rgba(255,255,255,0.6)',
        background: active ? 'rgba(63,184,131,0.12)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}
