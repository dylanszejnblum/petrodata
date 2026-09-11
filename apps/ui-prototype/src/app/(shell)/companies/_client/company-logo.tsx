'use client'

import { useState } from 'react'

/* Logo de empresa, en tres escalones de disponibilidad:
   1. `logoUrl` — el ícono resuelto del sitio de la empresa. Hace falta
      porque el servicio de favicons de Google devuelve 404 para casi
      todos los dominios .com.ar chicos: tener sitio no alcanza, Google
      además tiene que haberlo indexado.
   2. favicon de Google derivado de `website` — el camino de producción,
      que sí funciona para las marcas grandes (YPF, Shell, Chevron…).
   3. Monograma — para las ~2/3 del padrón que directamente no tienen
      presencia web (SRL chicas y sociedades provinciales). No es un
      "logo faltante": es la marca por defecto del directorio, con el
      mismo peso visual que un logo real para que la columna no se vea
      rota. Ver el comentario de escala más abajo.

   El fondo blanco de la placa es funcional: los favicons se diseñan
   asumiendo fondo claro y un PNG transparente desaparecería en oscuro. */

const DIM: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'size-5',
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-12',
}
const TXT: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'text-[9px]',
  sm: 'text-[11px]',
  md: 'text-sm',
  lg: 'text-lg',
}

function faviconFrom(website: string | null | undefined): string | null {
  if (!website) return null
  try {
    const host = new URL(website.startsWith('http') ? website : `https://${website}`).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
  } catch {
    return null
  }
}

/** Inicial "de marca": saltea artículos y toma la primera letra útil del
    nombre, ignorando la forma societaria (S.A., SRL, SAU…). */
function monograma(name: string): string {
  const limpio = name
    .replace(/\b(S\.?A\.?S?|S\.?R\.?L\.?|SAU|SAPEM|S\.?E\.?|LTD\.?)\b/gi, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
  return (limpio.charAt(0) || name.charAt(0) || '?').toUpperCase()
}

export function CompanyLogo({
  name,
  website,
  logoUrl,
  size = 'md',
  className = '',
}: {
  name: string
  website?: string | null
  logoUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = logoUrl || faviconFrom(website)

  if (!src || failed) {
    return (
      <span
        className={`grid ${DIM[size]} ${TXT[size]} shrink-0 place-items-center rounded-[4px] border bg-raised font-display font-semibold text-secondary ${className}`}
        aria-hidden
      >
        {monograma(name)}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${DIM[size]} shrink-0 rounded-[4px] border bg-white object-contain p-0.5 ${className}`}
    />
  )
}
