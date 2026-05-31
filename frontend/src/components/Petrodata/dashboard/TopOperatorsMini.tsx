'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { OperatorAvatar } from '@/components/Petrodata/map/OperatorAvatar'
import { formatCompact } from '@/utilities/formatNumber'

export type TopOperatorRow = {
  slug: string
  name: string
  boe: number
}

export function TopOperatorsMini({ rows }: { rows: TopOperatorRow[] }) {
  const t = useTranslations('dashboard.topOperators')
  const max = rows[0]?.boe || 1
  return (
    <div className="bg-nd-surface p-5 flex flex-col">
      <div className="flex items-baseline justify-between">
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {t('title')}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {t('boeColumn')}
        </span>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-nd-border border-y border-nd-border">
        {rows.slice(0, 5).map((row, i) => (
          <li
            key={row.slug}
            className="grid grid-cols-[1.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
          >
            <span
              className="text-nd-text-disabled text-[10px] tabular-nums"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              0{i + 1}
            </span>
            <OperatorAvatar slug={row.slug} name={row.name} size="sm" />
            <div className="min-w-0">
              <span
                className="block text-nd-text-display text-[13px] truncate"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
                title={row.name}
              >
                {row.name}
              </span>
              <div className="mt-1 h-[2px] w-full bg-nd-surface-raised">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(4, (row.boe / max) * 100)}%`,
                    backgroundColor:
                      i === 0 ? 'var(--nd-success)' : 'var(--nd-text-display)',
                    opacity: i === 0 ? 1 : 0.55,
                  }}
                />
              </div>
            </div>
            <span
              className="text-nd-text-secondary text-[11px] tabular-nums"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {formatCompact(row.boe)}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/map"
        className="mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-nd-text-secondary hover:text-nd-text-display transition-colors"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('fullRanking')}
        <ArrowRight size={11} />
      </Link>
    </div>
  )
}
