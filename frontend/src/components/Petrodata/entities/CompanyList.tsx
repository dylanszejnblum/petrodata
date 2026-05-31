'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'

export type CompanyCard = {
  slug: string
  name: string
  origin: string
  projectCount: number
  commodities: string[]
}

export function CompanyList({ companies }: { companies: CompanyCard[] }) {
  const t = useTranslations('companies')
  const [q, setQ] = useState('')
  const [commodity, setCommodity] = useState('__all__')
  const [origin, setOrigin] = useState('__all__')

  const allCommodities = useMemo(
    () => [...new Set(companies.flatMap((c) => c.commodities))].sort(),
    [companies],
  )
  const allOrigins = useMemo(
    () => [...new Set(companies.map((c) => c.origin).filter(Boolean))].sort(),
    [companies],
  )

  const filtered = companies.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false
    if (commodity !== '__all__' && !c.commodities.includes(commodity)) return false
    if (origin !== '__all__' && c.origin !== origin) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-nd-text-disabled" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="w-full border border-nd-border bg-nd-surface py-2.5 pl-9 pr-3 text-sm text-nd-text-primary font-mono outline-none placeholder:text-nd-text-disabled focus:border-nd-border-visible"
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <Chips label={t('filterCommodity')} allLabel={t('all')} value={commodity} onChange={setCommodity} options={allCommodities} dot />
          <Chips label={t('filterOrigin')} allLabel={t('all')} value={origin} onChange={setOrigin} options={allOrigins} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/companies/${c.slug}`}
              className="group flex flex-col gap-3 bg-nd-surface p-5 transition-colors hover:bg-nd-surface-raised"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center border border-nd-border-visible font-display text-lg text-nd-text-display">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <span className="block truncate font-sans text-base leading-tight text-nd-text-display" title={c.name}>
                    {c.name}
                  </span>
                  {c.origin && (
                    <span className="text-[11px] uppercase tracking-[0.06em] text-nd-text-disabled font-mono">
                      {c.origin}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-nd-text-secondary font-mono tabular-nums">
                  {c.projectCount} {t('projects')}
                </span>
                <span className="flex items-center gap-1">
                  {c.commodities.slice(0, 5).map((m) => (
                    <span key={m} className="size-1.5 rounded-full" style={{ backgroundColor: commodityColor(m).color }} title={m} aria-hidden />
                  ))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Chips({
  label,
  allLabel,
  value,
  onChange,
  options,
  dot = false,
}: {
  label: string
  allLabel: string
  value: string
  onChange: (v: string) => void
  options: string[]
  dot?: boolean
}) {
  if (options.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">{label}</span>
      <Chip label={allLabel} active={value === '__all__'} onClick={() => onChange('__all__')} />
      {options.map((o) => (
        <Chip key={o} label={o} active={value === o} onClick={() => onChange(o)} dotColor={dot ? commodityColor(o).color : undefined} />
      ))}
    </div>
  )
}

function Chip({ label, active, onClick, dotColor }: { label: string; active: boolean; onClick: () => void; dotColor?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 border px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-mono transition-colors"
      style={{
        borderColor: active ? 'var(--nd-text-display)' : 'var(--nd-border)',
        backgroundColor: active ? 'var(--nd-text-display)' : 'transparent',
        color: active ? 'var(--nd-black)' : 'var(--nd-text-secondary)',
      }}
    >
      {dotColor && <span className="size-1.5 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden />}
      {label}
    </button>
  )
}
