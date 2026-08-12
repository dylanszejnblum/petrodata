'use client'

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '@/providers/Theme'
import { Map, MapClusterLayer, type MapRef, type MapViewport } from '@/components/ui/map'
import type { ApiSchemas } from '@/api/client'
import { formatCompact } from '@/utilities/formatNumber'

const VM_VIEWPORT: Partial<MapViewport> = {
  center: [-69, -38.5],
  zoom: 5.2,
}

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'
const transformRequest = (url: string) => {
  if (url.startsWith(CARTO_FONTS_PREFIX)) {
    return { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
  }
  return { url }
}

type WellProps = ApiSchemas['GeoWellPropertiesDto']
type WellFC = ApiSchemas['GeoWellFeatureCollectionDto']

export function MapPreview({ wells, totalWells }: { wells: WellFC; totalWells: number | null }) {
  const t = useTranslations('dashboard.mapPreview')
  const locale = useLocale()
  const { theme } = useTheme()
  const mapRef = useRef<MapRef | null>(null)
  const bearingRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const reducedMotion = useRef(false)

  // Auto-rotation: drift the bearing slowly. Disabled when prefers-reduced-motion.
  useEffect(() => {
    if (typeof window === 'undefined') return
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion.current) return

    const map = mapRef.current
    if (!map) return

    let lastTs = performance.now()
    const tick = (ts: number) => {
      const dt = (ts - lastTs) / 1000
      lastTs = ts
      // 0.6 degrees per second — barely perceptible drift
      bearingRef.current = (bearingRef.current + dt * 0.6) % 360
      try {
        map.setBearing(bearingRef.current)
      } catch {
        // map disposed
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const fc = wells as unknown as GeoJSON.FeatureCollection<GeoJSON.Point, WellProps>

  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-nd-border bg-nd-surface p-5">
      <div className="flex items-baseline justify-between">
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono"
        >
          {t('title')}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] tabular-nums font-mono"
        >
          {t('sampled', { n: fc.features.length })}
        </span>
      </div>

      <div className="mt-4 relative h-[200px] overflow-hidden rounded-[9px] border border-nd-border bg-nd-surface-raised">
        <Map
          ref={mapRef}
          className="h-full w-full"
          theme={theme === 'dark' ? 'dark' : 'light'}
          viewport={VM_VIEWPORT}
          renderWorldCopies={false}
          transformRequest={transformRequest}
          interactive={false}
          attributionControl={false}
        >
          <MapClusterLayer<WellProps>
            data={fc}
            clusterRadius={40}
            clusterMaxZoom={10}
            clusterColors={['#22c55e', '#eab308', '#ef4444']}
            clusterThresholds={[50, 250]}
            pointColor="#22c55e"
          />
        </Map>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-nd-surface/40 via-transparent to-transparent" />
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-nd-border pt-3">
        <span
          className="text-nd-text-display text-2xl tabular-nums leading-none font-display"
        >
          {totalWells != null ? formatCompact(totalWells, locale) : '—'}
        </span>
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-nd-text-secondary hover:text-nd-text-display transition-colors font-mono"
        >
          {t('openFullMap')}
          <ArrowRight size={11} />
        </Link>
      </div>
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono"
      >
        {t('wellsInCatalog')}
      </span>
    </div>
  )
}
