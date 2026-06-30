'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { OperatorAvatar } from '@/components/Petrodata/map/OperatorAvatar'
import { CompanyLink } from '@/components/Petrodata/entities/CompanyLink'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'
import { formatCompact } from '@/utilities/formatNumber'
import { track } from '@/utilities/analytics'
import { staggerIn, useInView } from '@/components/Petrodata/uranium/anim'

type OilGas = {
  oilBblD: number
  gasMmcfD: number
  wells: number
  vmPct: number
  topOperators: { slug: string; name: string; boe: number }[]
}

type Mining = {
  projectCount: number
  commodities: string[]
  projects: {
    name: string
    commodity: string
    status: string
    company: string
    companySlug: string | null
    lat: number
    lng: number
  }[]
}

type ExportRow = { sector: string; product: string; value: number }

export type ProvinceSectorTabsProps = {
  oilGas: OilGas | null
  mining: Mining | null
  exports: ExportRow[]
}

type TabKey = 'oil' | 'gas' | 'mining' | 'exports'

export function ProvinceSectorTabs({ oilGas, mining, exports }: ProvinceSectorTabsProps) {
  const t = useTranslations('provinces')

  const tabs = useMemo(() => {
    const out: { key: TabKey; label: string }[] = []
    if (oilGas) {
      out.push({ key: 'oil', label: t('tabs.oil') })
      out.push({ key: 'gas', label: t('tabs.gas') })
    }
    if (mining) out.push({ key: 'mining', label: t('tabs.mining') })
    if (exports.length) out.push({ key: 'exports', label: t('tabs.exports') })
    return out
  }, [oilGas, mining, exports.length, t])

  const [active, setActive] = useState<TabKey>(tabs[0]?.key ?? 'oil')

  // Keep the active tab valid if the available set shifts.
  useEffect(() => {
    if (!tabs.some((tab) => tab.key === active)) {
      setActive(tabs[0]?.key ?? 'oil')
    }
  }, [tabs, active])

  const { ref, inView } = useInView<HTMLDivElement>()
  const panelRef = useRef<HTMLDivElement>(null)

  // Stagger the visible panel's direct content rows on view / tab switch.
  useEffect(() => {
    if (!inView) return
    const el = panelRef.current
    if (!el) return
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-stagger]'))
    if (targets.length) staggerIn(targets, { y: 12, step: 60 })
  }, [inView, active])

  if (tabs.length === 0) {
    return (
      <div className="bg-nd-surface border border-nd-border p-6 font-sans text-sm text-nd-text-secondary">
        {t('noSectorData')}
      </div>
    )
  }

  return (
    <div ref={ref} className="bg-nd-surface border border-nd-border">
      {/* Tab bar */}
      <div role="tablist" aria-label={t('exportProfile')} className="flex flex-wrap border-b border-nd-border">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              id={`province-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`province-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                track('province_tab_change', { tab: tab.key })
                setActive(tab.key)
              }}
              className={[
                'relative px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--nd-accent)]',
                isActive ? 'text-nd-text-display' : 'text-nd-text-disabled hover:text-nd-text-secondary',
              ].join(' ')}
            >
              {tab.label}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-[-1px] h-[2px] transition-opacity"
                style={{ backgroundColor: 'var(--nd-accent)', opacity: isActive ? 1 : 0 }}
              />
            </button>
          )
        })}
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={`province-panel-${active}`}
        aria-labelledby={`province-tab-${active}`}
        className="p-5 sm:p-6"
      >
        {active === 'oil' && oilGas && <OilPanel data={oilGas} />}
        {active === 'gas' && oilGas && <GasPanel data={oilGas} />}
        {active === 'mining' && mining && <MiningPanel data={mining} />}
        {active === 'exports' && exports.length > 0 && <ExportsPanel rows={exports} />}
      </div>
    </div>
  )
}

/* ----------------------------- shared pieces ----------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">{children}</div>
  )
}

function BigNumber({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-3xl sm:text-4xl text-nd-text-display tabular-nums">
          {formatCompact(value)}
        </span>
        <span className="font-mono text-xs text-nd-text-disabled">{unit}</span>
      </div>
    </div>
  )
}

function TopOperators({ operators }: { operators: OilGas['topOperators'] }) {
  const t = useTranslations('provinces')
  const max = Math.max(1, ...operators.map((o) => o.boe))

  if (operators.length === 0) return null

  return (
    <div data-stagger>
      <Eyebrow>{t('topOperators')}</Eyebrow>
      <ul className="mt-3 flex flex-col gap-3">
        {operators.map((op) => {
          const ratio = Math.max(0, Math.min(1, op.boe / max))
          return (
            <li key={op.slug} className="flex items-center gap-3">
              <OperatorAvatar slug={op.slug} name={op.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/map?operator=${encodeURIComponent(op.slug)}`}
                    className="truncate font-sans text-sm text-nd-text-secondary transition-colors hover:text-nd-text-display hover:underline"
                  >
                    {op.name}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-nd-text-disabled tabular-nums">
                    {formatCompact(op.boe)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-nd-surface-raised">
                  <div
                    className="h-full origin-left"
                    style={{
                      backgroundColor: 'var(--nd-accent)',
                      transform: `scaleX(${ratio})`,
                      transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------- oil panel ------------------------------- */

