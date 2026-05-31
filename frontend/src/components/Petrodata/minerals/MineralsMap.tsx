'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { GeoJSONSource, MapGeoJSONFeature, MapMouseEvent } from 'maplibre-gl'
import { useTheme } from '@/providers/Theme'
import {
  Map,
  MapClusterLayer,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  useMap,
  type MapViewport,
} from '@/components/ui/map'
import { ARGENTINA_BOUNDS } from '@/components/Petrodata/map/regions'
import { commodityColor } from './commodityColors'

const TRACKED_COMMODITIES = ['Silver', 'Gold', 'Copper', 'Lithium', 'Uranium', 'Lead', 'Zinc']
const FALLBACK_COLOR = '#a1a1aa'

export type ProjectFeatureProps = {
  project_name: string
  primary_commodity: string | null
  status?: string | null
  province?: string | null
  operator?: string | null
  deposit_type?: string | null
}

export type MineralsFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  ProjectFeatureProps
>

const ARGENTINA_VIEWPORT: Partial<MapViewport> = {
  center: [(-64.5 + ARGENTINA_BOUNDS[0][0]) / 2, -38],
  zoom: 3.8,
}

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'
const transformRequest = (url: string) => {
  if (url.startsWith(CARTO_FONTS_PREFIX)) {
    return { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
  }
  return { url }
}

type Selected = {
  longitude: number
  latitude: number
  properties: ProjectFeatureProps
}

export function MineralsMap({
  data,
  viewport = ARGENTINA_VIEWPORT,
  pointColor,
  className,
  legendCommodities,
}: {
  data: MineralsFeatureCollection
  viewport?: Partial<MapViewport>
  /** Optional override; falls back to per-feature commodityColor */
  pointColor?: string
  className?: string
  /** When provided, renders a floating legend overlay on the map. */
  legendCommodities?: string[]
}) {
  const { theme } = useTheme()
  const [selected, setSelected] = useState<Selected | null>(null)

  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, ProjectFeatureProps>, coordinates: [number, number]) => {
      if (!feature.properties) return
      setSelected({
        longitude: coordinates[0],
        latitude: coordinates[1],
        properties: feature.properties,
      })
    },
    [],
  )

  const handleClose = useCallback(() => setSelected(null), [])

  // Resolve a single point color when the caller doesn't pass one.
  // We can't easily set per-feature paint via MapClusterLayer's pointColor prop,
  // so for multi-commodity maps we fall back to a neutral green and rely on the
  // popup + the legend (provided by the parent) for commodity identification.
  const effectiveColor = pointColor ?? 'var(--nd-success)'
  const effectiveColorHex = useMemo(() => resolveCssColor(effectiveColor), [effectiveColor])

  return (
    <div className={className ?? 'relative h-full w-full'}>
      <Map
        className="h-full w-full"
        theme={theme === 'dark' ? 'dark' : 'light'}
        viewport={viewport}
        renderWorldCopies={false}
        transformRequest={transformRequest}
      >
        <MapControls position="bottom-right" showZoom showCompass showFullscreen />
        {legendCommodities && legendCommodities.length > 0 && (
          <MapLegend commodities={legendCommodities} />
        )}
        {pointColor ? (
          <MapClusterLayer<ProjectFeatureProps>
            data={data}
            clusterRadius={45}
            clusterMaxZoom={10}
            clusterColors={['#22c55e', '#eab308', '#ef4444']}
            clusterThresholds={[10, 40]}
            pointColor={effectiveColorHex}
            onPointClick={handlePointClick}
          />
        ) : (
          <MineralsClusterLayer
            data={data}
            clusterRadius={45}
            clusterMaxZoom={10}
            onPointClick={handlePointClick}
          />
        )}
        {selected && (
          <>
            <MapMarker longitude={selected.longitude} latitude={selected.latitude}>
              <MarkerContent>
                <div className="relative grid place-items-center">
                  <span
                    className="absolute inline-block h-5 w-5 rounded-full animate-ping"
                    style={{
                      backgroundColor: commodityColor(selected.properties.primary_commodity).color,
                      opacity: 0.45,
                    }}
                  />
                  <span
                    className="relative inline-block h-3 w-3 rounded-full ring-2 ring-white"
                    style={{
                      backgroundColor: commodityColor(selected.properties.primary_commodity).color,
                    }}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
            <MapPopup
              longitude={selected.longitude}
              latitude={selected.latitude}
              offset={22}
              onClose={handleClose}
              closeButton
              maxWidth="22rem"
              className="!p-0 rounded-none border-nd-border bg-nd-surface text-nd-text-primary"
            >
              <ProjectPopupBody properties={selected.properties} />
            </MapPopup>
          </>
        )}
      </Map>
    </div>
  )
}

