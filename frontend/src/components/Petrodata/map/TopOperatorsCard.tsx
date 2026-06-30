'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/utilities/analytics'
import type { ApiSchemas } from '@/api/client'
import { formatCompact } from '@/utilities/formatNumber'
import { OverlayCard, OverlayLabel } from './OverlayCard'
import { OperatorAvatar } from './OperatorAvatar'

type OperatorItem = ApiSchemas['OperatorListItemDto']

function TopOperatorsCardImpl({
  operators,
  selectedSlug,
  onSelect,
}: {
  operators: OperatorItem[]
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
}) {
  const t = useTranslations('mapPage.topOperators')
  const top = operators.slice(0, 5)
  const max = top[0]?.boe || 1

  return (
    <OverlayCard className="w-full rounded-none">
      <div className="border-b border-nd-border px-5 py-3">
        <OverlayLabel>{t('title')}</OverlayLabel>
      </div>
      <ul className="divide-y divide-nd-border">
        {top.map((op, i) => {
          const isActive = op.operator_slug === selectedSlug
          return (
            <li key={op.operator_slug}>
              <button
                type="button"
                onClick={() => {
                  if (!isActive) track('map_operator_click', { operator: op.operator_name })
                  onSelect(isActive ? null : op.operator_slug)
                }}
                className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-nd-surface-raised"
              >
                <span
                  className="text-nd-text-disabled text-[11px] tabular-nums w-4 font-mono"
                >
                  0{i + 1}
                </span>
                <OperatorAvatar slug={op.operator_slug} name={op.operator_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm ${isActive ? 'text-nd-success' : 'text-nd-text-display'} font-sans`}
                    >
                      {op.operator_name}
                    </span>
                    <span
                      className="text-nd-text-secondary text-[11px] tabular-nums font-mono"
                    >
                      {formatCompact(op.boe)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full bg-nd-surface-raised">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(2, (op.boe / max) * 100)}%`,
                        backgroundColor: isActive ? 'var(--nd-success)' : 'var(--nd-text-display)',
                        opacity: isActive ? 1 : 0.5,
                      }}
                    />
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-nd-border px-5 py-2.5">
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono"
        >
          {t('clickToFilter')}
        </span>
      </div>
    </OverlayCard>
  )
}

export const TopOperatorsCard = memo(TopOperatorsCardImpl)
