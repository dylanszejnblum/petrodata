import { getTranslations } from 'next-intl/server'
import type { ApiSchemas } from '@/api/client'
import { commodityColor } from './commodityColors'
import { parseCapexUsdM } from './capex'

type Project = ApiSchemas['ProjectListItemDto']

/**
 * Top N projects ranked by parsed CAPEX. Capex is reported as free-text
 * (`technical_economic.capex`) in the upstream DTO; we fetch the project
 * detail per top candidate to get that text. To avoid N detail calls just
 * for the chart, we accept a pre-fetched list of `{ name, capexText }`.
 */
export async function CapexChart({
  rows,
}: {
  rows: { name: string; commodity: string; capexText: string | null }[]
}) {
  const t = await getTranslations('mineralsCharts')

  const parsed = rows
    .map((r) => ({
      ...r,
      capexUsdM: parseCapexUsdM(r.capexText),
    }))
    .filter((r): r is { name: string; commodity: string; capexText: string | null; capexUsdM: number } => r.capexUsdM != null)
    .sort((a, b) => b.capexUsdM - a.capexUsdM)
    .slice(0, 10)

  const max = parsed[0]?.capexUsdM ?? 1

  return (
    <div className="bg-nd-surface p-5 flex flex-col h-full">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('capex.eyebrow')}
      </span>
      <h3
        className="mt-1 mb-4 text-nd-text-display text-lg leading-tight"
        style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
      >
        {t('capex.title')}
      </h3>
      {parsed.length === 0 ? (
        <p
          className="text-nd-text-disabled text-sm"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {t('common.noData')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {parsed.map((p) => {
            const { color } = commodityColor(p.commodity)
            return (
              <li key={p.name} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span
                    className="flex items-center gap-2 min-w-0 text-nd-text-display"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    title={p.name}
                  >
                    <span
                      className="inline-block size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span
                    className="text-nd-text-secondary tabular-nums shrink-0"
                    style={{ fontFamily: 'var(--font-space-mono)' }}
                  >
                    {formatCapex(p.capexUsdM)}
                  </span>
                </div>
                <div className="h-[3px] bg-nd-surface-raised">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(4, (p.capexUsdM / max) * 100)}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function formatCapex(usdM: number): string {
  if (usdM >= 1000) return `$${(usdM / 1000).toFixed(1)}B`
  if (usdM >= 100) return `$${Math.round(usdM)}M`
  return `$${usdM.toFixed(0)}M`
}