function MapLegend({ commodities }: { commodities: string[] }) {
  return (
    <div
      className="pointer-events-none absolute top-3 left-3 z-10 inline-flex flex-col gap-1.5 border border-nd-border bg-nd-surface/85 backdrop-blur-md px-3 py-2.5"
      style={{ fontFamily: 'var(--font-space-mono)' }}
    >
      {commodities.map((c) => {
        const { color } = commodityColor(c)
        return (
          <span
            key={c}
            className="inline-flex items-center gap-2 text-[11px] text-nd-text-secondary"
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {c}
          </span>
        )
      })}
    </div>
  )
}

function ProjectPopupBody({ properties }: { properties: ProjectFeatureProps }) {
  const { color } = commodityColor(properties.primary_commodity)
  return (
    <div className="flex w-[18rem] flex-col">
      <div className="flex items-center gap-3 border-b border-nd-border px-4 pt-4 pb-3">
        <span
          className="inline-block size-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="min-w-0">
          <span
            className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            Project · {properties.primary_commodity ?? '—'}
          </span>
          <span
            className="mt-0.5 text-nd-text-display text-base leading-tight block truncate"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
            title={properties.project_name}
          >
            {properties.project_name}
          </span>
        </div>
      </div>
      <dl
        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 py-3 text-[11px]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        <MetaRow label="Status" value={properties.status} />
        <MetaRow label="Province" value={properties.province} />
        <MetaRow label="Operator" value={properties.operator} />
        <MetaRow label="Deposit" value={properties.deposit_type} />
      </dl>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <>
      <dt className="text-nd-text-disabled uppercase">{label}</dt>
      <dd className="text-nd-text-secondary">{value}</dd>
    </>
  )
}

// Resolves a CSS var() to an actual hex/rgb so MapLibre paint expressions can use it.
// MapLibre cannot consume var(--…). Only used when pointColor is set to a token.
function resolveCssColor(input: string): string {
  if (typeof window === 'undefined') return input
  if (!input.startsWith('var(')) return input
  const match = input.match(/var\((--[^,)\s]+)\)/)
  if (!match) return input
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim()
  return value || input
}

/* ---------------------------------------------------------------------------
 * MineralsClusterLayer
 *
 * Custom cluster layer that:
 *   - paints unclustered points by `primary_commodity` (match expression)
 *   - paints clusters by the dominant commodity inside that cluster (computed
 *     via MapLibre `clusterProperties` + a chained `case` expression)
 *
 * Falls back to a neutral grey when a feature's commodity isn't in the
 * tracked set.
 * -------------------------------------------------------------------------- */

type CountKey = `count_${string}`

// Normalize commodity for matching: lowercase + safe against null.
// MapLibre's `to-string` coerces null → "" so downcase never errors.
const COMMODITY_KEY: unknown = ['downcase', ['to-string', ['get', 'primary_commodity']]]

// Build the clusterProperties spec: one count_<commodity> per tracked commodity.
// Each property aggregates "1 if feature.primary_commodity matches this commodity (case-insensitive), else 0".
function buildClusterProperties() {
  const props: Record<string, unknown> = {}
  for (const c of TRACKED_COMMODITIES) {
    const key: CountKey = `count_${c.toLowerCase()}`
    props[key] = ['+', ['case', ['==', COMMODITY_KEY, c.toLowerCase()], 1, 0]]
  }
  return props
}

// Color the cluster by whichever count_<X> is the highest. Each branch checks
// "this commodity's count is >0 AND >= all others". The `>0` guard means
// clusters with no tracked-commodity match fall through to the fallback color
// (instead of an "all counts 0" empty cluster trivially matching silver first).
// Ties resolve to whichever commodity appears earlier in TRACKED_COMMODITIES.
function buildDominantColorExpr(): unknown {
  const expr: unknown[] = ['case']
  for (let i = 0; i < TRACKED_COMMODITIES.length; i++) {
    const target = TRACKED_COMMODITIES[i]
    const targetGet = ['get', `count_${target.toLowerCase()}`]
    const conditions: unknown[] = [['>', targetGet, 0]]
    for (let j = 0; j < TRACKED_COMMODITIES.length; j++) {
      if (j === i) continue
      const other = TRACKED_COMMODITIES[j]
      conditions.push(['>=', targetGet, ['get', `count_${other.toLowerCase()}`]])
    }
    expr.push(['all', ...conditions], commodityColor(target).color)
  }
  expr.push(FALLBACK_COLOR)
  return expr
}

