'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { api } from '@/api/client'
import { CompanyLogo } from './CompanyLogo'

export type CompanyCard = {
  slug: string
  name: string
  type: 'mining' | 'oil_and_gas' | 'both'
  sector: string
  logoUrl: string | null
  ticker: string | null
  exchange: string | null
  isPublic: boolean
  projectCount: number
  commodities: string[]
}

type Price = { price: number | null; changePct: number | null; exchange: string | null }

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function CompanyList({ companies }: { companies: CompanyCard[] }) {
  const t = useTranslations('companies')
  const [q, setQ] = useState('')
  const [onlyWells, setOnlyWells] = useState(true) // default: only companies with ≥1 well
  const [prices, setPrices] = useState<Record<string, Price>>({})

  // Live stock prices — fetched client-side, refreshed every 5 min.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const { data, error } = await api.GET('/api/v2/companies/prices', { cache: 'no-store' })
        if (!alive || error || !data) return
        const map: Record<string, Price> = {}
        for (const row of data.data) {
          map[row.slug] = {
            price: num(row.price),
            changePct: num(row.change_pct),
            exchange: typeof row.exchange === 'string' ? row.exchange : null,
          }
        }
        setPrices(map)
      } catch {
        /* keep prior */
      }
    }
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const filtered = useMemo(
    () =>
      companies.filter(
        (c) =>
          (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
          (!onlyWells || c.projectCount >= 1),
      ),
    [companies, q, onlyWells],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          role="switch"
          aria-checked={onlyWells}
          onClick={() => setOnlyWells((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary font-mono"
        >
          <span
            className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
            style={{ background: onlyWells ? 'var(--nd-accent)' : 'var(--nd-border)' }}
          >
            <span
              className="inline-block size-3 rounded-full bg-white transition-transform"
              style={{ transform: onlyWells ? 'translateX(14px)' : 'translateX(2px)' }}
            />
          </span>
          {t('withWells')}
        </button>
        <label className="relative block md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-nd-text-disabled" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="w-full border border-nd-border bg-nd-surface py-2.5 pl-9 pr-3 text-sm text-nd-text-primary font-mono outline-none placeholder:text-nd-text-disabled focus:border-nd-border-visible"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
      ) : (
        <div className="overflow-x-auto border border-nd-border bg-nd-surface">
          <table className="w-full text-[12px] font-mono">
            <thead>
              <tr className="bg-nd-surface-raised text-nd-text-secondary text-[10px] uppercase tracking-[0.08em]">
                <th className="w-px px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">{t('listEyebrow')}</th>
                <th className="px-5 py-3 text-left">{t('sector')}</th>
                <th className="px-5 py-3 text-right">{t('stats.projects')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nd-border">
              {filtered.map((c, i) => (
                <tr key={c.slug} className="transition-colors hover:bg-nd-surface-raised">
                  <td className="px-5 py-3 text-nd-text-disabled tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <CompanyLogo name={c.name} logoUrl={c.logoUrl} size="sm" />
                      <div className="flex flex-col items-start gap-1">
                        <Link href={`/companies/${c.slug}`} className="font-sans text-nd-text-display hover:underline">
                          {c.name}
                        </Link>
                        <CompanyBadge ticker={c.ticker} exchange={c.exchange} isPublic={c.isPublic} price={prices[c.slug]} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-nd-text-secondary">{typeLabel(c.type, t)}</td>
                  <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">{c.projectCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CTA — invite operators to get listed */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-nd-border bg-nd-surface px-4 py-3 text-sm text-nd-text-secondary font-sans">
        <span>{t('ctaWells')}</span>
        <a href="mailto:info@vacamuerta.io" className="text-nd-text-display underline underline-offset-2 hover:text-nd-accent">
          info@vacamuerta.io
        </a>
      </div>
    </div>
  )
}

function typeLabel(type: CompanyCard['type'], t: ReturnType<typeof useTranslations>): string {
  return type === 'mining' ? t('typeMining') : type === 'oil_and_gas' ? t('typeOil') : t('typeBoth')
}

// Badges shown under the company name. A listed company shows three separate
// chips — exchange, price, and % change (colored) — with the exchange also on
// hover; a private one shows a single "Private" tag.
function CompanyBadge({
  ticker,
  exchange,
  isPublic,
  price,
}: {
  ticker: string | null
  exchange: string | null
  isPublic: boolean
  price?: Price
}) {
  const t = useTranslations('companies')
  const badge = 'inline-flex items-center rounded-full border border-nd-border px-2 py-0.5 text-[10px] tabular-nums'
  const ex = price?.exchange ?? exchange

  // Listed with a live price → exchange + price + change, as separate chips.
  if (ticker && price && price.price != null) {
    const up = (price.changePct ?? 0) >= 0
    return (
      <div className="flex flex-wrap items-center gap-1">
        {ex ? (
          <span title={t('tradedOn', { exchange: ex })} className={`${badge} cursor-help text-nd-text-disabled`}>
            {ex}
          </span>
        ) : null}
        <span className={`${badge} text-nd-text-display`}>${price.price.toFixed(2)}</span>
        {price.changePct != null ? (
          <span className={`${badge} gap-0.5`} style={{ color: up ? 'var(--nd-success)' : 'var(--nd-accent)' }}>
            <span className="text-[7px] leading-none">{up ? '▲' : '▼'}</span>
            {Math.abs(price.changePct).toFixed(1)}%
          </span>
        ) : null}
      </div>
    )
  }

  // Listed but price not loaded yet → exchange chip only.
  if (ticker && ex) {
    return (
      <span title={t('tradedOn', { exchange: ex })} className={`${badge} cursor-help text-nd-text-disabled`}>
        {ex}
      </span>
    )
  }

  // Not listed → mark private when we know it's not public.
  if (!isPublic) {
    return <span className={`${badge} text-nd-text-disabled`}>{t('private')}</span>
  }

  return null
}

