'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatInteger } from '@/lib/format'
import { prefersReducedMotion } from '@/lib/motion'
import { HEADLINE } from '@/fixtures/production'
import { WELLS } from '@/fixtures/wells'

/* Banda del mapa — la pieza que en vacamuerta.io lleva un reel de clips
   sangrando desde el borde derecho, con la imagen difuminándose hacia el
   texto. Se porta el mecanismo (rotación, máscara y degradado) y se viste
   en Estrato: el kicker va en oil en vez del rojo de marca.

   El video es decorativo: aria-hidden, sin audio y sin controles. Con
   prefers-reduced-motion no se monta y queda la banda oscura sola, que es
   el mismo camino que sirve producción. */

const CLIPS = [
  'reel-pumpjacks',
  'reel-pozo',
  'reel-refineria-noche',
  'reel-planta-gas',
  'reel-plataformas',
  'reel-estacion-bombeo',
  'reel-compresora',
  'reel-buque',
  'reel-campos',
  'reel-rig',
]

const CLIP_MS = 6500
const FADE_MS = 450

export function MapBand() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [conVideo, setConVideo] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    setConVideo(true)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !conVideo) return

    /* arranque en un clip al azar para que no sea siempre el mismo */
    let i = Math.floor(Math.random() * CLIPS.length)
    let clipTimer: ReturnType<typeof setTimeout>
    let fadeTimer: ReturnType<typeof setTimeout>

    const cargar = () => {
      video.src = `/video/${CLIPS[i]}.mp4`
      video.load()
      void video.play().catch(() => {})
    }
    /* el fade-in recién cuando hay imagen: evita el flash del cuadro negro */
    const alReproducir = () => {
      video.style.opacity = '1'
      clipTimer = setTimeout(() => {
        video.style.opacity = '0'
        fadeTimer = setTimeout(siguiente, FADE_MS)
      }, CLIP_MS)
    }
    const siguiente = () => {
      i = (i + 1) % CLIPS.length
      cargar()
    }

    video.addEventListener('playing', alReproducir)
    video.addEventListener('ended', siguiente)
    video.addEventListener('error', siguiente)
    cargar()

    return () => {
      clearTimeout(clipTimer)
      clearTimeout(fadeTimer)
      video.removeEventListener('playing', alReproducir)
      video.removeEventListener('ended', siguiente)
      video.removeEventListener('error', siguiente)
    }
  }, [conVideo])

  return (
    <div className="relative overflow-hidden rounded-[10px] border-4 border-black bg-inverse">
      {conVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[36%] h-full w-[64%] object-cover opacity-0 grayscale contrast-[1.06] brightness-[0.85] transition-opacity duration-[450ms] [mask-image:linear-gradient(90deg,transparent_0%,#000_26%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_26%)]"
        />
      )}
      {/* degradado en diagonal: opaco donde va el texto, transparente
          sobre el video para que la imagen respire a la derecha */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,var(--surface-inverse)_0%,var(--surface-inverse)_44%,color-mix(in_srgb,var(--surface-inverse)_88%,transparent)_56%,color-mix(in_srgb,var(--surface-inverse)_30%,transparent)_70%,transparent_84%)]"
      />

      <div className="relative max-w-[580px] p-8 md:p-12">
        <span className="type-label block !text-oil">Mapa interactivo</span>
        <h2 className="type-display mt-3.5 text-balance !text-white !text-[1.75rem] !leading-[1.1] md:!text-[2rem]">
          La actividad de la cuenca.
          <br />
          Pozo por pozo.
        </h2>
        <p className="mt-3.5 text-sm leading-relaxed text-on-dark-2">
          {formatInteger(HEADLINE.catalogWells)} pozos en el catálogo,{' '}
          {formatInteger(WELLS.length)} muestreados en vivo sobre la cuenca Neuquina.
        </p>
        <Link
          href="/map"
          className="type-label mt-6 inline-flex items-center gap-2 rounded-[8px] bg-white px-5 py-3 !text-[#16191d] transition-opacity duration-200 hover:opacity-85"
        >
          Abrir el mapa <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
