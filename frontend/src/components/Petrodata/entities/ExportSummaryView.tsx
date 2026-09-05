'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  animate,
  animateCounter,
  prefersReducedMotion,
  staggerIn,
  stagger,
  useInView,
  utils,
} from '@/components/Petrodata/uranium/anim'
import { formatCompact, formatPercent } from '@/utilities/formatNumber'
import { Link } from '@/i18n/navigation'

type SelectedSector = 'all' | 'petroleo' | 'gas' | 'mineria'

const SECTOR_COLORS: Record<string, string> = {
  petroleo: 'var(--nd-accent)',
  gas: '#0284c7',
  mineria: '#10b981',
}

const SECTOR_NAMES: Record<string, string> = {
  petroleo: 'Petróleo',
  gas: 'Gas',
  mineria: 'Minería',
}

function sectorColor(key: string): string {
  return SECTOR_COLORS[key] ?? 'var(--nd-accent)'
}

function sectorDisplayName(key: string): string {
  return SECTOR_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

export function ExportSummaryView({
  nationalTotal,
  bySector,
  provinces,
}: {
  nationalTotal: number
  bySector: { sector: string; value: number }[]
  provinces: { slug: string; name: string; total: number; bySector: Record<string, number> }[]
}) {
  const t = useTranslations('exportaciones')
  const locale = useLocale()
  const [selectedSector, setSelectedSector] = useState<SelectedSector>('all')

  const tabs: { id: SelectedSector; label: string }[] = [
    { id: 'all', label: t('tabs.all') },
    { id: 'petroleo', label: t('tabs.oil') },
    { id: 'gas', label: t('tabs.gas') },
    { id: 'mineria', label: t('tabs.mining') },
  ]

  const currentTotal = useMemo(() => {
    if (selectedSector === 'all') return nationalTotal
    return bySector
      .filter((s) => s.sector === selectedSector)
      .reduce((sum, s) => sum + s.value, 0)
  }, [selectedSector, nationalTotal, bySector])

  const provinceRows = useMemo(() => {
    return provinces
      .map((p) => {
        const value = selectedSector === 'all' ? p.total : p.bySector[selectedSector] ?? 0
        return { ...p, value }
      })
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [provinces, selectedSector])

  const maxProvinceValue = provinceRows.length ? provinceRows[0].value : 0

  const isEmpty = nationalTotal <= 0 && provinces.length === 0

  // ----- Total counter -----
  const totalView = useInView<HTMLDivElement>()
  const counterRef = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (!totalView.inView) return
    const el = counterRef.current
    if (!el) return
    const a = animateCounter(el, currentTotal, {
      duration: 2000,
      format: (v) => `$${formatCompact(v, locale)}`,
    })
    return () => {
      a?.pause?.()
    }
  }, [totalView.inView, currentTotal])

  // ----- Stacked sector bar -----
  const stackView = useInView<HTMLDivElement>()
  useEffect(() => {
    if (!stackView.inView) return
    const segs = stackView.ref.current?.querySelectorAll('.es-seg')
    if (!segs || !segs.length) return
    if (prefersReducedMotion()) {
      utils.set(Array.from(segs), { scaleX: 1 })
      return
    }
    animate(Array.from(segs), {
      scaleX: [0, 1],
      duration: 900,
      ease: 'outExpo',
      delay: stagger(90, { start: 120 }),
    })
  }, [stackView.inView, stackView.ref])

  // ----- Province bars -----
  const provView = useInView<HTMLDivElement>()
  useEffect(() => {
    if (!provView.inView) return
    const fills = provView.ref.current?.querySelectorAll('.es-prov-fill')
    if (!fills || !fills.length) return
    if (prefersReducedMotion()) {
      utils.set(Array.from(fills), { scaleX: 1 })
      return
    }
    animate(Array.from(fills), {
      scaleX: [0, 1],
      duration: 850,
      ease: 'outExpo',
      delay: stagger(55, { start: 120 }),
    })
    const rows = provView.ref.current?.querySelectorAll('.es-prov-row')
    if (rows && rows.length) staggerIn(Array.from(rows) as Element[], { y: 12, step: 55 })
    // Re-run when the active metric changes (rows are re-rendered).
  }, [provView.inView, provView.ref, selectedSector])

  if (isEmpty) {
    return (
      <div className="bg-nd-surface border border-nd-border p-10 text-center">
        <p className="font-sans text-nd-text-secondary">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {t('eyebrow')}
        </span>
        <h2 className="font-display text-nd-text-display tabular-nums text-2xl md:text-3xl leading-none">
          {t('title')}
        </h2>
        <p className="font-sans text-nd-text-secondary max-w-2xl">{t('blurb')}</p>
      </div>

      {/* Sector tab bar */}
      <div
        role="tablist"
        aria-label={t('bySector')}
        className="flex flex-wrap gap-px bg-nd-border border border-nd-border"
      >
        {tabs.map((tab) => {
          const active = tab.id === selectedSector
          const accent = tab.id === 'all' ? 'var(--nd-accent)' : sectorColor(tab.id)
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedSector(tab.id)}
              className="font-mono text-[11px] uppercase tracking-[0.08em] px-4 py-2.5 bg-nd-surface transition-colors hover:text-nd-text-display"
              style={
                active
                  ? { color: accent, borderBottom: `2px solid ${accent}` }
                  : { color: 'var(--nd-text-disabled, currentColor)', borderBottom: '2px solid transparent' }
              }
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Total counter */}
      <div ref={totalView.ref} className="bg-nd-surface border border-nd-border p-6 md:p-8">
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {t('total')}
        </span>
        <div className="mt-2">
          <span
            ref={counterRef}
            className="font-display text-nd-text-display tabular-nums text-4xl md:text-5xl leading-none"
          >
            {`$${formatCompact(currentTotal, locale)}`}
          </span>
        </div>
      </div>

      {/* By sector stacked bar */}
      <div className="flex flex-col gap-4">
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {t('bySector')}
        </span>
        <div ref={stackView.ref} className="flex flex-col gap-4">
          <div className="relative flex h-3 w-full overflow-hidden bg-nd-surface-raised" aria-hidden>
            {bySector.map((s) => {
              const widthPct = nationalTotal > 0 ? (s.value / nationalTotal) * 100 : 0
              const dim = selectedSector !== 'all' && selectedSector !== s.sector
              return (
                <div
                  key={s.sector}
                  className="es-seg h-full transition-opacity duration-300"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: sectorColor(s.sector),
                    transformOrigin: 'left',
                    transform: 'scaleX(0)',
                    opacity: dim ? 0.25 : 1,
                  }}
                />
              )
            })}
          </div>
          {/* Legend */}
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
            {bySector.map((s) => {
              const sharePct = nationalTotal > 0 ? s.value / nationalTotal : 0
              const dim = selectedSector !== 'all' && selectedSector !== s.sector
              return (
                <li
                  key={s.sector}
                  className="flex items-baseline gap-2 transition-opacity duration-300"
                  style={{ opacity: dim ? 0.4 : 1 }}
                >
                  <span
                    className="inline-block size-2 shrink-0 translate-y-px"
                    style={{ backgroundColor: sectorColor(s.sector) }}
                    aria-hidden
                  />
                  <span className="font-sans text-sm text-nd-text-secondary">
                    {sectorDisplayName(s.sector)}
                  </span>
                  <span className="font-mono text-sm text-nd-text-display tabular-nums">
                    ${formatCompact(s.value, locale)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled tabular-nums">
                    {formatPercent(sharePct, locale)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* By province */}
      <div className="flex flex-col gap-4">
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {t('byProvince')}
        </span>
        {provinceRows.length === 0 ? (
          <p className="font-sans text-nd-text-secondary">{t('noData')}</p>
        ) : (
          <div ref={provView.ref} className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-nd-border pb-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {t('columns.province')}
              </span>
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                  {t('columns.value')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled w-12 text-right">
                  {t('columns.share')}
                </span>
              </div>
            </div>
            {provinceRows.map((p) => {
              const widthPct = maxProvinceValue > 0 ? (p.value / maxProvinceValue) * 100 : 0
              const sharePct = currentTotal > 0 ? p.value / currentTotal : 0
              return (
                <div key={p.slug} className="es-prov-row flex flex-col gap-1.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/provincias/${p.slug}`}
                      className="font-sans text-sm text-nd-text-secondary hover:text-nd-text-display transition-colors"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-baseline gap-6">
                      <span className="font-mono text-sm text-nd-text-display tabular-nums">
                        ${formatCompact(p.value, locale)}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled tabular-nums w-12 text-right">
                        {formatPercent(sharePct, locale)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full bg-nd-surface-raised">
                    <div
                      className="es-prov-fill absolute inset-y-0 left-0"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: 'var(--nd-accent)',
                        transformOrigin: 'left',
                        transform: 'scaleX(0)',
                      }}
                      aria-hidden
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
