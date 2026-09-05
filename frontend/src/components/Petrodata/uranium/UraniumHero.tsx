'use client'

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { URANIUM } from './theme'
import { animateCounter } from './anim'
import type { HeroData } from './types'
import { formatDecimal } from '@/utilities/formatNumber'

export function UraniumHero({ data }: { data: HeroData }) {
  const t = useTranslations('uraniumHub')
  const locale = useLocale()
  const priceRef = useRef<HTMLSpanElement>(null)

  const price = data.price
  useEffect(() => {
    const el = priceRef.current
    if (!el || price == null) return
    const anim = animateCounter(el, price, {
      duration: 2000,
      format: (v) => `$${formatDecimal(v, locale)}`,
    })
    return () => {
      anim?.pause?.()
    }
  }, [price])

  const up = (data.changePct ?? 0) > 0
  const down = (data.changePct ?? 0) < 0
  const changeColor = up ? 'var(--nd-success)' : down ? 'var(--nd-error)' : 'var(--nd-text-disabled)'
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR')
  const monthFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const fmtMonth = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? (iso ?? '—') : monthFmt.format(d)
  }

  return (
    <section className="container pt-12 md:pt-20 pb-8 md:pb-10">
      <div className="flex items-center gap-3">
        <span
          className="grid size-7 place-items-center border text-[11px] font-mono"
          style={{ borderColor: URANIUM.teal, color: URANIUM.teal }}
          aria-hidden
        >
          U
        </span>
        <span className="text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary font-mono">
          {t('eyebrow')}
        </span>
      </div>

      <h1
        className="mt-5 text-balance text-6xl md:text-8xl leading-none text-nd-text-display font-display"
      >
        {t('title')}
      </h1>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span
          ref={priceRef}
          className="text-4xl md:text-5xl leading-none tabular-nums font-display"
          style={{ color: URANIUM.teal }}
        >
          {price == null ? '—' : `$${formatDecimal(price, locale)}`}
        </span>
        <span className="text-nd-text-disabled text-sm font-mono">{data.unit}</span>
        {data.changePct != null && (
          <span
            className="inline-flex items-center gap-1.5 text-sm tabular-nums font-mono"
            style={{ color: changeColor }}
          >
            {up ? <TrendingUp size={14} /> : down ? <TrendingDown size={14} /> : null}
            {up ? '+' : ''}
            {formatDecimal(data.changePct, locale, 2)}%
            {data.date && <span className="text-nd-text-disabled"> · {fmtMonth(data.date)}</span>}
          </span>
        )}
      </div>

      <div className="mt-5 h-px w-full max-w-2xl bg-nd-border" />

      <div className="mt-4 flex flex-col gap-1.5 text-sm text-nd-text-secondary font-mono">
        {data.low && data.high && (
          <span>
            {t('historicalRange', {
              low: `$${formatDecimal(data.low.value, locale)}`,
              lowDate: fmtMonth(data.low.date),
              high: `$${formatDecimal(data.high.value, locale)}`,
              highDate: fmtMonth(data.high.date),
            })}
          </span>
        )}
        {(data.resources != null || data.production != null) && (
          <span>
            {t('resourcesLine', {
              resources: data.resources != null ? nf.format(data.resources) : '—',
              production: data.production != null ? nf.format(data.production) : '—',
            })}
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <CtaLink href="#price-chart" label={t('ctaChart')} />
        <CtaLink href="#cycle" label={t('ctaCycle')} accent />
      </div>
    </section>
  )
}

function CtaLink({ href, label, accent = false }: { href: string; label: string; accent?: boolean }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-[0.08em] text-nd-text-display transition-colors font-mono hover:bg-nd-surface-raised"
      style={accent ? { borderColor: URANIUM.teal } : { borderColor: 'var(--nd-border-visible)' }}
    >
      {label}
      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}