function OilPanel({ data }: { data: OilGas }) {
  const t = useTranslations('provinces')
  const vm = Math.max(0, Math.min(100, data.vmPct))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-5" data-stagger>
          <BigNumber label={t('oilProduction')} value={data.oilBblD} unit="bbl/d" />
          <div>
            <Eyebrow>{t('activeWells')}</Eyebrow>
            <div className="mt-1 font-mono text-xl text-nd-text-display tabular-nums">
              {formatCompact(data.wells)}
            </div>
          </div>
        </div>

        {/* VM share bar */}
        <div className="flex flex-col justify-center gap-2" data-stagger>
          <div className="flex items-baseline justify-between">
            <Eyebrow>{t('vmShare')}</Eyebrow>
            <span className="font-mono text-sm text-nd-text-display tabular-nums">{vm.toFixed(0)}%</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden bg-nd-surface-raised">
            <div
              className="h-full origin-left"
              style={{
                width: `${vm}%`,
                backgroundColor: 'var(--nd-accent)',
              }}
              aria-hidden
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2" style={{ backgroundColor: 'var(--nd-accent)' }} aria-hidden />
              {t('vmShort')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 bg-nd-surface-raised border border-nd-border" aria-hidden />
              {t('conventional')}
            </span>
          </div>
        </div>
      </div>

      <TopOperators operators={data.topOperators} />
    </div>
  )
}

/* ------------------------------- gas panel ------------------------------- */

function GasPanel({ data }: { data: OilGas }) {
  const t = useTranslations('provinces')
  return (
    <div className="flex flex-col gap-6">
      <div data-stagger>
        <BigNumber label={t('gasProduction')} value={data.gasMmcfD} unit="MMcf/d" />
      </div>
      <TopOperators operators={data.topOperators} />
    </div>
  )
}

/* ----------------------------- mining panel ------------------------------ */

function MiningPanel({ data }: { data: Mining }) {
  const t = useTranslations('provinces')
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4" data-stagger>
        <div>
          <Eyebrow>{t('stats.projects')}</Eyebrow>
          <div className="mt-1 font-display text-3xl text-nd-text-display tabular-nums">
            {formatCompact(data.projectCount)}
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {data.commodities.map((c) => {
            const { color } = commodityColor(c)
            return (
              <li
                key={c}
                className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary"
              >
                <span className="inline-block h-2 w-2" style={{ backgroundColor: color }} aria-hidden />
                {c}
              </li>
            )
          })}
        </ul>
      </div>

      {data.projects.length > 0 ? (
        <div className="overflow-x-auto" data-stagger>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-nd-border font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                <th className="py-2 pr-3 font-normal">{t('table.columns.project')}</th>
                <th className="py-2 pr-3 font-normal">{t('table.columns.commodity')}</th>
                <th className="py-2 pr-3 font-normal">{t('table.columns.status')}</th>
                <th className="py-2 font-normal">{t('table.columns.company')}</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p, i) => {
                const { color } = commodityColor(p.commodity)
                return (
                  <tr key={`${p.name}-${i}`} className="border-b border-nd-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-sans text-sm text-nd-text-display">{p.name}</td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-1.5 font-mono text-xs text-nd-text-secondary">
                        <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: color }} aria-hidden />
                        {p.commodity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs uppercase tracking-[0.04em] text-nd-text-disabled">
                      {p.status}
                    </td>
                    <td className="py-2.5 font-sans text-sm">
                      {p.companySlug ? (
                        <Link
                          href={`/companies/${p.companySlug}`}
                          className="text-nd-text-secondary transition-colors hover:text-nd-text-display hover:underline"
                        >
                          {p.company}
                        </Link>
                      ) : (
                        <CompanyLink name={p.company} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-sm text-nd-text-secondary" data-stagger>
          {t('noSectorData')}
        </p>
      )}
    </div>
  )
}

/* ---------------------------- exports panel ------------------------------ */

function ExportsPanel({ rows }: { rows: ExportRow[] }) {
  const t = useTranslations('provinces')
  const sorted = useMemo(() => [...rows].sort((a, b) => b.value - a.value), [rows])
  const total = useMemo(() => sorted.reduce((sum, r) => sum + r.value, 0), [sorted])

  return (
    <div className="flex flex-col gap-4">
      <div data-stagger>
        <Eyebrow>{t('exportProfile')}</Eyebrow>
      </div>
      <div className="overflow-x-auto" data-stagger>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-nd-border font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
              <th className="py-2 pr-3 font-normal">{t('exportColumns.sector')}</th>
              <th className="py-2 pr-3 font-normal">{t('exportColumns.product')}</th>
              <th className="py-2 pr-3 text-right font-normal">{t('exportColumns.value')}</th>
              <th className="py-2 text-right font-normal">{t('exportColumns.share')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const share = total > 0 ? (r.value / total) * 100 : 0
              return (
                <tr key={`${r.sector}-${r.product}-${i}`} className="border-b border-nd-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-mono text-xs uppercase tracking-[0.04em] text-nd-text-disabled">
                    {r.sector}
                  </td>
                  <td className="py-2.5 pr-3 font-sans text-sm text-nd-text-display">{r.product}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-sm text-nd-text-secondary tabular-nums">
                    {`$${formatCompact(r.value)}`}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-nd-text-secondary tabular-nums">
                    {`${share.toFixed(1)}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
