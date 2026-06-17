'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatCompact } from '@/utilities/formatNumber'

export type ProvinceCard = {
  slug: string
  name: string
  wells: number
  exportUsd?: number | null
}

export function ProvinceList({ provinces }: { provinces: ProvinceCard[] }) {
  const t = useTranslations('provinces')

  if (provinces.length === 0) {
    return <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-px bg-nd-border sm:grid-cols-2 lg:grid-cols-3">
      {provinces.map((p) => (
        <Link
          key={p.slug}
          href={`/provincias/${p.slug}`}
          className="group flex flex-col gap-3 bg-nd-surface p-5 transition-colors hover:bg-nd-surface-raised"
        >
          <span className="font-display text-2xl leading-tight text-nd-text-display">{p.name}</span>
          <span className="text-[11px] text-nd-text-secondary font-mono tabular-nums">
            {formatCompact(p.wells)} {t('wells')}
          </span>
          {p.exportUsd != null && p.exportUsd > 0 && (
            <span className="text-[11px] tabular-nums text-nd-text-display font-mono">
              ${formatCompact(p.exportUsd)}{' '}
              <span className="text-nd-text-disabled">{t('exportValue')}</span>
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
