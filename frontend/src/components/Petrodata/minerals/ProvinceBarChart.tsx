import { getTranslations } from 'next-intl/server'

/**
 * Pure server-rendered horizontal bar chart (CSS-only, no Recharts).
 * Pass `byProvince` from /api/v2/minerals/summary, returns the top N as bars.
 */
export async function ProvinceBarChart({
  byProvince,
  topN = 8,
}: {
  byProvince: Record<string, number>
  topN?: number
}) {
  const t = await getTranslations('mineralsCharts')
  const rows = Object.entries(byProvince)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
  const max = rows[0]?.[1] ?? 1

  return (
    <div className="bg-nd-surface p-5 flex flex-col h-full">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('provinces.eyebrow')}
      </span>
      <h3
        className="mt-1 mb-4 text-nd-text-display text-lg leading-tight"
        style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
      >
        {t('provinces.title')}
      </h3>
      {rows.length === 0 ? (
        <p
          className="text-nd-text-disabled text-sm"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          {t('common.noData')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map(([name, count]) => (
            <li key={name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span
                  className="text-nd-text-display truncate"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  title={name}
                >
                  {name}
                </span>
                <span
                  className="text-nd-text-secondary tabular-nums"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {count}
                </span>
              </div>
              <div className="h-[3px] bg-nd-surface-raised">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(4, (count / max) * 100)}%`,
                    backgroundColor: 'var(--nd-success)',
                    opacity: 0.6,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
