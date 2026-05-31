'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { commodityColor } from '@/components/Petrodata/minerals/commodityColors'

export type ProvinceCard = {
  slug: string
  name: string
  projectCount: number
  commodities: string[]
}

export function ProvinceList({ provinces }: { provinces: ProvinceCard[] }) {
  const t = useTranslations('provinces')
  const [commodity, setCommodity] = useState('__all__')

  const allCommodities = useMemo(
    () => [...new Set(provinces.flatMap((p) => p.commodities))].sort(),
    [provinces],
  )
  const filtered =
    commodity === '__all__' ? provinces : provinces.filter((p) => p.commodities.includes(commodity))

  return (
    <div className="flex flex-col gap-6">
      {allCommodities.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {t('filterCommodity')}
          </span>
          <Chip label={t('all')} active={commodity === '__all__'} onClick={() => setCommodity('__all__')} />
          {allCommodities.map((m) => (
            <Chip key={m} label={m} active={commodity === m} onClick={() => setCommodity(m)} dotColor={commodityColor(m).color} />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.slug}
              href={`/provincias/${p.slug}`}
              className="group flex flex-col gap-3 bg-nd-surface p-5 transition-colors hover:bg-nd-surface-raised"
            >
              <span className="font-display text-2xl leading-tight text-nd-text-display">{p.name}</span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-nd-text-secondary font-mono tabular-nums">
                  {p.projectCount} {t('projects')}
                </span>
                <span className="flex items-center gap-1">
                  {p.commodities.slice(0, 6).map((m) => (
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
