import { getTranslations } from 'next-intl/server'

const STATUS_BUCKETS: Record<string, string[]> = {
  operating: ['operation', 'producing', 'production'],
  advanced: ['feasibility', 'construction'],
  early: ['pea', 'preliminary', 'prefeasibility', 'pre feasibility', 'pre-feasibility', 'advanced study'],
  exploration: ['exploration', 'unknown'],
}

const BUCKET_COLORS: Record<keyof typeof STATUS_BUCKETS, string> = {
  operating: 'var(--nd-success)',
  advanced: '#f59e0b',
  early: '#3b82f6',
  exploration: 'var(--nd-text-disabled)',
}

type BucketKey = keyof typeof STATUS_BUCKETS

function bucketFor(status: string): BucketKey | null {
  const s = status.toLowerCase()
  for (const [bucket, tokens] of Object.entries(STATUS_BUCKETS) as [BucketKey, string[]][]) {
    if (tokens.some((t) => s.includes(t))) return bucket
  }
  return null
}

/**
 * Groups the API's by_status map into 4 canonical buckets and renders them
 * as horizontal stacked bars (pure CSS, no Recharts).
 */
export async function StatusGroupChart({ byStatus }: { byStatus: Record<string, number> }) {
  const t = await getTranslations('mineralsCharts')

  const buckets: Record<BucketKey, number> = {
    operating: 0,
    advanced: 0,
    early: 0,
    exploration: 0,
  }
  for (const [status, count] of Object.entries(byStatus)) {
    const b = bucketFor(status)
    if (b) buckets[b] += count
  }

  const total = Object.values(buckets).reduce((acc, v) => acc + v, 0)
  const rows: { key: BucketKey; label: string; count: number }[] = [
    { key: 'operating', label: t('status.operating'), count: buckets.operating },
    { key: 'advanced', label: t('status.advanced'), count: buckets.advanced },
    { key: 'early', label: t('status.early'), count: buckets.early },
    { key: 'exploration', label: t('status.exploration'), count: buckets.exploration },
  ]

  return (
    <div className="bg-nd-surface p-5 flex flex-col h-full">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('status.eyebrow')}
      </span>
      <h3
        className="mt-1 mb-4 text-nd-text-display text-lg leading-tight"
        style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
      >
        {t('status.title')}
      </h3>

      {/* Single composite bar of all buckets, proportional widths */}
      <div className="flex h-2 w-full overflow-hidden border border-nd-border">
        {rows.map((row) =>
          row.count > 0 ? (
            <div
              key={row.key}
              style={{
                width: `${(row.count / Math.max(1, total)) * 100}%`,
                backgroundColor: BUCKET_COLORS[row.key],
              }}
              title={`${row.label}: ${row.count}`}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block size-2 rounded-full shrink-0"
                style={{ backgroundColor: BUCKET_COLORS[row.key] }}
                aria-hidden
              />
              <span
                className="text-nd-text-display truncate"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {row.label}
              </span>
            </span>
            <span
              className="text-nd-text-secondary tabular-nums"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
