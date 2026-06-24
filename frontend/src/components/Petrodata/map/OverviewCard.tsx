'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiSchemas } from '@/api/client'
import { formatCompact, formatPercent, formatMonth } from '@/utilities/formatNumber'
import { OverlayCard, OverlayLabel } from './OverlayCard'
import { OperatorAvatar } from './OperatorAvatar'
import { Sparkline, type SparkPoint } from './Sparkline'

type LatestSummary = ApiSchemas['LatestSummaryDto']
type OperatorPoint = ApiSchemas['OperatorTimeSeriesPointDto']

function OverviewCardImpl({
  latest,
  topOperatorSlug,
  topOperatorName,
  timeSeries,
}: {
  latest: LatestSummary
  topOperatorSlug: string | null
  topOperatorName: string | null
  timeSeries: OperatorPoint[]
}) {
  const t = useTranslations('mapPage.overview')
  const sparkData: SparkPoint[] = timeSeries.map((p) => ({
    x: p.date_month,
    y: p.oil_bbl_d,
  }))

  return (
    <OverlayCard className="w-full rounded-none">
      <div className="border-b border-nd-border px-5 py-4">
        <OverlayLabel>
          {t('latestMonth', { month: formatMonth(latest.date_month as string | null | undefined) })}
        </OverlayLabel>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className="text-nd-text-display tabular-nums leading-none font-display"
            style={{ fontSize: '2rem' }}
          >
            {formatCompact(latest.boe)}
          </span>
          <abbr
            title={t('boeTooltip')}
            className="text-nd-text-disabled text-[10px] uppercase cursor-help no-underline border-b border-dotted border-nd-text-disabled font-mono"
          >
            BOE
          </abbr>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-nd-text-secondary">
          <span className="tabular-nums font-mono">
            {t('oilUnit', { value: formatCompact(latest.oil_bbl_d) })}
          </span>
          <span className="text-nd-text-disabled">·</span>
          <span className="tabular-nums font-mono">
            {t('gasUnit', { value: formatCompact(latest.gas_mmcf_d) })}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] uppercase font-mono"
            style={{
              color: 'var(--nd-black)',
              backgroundColor: 'var(--nd-success)',
            }}
          >
            VM
          </span>
          <span
            className="text-nd-text-secondary text-[11px] tabular-nums font-mono"
          >
            {t('vmShareOfBoe', { pct: formatPercent(latest.vm_share.boe) })}
          </span>
        </div>
      </div>

      {topOperatorSlug && timeSeries.length > 0 && (
        <div className="px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <OperatorAvatar
                slug={topOperatorSlug}
                name={topOperatorName ?? topOperatorSlug}
                size="sm"
              />
              <OverlayLabel>
                {t('operatorOilBblD', { operator: topOperatorName ?? topOperatorSlug })}
              </OverlayLabel>
            </div>
            <span
              className="text-nd-text-disabled text-[10px] tabular-nums shrink-0 font-mono"
            >
              {timeSeries.length}M
            </span>
          </div>
          <Sparkline data={sparkData} gradientId={`spark-${topOperatorSlug}`} />
        </div>
      )}
    </OverlayCard>
  )
}

export const OverviewCard = memo(OverviewCardImpl)
