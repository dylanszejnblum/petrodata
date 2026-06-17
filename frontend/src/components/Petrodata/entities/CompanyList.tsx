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
    () => companies.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase())),
    [companies, q],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
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
                <th className="px-5 py-3 text-right">{t('stock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nd-border">
              {filtered.map((c, i) => (
                <tr key={c.slug} className="transition-colors hover:bg-nd-surface-raised">
                  <td className="px-5 py-3 text-nd-text-disabled tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3">
                    <Link href={`/companies/${c.slug}`} className="inline-flex items-center gap-3 text-nd-text-display hover:underline">
                      <CompanyLogo name={c.name} logoUrl={c.logoUrl} size="sm" />
                      <span className="font-sans">{c.name}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-nd-text-secondary">{typeLabel(c.type, t)}</td>
                  <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">{c.projectCount}</td>
                  <td className="px-5 py-3 text-right">
                    <StockCell ticker={c.ticker} exchange={c.exchange} price={prices[c.slug]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function typeLabel(type: CompanyCard['type'], t: ReturnType<typeof useTranslations>): string {
  return type === 'mining' ? t('typeMining') : type === 'oil_and_gas' ? t('typeOil') : t('typeBoth')
}

function StockCell({ ticker, exchange, price }: { ticker: string | null; exchange: string | null; price?: Price }) {
  if (!ticker) return <span className="text-nd-text-disabled">—</span>
  if (!price || price.price == null) {
    return <span className="text-nd-text-disabled">{exchange ?? ticker}</span>
  }
  const up = (price.changePct ?? 0) >= 0
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums" style={{ color: up ? 'var(--nd-success)' : 'var(--nd-accent)' }}>
      <span className="text-nd-text-disabled">{price.exchange ?? exchange}</span>
      ${price.price.toFixed(2)}
      {price.changePct != null && (
        <>
          {up ? '▲' : '▼'} {Math.abs(price.changePct).toFixed(1)}%
        </>
      )}
    </span>
  )
}

