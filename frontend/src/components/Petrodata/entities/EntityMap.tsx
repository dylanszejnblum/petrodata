'use client'

// Generic project map for company / province pages. Plots colour-coded markers
// and auto-fits the viewport to their bounding box (works for any region without
// hardcoded bounds). Click a marker for a popup; hover for a tooltip. Markers
// pop in after the map loads. Compositor-only animation, reduced-motion safe.

import { useCallback, useEffect, useState } from 'react'
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
  MapPopup,
  useMap,
} from '@/components/ui/map'
import { useTheme } from '@/providers/Theme'
import { popIn, utils } from '@/components/Petrodata/uranium/anim'
import type { MapLegendItem, MapPoint } from './types'

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'
const transformRequest = (url: string) =>
  url.startsWith(CARTO_FONTS_PREFIX)
    ? { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
    : { url }

function plottable(p: MapPoint): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0)
}

export function EntityMap({
  points,
  legend,
}: {
  points: MapPoint[]
  legend?: { label: string; items: MapLegendItem[] }
}) {
  const { theme } = useTheme()
  const plotted = points.filter(plottable)

  return (
    <div className="relative h-full w-full">
      <Map
        theme={theme === 'dark' ? 'dark' : 'light'}
        viewport={{ center: [-65.5, -40], zoom: 3.6 }}
        renderWorldCopies={false}
        transformRequest={transformRequest}
        className="h-full w-full"
      >
        <MapControls position="bottom-right" showZoom />
        <Inner plotted={plotted} />
      </Map>

      {legend && legend.items.length > 0 && (
        <div className="absolute bottom-3 left-3 border border-nd-border bg-nd-surface/90 p-3 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {legend.label}
          </div>
          <ul className="mt-2 space-y-1">
            {legend.items.map((it) => (
              <li key={it.label} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: it.color }} aria-hidden />
                <span className="font-mono text-[11px] text-nd-text-secondary">{it.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Inner({ plotted }: { plotted: MapPoint[] }) {
  const { map, isLoaded } = useMap()
  const [selected, setSelected] = useState<MapPoint | null>(null)
  const handleClose = useCallback(() => setSelected(null), [])

  // Fit the viewport to the markers once the map is ready.
  useEffect(() => {
    if (!map || !isLoaded || plotted.length === 0) return
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const p of plotted) {
      minLng = Math.min(minLng, p.lng)
      maxLng = Math.max(maxLng, p.lng)
      minLat = Math.min(minLat, p.lat)
      maxLat = Math.max(maxLat, p.lat)
    }
    if (plotted.length === 1) {
      map.easeTo({ center: [plotted[0].lng, plotted[0].lat], zoom: 6, duration: 600 })
    } else {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 64, maxZoom: 8, duration: 600 },
      )
    }
  }, [map, isLoaded, plotted])

  // Reveal markers once they're portaled in.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf2 = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => popIn('.entity-marker', { startDelay: 150, step: 60 }))
    })
    const settle = window.setTimeout(() => utils.set('.entity-marker', { opacity: 1, scale: 1 }), 3000)
    return () => {
      window.cancelAnimationFrame(raf1)
      window.cancelAnimationFrame(raf2)
      window.clearTimeout(settle)
    }
  }, [plotted.length])

  return (
    <>
      {plotted.map((p, i) => (
        <MapMarker key={`${p.name}-${i}`} longitude={p.lng} latitude={p.lat} onClick={() => setSelected(p)}>
          <MarkerContent>
            <div className="entity-marker relative grid cursor-pointer place-items-center opacity-0">
              <span className="size-3 rounded-full ring-2 ring-white" style={{ backgroundColor: p.color }} />
            </div>
          </MarkerContent>
          <MarkerTooltip className="!rounded-none border border-nd-border !bg-nd-surface !text-nd-text-primary font-mono text-[11px]">
            <div>{p.name}</div>
            {(p.line1 || p.line2) && (
              <div className="text-nd-text-secondary">{[p.line1, p.line2].filter(Boolean).join(' · ')}</div>
            )}
          </MarkerTooltip>
        </MapMarker>
      ))}

      {selected && (
        <MapPopup
          longitude={selected.lng}
          latitude={selected.lat}
          offset={20}
          onClose={handleClose}
          closeButton
          maxWidth="18rem"
          className="!rounded-none !p-0 border-nd-border !bg-nd-surface !text-nd-text-primary"
        >
          <div className="flex w-[16rem] flex-col gap-2 p-4 pr-8">
            <div className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} aria-hidden />
              <span className="truncate font-sans text-base leading-tight text-nd-text-display" title={selected.name}>
                {selected.name}
              </span>
            </div>
            {(selected.line1 || selected.line2) && (
              <div className="font-mono text-[11px] text-nd-text-secondary">
                {[selected.line1, selected.line2].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </MapPopup>
      )}
    </>
  )
}
