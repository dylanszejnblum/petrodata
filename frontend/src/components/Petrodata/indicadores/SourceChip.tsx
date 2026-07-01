'use client'

// A data-source citation rendered as a chip. Shows only the computed-by line
// with the data's as-of date: "Computed by vacamuerta.io · latest data available {date}".

import { useTranslations } from 'next-intl'

export function SourceChip({ source }: { source: { asOf: string } }) {
  const t = useTranslations('indicadores')
  return (
    <span className="inline-flex items-center rounded-full border border-nd-border bg-nd-surface px-2.5 py-1 font-mono text-[10px] leading-none text-nd-text-disabled">
      {t('sourceLatest', { date: source.asOf })}
    </span>
  )
}
