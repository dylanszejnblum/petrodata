'use client'

import { useEffect, useRef } from 'react'
import maplibregl, { Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

/* MapShell — wrapper único de MapLibre (absorbe el boilerplate ×6 de producción:
   basemap Carto por tema, atribución, sin copias del mundo). El caller recibe
   la instancia en onReady y agrega sources/layers. */

const STYLE = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

export function MapShell({
  center = [-68.78, -38.6],
  zoom = 6.4,
  className = 'h-full w-full',
  onReady,
  controlPosition = 'top-right',
  interactive = true,
  label,
  atribucion = true,
}: {
  center?: [number, number]
  zoom?: number
  className?: string
  onReady?: (map: MLMap) => void
  /** esquina de los controles de zoom */
  controlPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  /** false = mapa decorativo: sin arrastre, zoom ni controles */
  interactive?: boolean
  label: string
  /** false en miniaturas: la atribución va al pie de la sección */
  atribucion?: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const navRef = useRef<maplibregl.NavigationControl | null>(null)
  const navCornerRef = useRef(controlPosition)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE[theme],
      center,
      zoom,
      renderWorldCopies: false,
      /* La atribución se puede apagar por instancia. Hace falta para las
         miniaturas: en un contenedor de 60px de alto, el control desplegado
         —«© CARTO, © OpenStreetMap contributors»— ocupa el mapa entero y lo
         tapa. `compact` no alcanza, porque colapsa por ancho y estas cajas
         son anchas y bajas.

         Apagarlo es legítimo mientras la atribución esté en la PÁGINA: CARTO y
         OSM piden que sea visible para el usuario, no que se repita en cada
         vista. Quien pase `atribucion={false}` se compromete a ponerla al pie
         de su sección. */
      attributionControl: atribucion ? { compact: true } : false,
      interactive,
    })
    if (interactive) {
      navRef.current = new maplibregl.NavigationControl({ showCompass: false })
      navCornerRef.current = controlPosition
      map.addControl(navRef.current, controlPosition)
    }
    map.on('load', () => onReadyRef.current?.(map))
    mapRef.current = map

    // sigue el toggle de tema en vivo
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      map.setStyle(STYLE[t])
      map.once('styledata', () => onReadyRef.current?.(map))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    /* MapLibre sólo escucha el resize de la ventana, así que si el
       contenedor cambia de alto sin que cambie el viewport —el mapa vive
       en un flex-1 y el panel móvil lo achica al abrirse— el canvas queda
       del tamaño viejo y el mapa se ve recortado. */
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(container.current)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Los controles se agregan al crear el mapa, así que sin esto un cambio
     de esquina no se aplica sobre un mapa ya vivo —típico al recargar en
     caliente— y el control queda donde estaba, encimándose con los
     paneles que ahora ocupan esa esquina. */
  useEffect(() => {
    const map = mapRef.current
    const nav = navRef.current
    if (!map || !nav || navCornerRef.current === controlPosition) return
    map.removeControl(nav)
    map.addControl(nav, controlPosition)
    navCornerRef.current = controlPosition
  }, [controlPosition])

  return <div ref={container} role="application" aria-label={label} className={className} />
}

/* Leyenda de mapa, siempre clara: se probó en la card oscura y sobre el
   mapa se lee mejor en claro (decisión de Mariano, 2026-08-12). */
export function MapLegend({
  items,
  title,
  inline = false,
}: {
  items: { color: string; label: string }[]
  title?: string
  /** ítems en una fila que envuelve, en vez de apilados: mucho más
      compacto cuando la leyenda flota sobre el mapa. */
  inline?: boolean
}) {
  return (
    <div className="rounded-[10px] border bg-surface/90 px-3 py-2.5 shadow-[var(--elevation-overlay)] backdrop-blur-md">
      {title && <p className="type-label mb-1">{title}</p>}
      <ul
        className={`m-0 flex list-none p-0 ${
          inline ? 'flex-wrap gap-x-3 gap-y-1' : 'flex-col gap-1'
        }`}
      >
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5 text-[11px] text-secondary">
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: it.color }} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