// Per-point color by primary_commodity (case-insensitive).
function buildPointColorExpr(): unknown {
  const expr: unknown[] = ['match', COMMODITY_KEY]
  for (const c of TRACKED_COMMODITIES) {
    expr.push(c.toLowerCase(), commodityColor(c).color)
  }
  expr.push(FALLBACK_COLOR)
  return expr
}

function MineralsClusterLayer({
  data,
  clusterRadius = 45,
  clusterMaxZoom = 10,
  onPointClick,
}: {
  data: MineralsFeatureCollection
  clusterRadius?: number
  clusterMaxZoom?: number
  onPointClick: (
    feature: GeoJSON.Feature<GeoJSON.Point, ProjectFeatureProps>,
    coordinates: [number, number],
  ) => void
}) {
  const { map, isLoaded } = useMap()
  const uid = useId()
  const sourceId = `minerals-source-${uid}`
  const clusterLayerId = `minerals-clusters-${uid}`
  const clusterCountLayerId = `minerals-count-${uid}`
  const pointLayerId = `minerals-point-${uid}`

  const onPointClickRef = useRef(onPointClick)
  onPointClickRef.current = onPointClick

  useEffect(() => {
    if (!map || !isLoaded) return

    map.addSource(sourceId, {
      type: 'geojson',
      data,
      cluster: true,
      clusterMaxZoom,
      clusterRadius,
      // clusterProperties typing is loose in maplibre-gl, the inner shape is a
      // valid MapLibre expression spec.
      clusterProperties: buildClusterProperties() as Record<string, unknown>,
    })

    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': buildDominantColorExpr() as never,
        'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 40, 30],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    })

    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#0b0b0b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.2,
      },
    })

    map.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': buildPointColorExpr() as never,
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    const handleClusterClick = async (
      e: MapMouseEvent & { features?: MapGeoJSONFeature[] },
    ) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] })
      if (!features.length) return
      const clusterIdProp = features[0].properties?.cluster_id as number
      const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
      const source = map.getSource(sourceId) as GeoJSONSource
      try {
        const zoom = await source.getClusterExpansionZoom(clusterIdProp)
        map.easeTo({ center: coords, zoom })
      } catch {
        // ignore
      }
    }

    const handlePointClick = (
      e: MapMouseEvent & { features?: MapGeoJSONFeature[] },
    ) => {
      if (!e.features?.length) return
      const feature = e.features[0]
      const coordinates = ((feature.geometry as GeoJSON.Point).coordinates.slice() as [
        number,
        number,
      ])
      // World-copy normalization (consistency with MapClusterLayer)
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }
      onPointClickRef.current(
        feature as unknown as GeoJSON.Feature<GeoJSON.Point, ProjectFeatureProps>,
        coordinates,
      )
    }

    const setPointer = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearPointer = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', clusterLayerId, handleClusterClick)
    map.on('click', pointLayerId, handlePointClick)
    map.on('mouseenter', clusterLayerId, setPointer)
    map.on('mouseleave', clusterLayerId, clearPointer)
    map.on('mouseenter', pointLayerId, setPointer)
    map.on('mouseleave', pointLayerId, clearPointer)

    return () => {
      try {
        map.off('click', clusterLayerId, handleClusterClick)
        map.off('click', pointLayerId, handlePointClick)
        map.off('mouseenter', clusterLayerId, setPointer)
        map.off('mouseleave', clusterLayerId, clearPointer)
        map.off('mouseenter', pointLayerId, setPointer)
        map.off('mouseleave', pointLayerId, clearPointer)
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId)
        if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId)
        if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore teardown errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, sourceId, clusterLayerId, clusterCountLayerId, pointLayerId])

  // Refresh data on prop change without rebuilding layers.
  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(sourceId) as GeoJSONSource | undefined
    if (source) source.setData(data)
  }, [map, isLoaded, sourceId, data])

  return null
}
