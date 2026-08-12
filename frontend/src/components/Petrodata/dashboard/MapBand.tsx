'use client'

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatCompact } from '@/utilities/formatNumber'

/** Field footage reel, one clip after another, as in the design kit. */
const REEL = [
  '/video/reel-pumpjacks.mp4',
  '/video/reel-pozo.mp4',
  '/video/reel-refineria-noche.mp4',
  '/video/reel-planta-gas.mp4',
  '/video/reel-plataformas.mp4',
  '/video/reel-estacion-bombeo.mp4',
  '/video/reel-compresora.mp4',
  '/video/reel-buque.mp4',
  '/video/reel-campos.mp4',
  '/video/reel-rig.mp4',
]

const CLIP_MS = 6_500
const FADE_MS = 400

/** "EL MAPA" band: footage reel bleeding out of the right edge, copy on the left. */
export function MapBand({
  catalogWells,
  liveWells,
}: {
  catalogWells: number | null
  liveWells: number
}) {
  const t = useTranslations('dashboard.mapBand')
  const locale = useLocale()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Single still frame instead of a moving reel.
      video.src = REEL[0]
      video.style.opacity = '1'
      return
    }

    let index = 0
    let clipTimer: ReturnType<typeof setTimeout> | undefined
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    const show = (i: number) => {
      video.style.opacity = '0'
      fadeTimer = setTimeout(() => {
        video.src = REEL[i % REEL.length]
        video.play().catch(() => {
          // Autoplay blocked — the band still reads fine on the flat backdrop.
        })
      }, FADE_MS)
    }

    const onPlaying = () => {
      video.style.opacity = '1'
      clearTimeout(clipTimer)
      clipTimer = setTimeout(() => show(++index), CLIP_MS)
    }
    // Skip ahead on both a finished clip and a broken one.
    const onNext = () => {
      clearTimeout(clipTimer)
      show(++index)
    }

    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', onNext)
    video.addEventListener('error', onNext)
    show(0)

    return () => {
      clearTimeout(clipTimer)
      clearTimeout(fadeTimer)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', onNext)
      video.removeEventListener('error', onNext)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-nd-border bg-[#16191d]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[36%] h-full w-[64%] object-cover opacity-0 grayscale contrast-[1.06] brightness-[0.85] transition-opacity duration-[450ms] [mask-image:linear-gradient(90deg,transparent_0%,#000_26%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_26%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,#16191d_0%,#16191d_44%,rgba(22,25,29,0.88)_56%,rgba(22,25,29,0.3)_70%,rgba(22,25,29,0)_84%)]"
      />

      <div className="relative max-w-[580px] p-8 md:p-12">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-nd-accent font-mono">
          {t('kicker')}
        </span>
        <h2 className="mt-3.5 text-balance text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[2rem] font-display">
          {t('titleLine1')}
          <br />
          {t('titleLine2')}
        </h2>
        <p className="mt-3.5 text-sm leading-relaxed text-white/60 font-sans">
          {t('desc', {
            catalog: catalogWells != null ? formatCompact(catalogWells, locale) : '—',
            live: formatCompact(liveWells, locale),
          })}
        </p>
        <Link
          href="/map"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-nd-accent px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 font-mono"
        >
          {t('cta')} <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
