'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'
import { PROVINCE_META, provincePhoto } from './provinceMeta'

export type ProvinceCard = {
  slug: string
  name: string
  wells: number
  exportUsd?: number | null
  /** Share of the country's total exports (0–1), null when unknown. */
  exportShare?: number | null
}


export function ProvinceList({ provinces }: { provinces: ProvinceCard[] }) {
  const t = useTranslations('provinces')
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR')
  // Plain anchors on purpose: full-page navigation is reliable here, while the
  // client-side RSC navigation was silently swallowing clicks on these cards.
  const hrefPrefix = locale === 'en' ? '/en' : ''

  if (provinces.length === 0) {
    return <p className="text-sm text-nd-text-disabled font-mono">{t('noResults')}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {provinces.map((p) => {
        const meta = PROVINCE_META[p.slug]
        const accent = meta?.accent ?? 'var(--nd-accent)'
        const sharePct = p.exportShare != null ? p.exportShare * 100 : null

        return (
          <a
            key={p.slug}
            href={`${hrefPrefix}/provincias/${p.slug}`}
            className="group relative block min-h-60 overflow-hidden rounded-[10px] border border-nd-border bg-[#16191d] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nd-interactive"
          >
            {meta && (
              <Image
                src={provincePhoto(p.slug)!}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover grayscale contrast-[1.05]"
              />
            )}
            {/* Legibility scrims: diagonal for the copy, vertical for the footer row. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(45deg,rgba(22,25,29,0.92)_0%,rgba(22,25,29,0.72)_44%,rgba(22,25,29,0.34)_84%,rgba(22,25,29,0.14)_100%)]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,25,29,0.35)_0%,rgba(22,25,29,0.05)_36%,rgba(22,25,29,0.6)_100%)]"
            />

            <div className="relative flex min-h-60 flex-col justify-end p-4">
              <div className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px 1px ${accent}` }}
                  aria-hidden
                />
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70 font-mono">
                  {meta ? t(`basins.${meta.basin}`) : t('oilGas')}
                </span>
              </div>

              <h3 className="mt-2 text-2xl font-semibold leading-none tracking-[-0.01em] text-white font-display">{p.name}</h3>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="flex gap-5">
                  <div>
                    <div className="text-base font-semibold leading-none tabular-nums text-white font-display">
                      {nf.format(p.wells)}
                    </div>
                    <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/70 font-mono">
                      {t('wells')}
                    </div>
                  </div>
                  {p.exportUsd != null && p.exportUsd > 0 && (
                    <div>
                      <div className="text-base font-semibold leading-none tabular-nums text-white font-display">
                        {formatCompactUSD(p.exportUsd, locale)}
                      </div>
                      <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/70 font-mono">
                        {t('exports')}
                      </div>
                    </div>
                  )}
                </div>
                <span className="whitespace-nowrap text-[10px] text-white/80 font-mono">
                  {t('viewProvince')} →
                </span>
              </div>

              {sharePct != null && (
                <>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/60 font-mono">
                      {t('exportShare')}
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums text-white/85 font-mono">
                      {sharePct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(sharePct, 100)}%`, background: accent }}
                    />
                  </div>
                </>
              )}
            </div>
          </a>
        )
      })}
    </div>
  )
}
