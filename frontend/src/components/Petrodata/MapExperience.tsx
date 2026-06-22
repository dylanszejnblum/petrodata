'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { BarChart3, SlidersHorizontal } from 'lucide-react'
import { useTheme } from '@/providers/Theme'
import {
  Map,
  MapClusterLayer,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  type MapRef,
  type MapViewport,
  type SymbolLayerFilter,
} from '@/components/ui/map'
import { api, type ApiSchemas } from '@/api/client'
import type { paths } from '@/api/types'
import { OverviewCard } from './map/OverviewCard'
import { FilterPanel, DEFAULT_FILTERS, type WellFilters, type FilterOption } from './map/FilterPanel'
import { TopOperatorsCard } from './map/TopOperatorsCard'
import { ARGENTINA_BOUNDS, BASIN_BOUNDS, PROVINCE_BOUNDS, type Bounds } from './map/regions'
import { BasinAreasLayer } from './map/BasinAreasLayer'
import { WellPopup } from './map/WellPopup'

type WellProps = ApiSchemas['GeoWellPropertiesDto']
type WellFeatureCollection = ApiSchemas['GeoWellFeatureCollectionDto']
type LatestSummary = ApiSchemas['LatestSummaryDto']
type OperatorItem = ApiSchemas['OperatorListItemDto']
type OperatorPoint = ApiSchemas['OperatorTimeSeriesPointDto']

type WellsQuery = NonNullable<
  paths['/api/v1/geo/wells']['get']['parameters']['query']
>

type Selected = {
  longitude: number
  latitude: number
  properties: WellProps
}

const ARGENTINA_VIEWPORT: Partial<MapViewport> = {
  center: [-64.5, -38],
  zoom: 4.1,
}

const FETCH_DEBOUNCE_MS = 350
const WELL_LIMIT = 1000

// Wells are fetched for an area larger than the viewport so that panning within
// that margin needs no refetch. We only refetch once the viewport leaves the
// last-fetched area, or zooms in enough to want denser data.
const BBOX_MARGIN = 0.3
const REFETCH_ZOOM_DELTA = 0.5

type Bbox = [number, number, number, number]

function expandBbox([w, s, e, n]: Bbox, margin: number): Bbox {
  const dx = (e - w) * margin
  const dy = (n - s) * margin
  return [w - dx, s - dy, e + dx, n + dy]
}

// True when `inner` lies entirely within `outer`.
function bboxContains(outer: Bbox, inner: Bbox): boolean {
  return inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3]
}

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'

const transformRequest = (url: string) => {
  if (url.startsWith(CARTO_FONTS_PREFIX)) {
    return { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
  }
  return { url }
}

// Matches every SEN status that means the well is abandoned or in process of
// abandonment: "Abandono Definitivo", "Abandono Transitorio", "Abandonado",
// "En Espera de Abandono", etc. The stem "abandon" catches both the noun
// ("abandono") and the participle ("abandonado") in any casing.
function isAbandonedStatus(statusCode: string | null | undefined): boolean {
  return !!statusCode && /abandon/i.test(statusCode)
}

// Draw a "G" on the individual dots of gas wells (only visible once zoomed in
// past clustering, where dots are spread out). Module constant so its identity
// stays stable across renders.
const GAS_WELL_LABEL = {
  text: 'G',
  filter: ['==', ['get', 'well_type'], 'Gasífero'] as SymbolLayerFilter,
  color: '#ffffff',
}

function pickRegionBounds(filters: WellFilters): Bounds | null {
  if (filters.province && PROVINCE_BOUNDS[filters.province]) return PROVINCE_BOUNDS[filters.province]
  if (filters.basin && BASIN_BOUNDS[filters.basin]) return BASIN_BOUNDS[filters.basin]
  if (!filters.province && !filters.basin) return ARGENTINA_BOUNDS
  return null
}

function buildQuery(filters: WellFilters, bbox: [number, number, number, number] | null): WellsQuery {
  const query: WellsQuery = { limit: WELL_LIMIT }
  if (filters.formation) query.formation = filters.formation
  if (filters.operator) query.operator = filters.operator
  if (filters.basin) query.basin = filters.basin
  if (filters.province) query.province = filters.province
  if (bbox) query.bbox = bbox.map((n) => n.toFixed(3)).join(',')
  return query
}

export function MapExperience({
  initialWells,
  latest,
  operators,
  topOperatorTimeSeries,
  initialOperator = null,
}: {
  initialWells: WellFeatureCollection
  latest: LatestSummary
  operators: OperatorItem[]
  topOperatorTimeSeries: OperatorPoint[]
  /** Preselect an operator filter (e.g. deep-linked from the dashboard). */
  initialOperator?: string | null
}) {
  const { theme } = useTheme()
  const mapRef = useRef<MapRef | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastQueryKey = useRef<string>('')
  // The margin-expanded bbox (and zoom) we last fetched, used to skip refetches
  // while the viewport stays inside the already-loaded area.
  const lastFetchedRef = useRef<{ bbox: Bbox; zoom: number } | null>(null)
  const cacheRef = useRef<globalThis.Map<string, WellFeatureCollection>>(new globalThis.Map())
  const CACHE_LIMIT = 12
  const prevRegionRef = useRef<{ province: string | null; basin: string | null }>({
    province: DEFAULT_FILTERS.province,
    basin: DEFAULT_FILTERS.basin,
  })

  const [features, setFeatures] = useState<WellFeatureCollection>(initialWells)
  const [filters, setFilters] = useState<WellFilters>(() =>
    initialOperator ? { ...DEFAULT_FILTERS, operator: initialOperator } : DEFAULT_FILTERS,
  )
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [mobilePanel, setMobilePanel] = useState<'none' | 'info' | 'filters'>('none')

  const t = useTranslations('mapPage')

  const operatorOptions = useMemo<FilterOption[]>(
    () =>
      operators.slice(0, 30).map((op) => ({
        value: op.operator_slug,
        label: op.operator_name,
      })),
    [operators],
  )

  const fetchWells = useCallback(
    async (next: WellFilters, nextBbox: [number, number, number, number] | null) => {
      const query = buildQuery(next, nextBbox)
      const key = JSON.stringify(query)
      if (key === lastQueryKey.current) return

      const cached = cacheRef.current.get(key)
      if (cached) {
        lastQueryKey.current = key
        setFeatures(cached)
        return
      }

      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      lastQueryKey.current = key
      setLoading(true)
      try {
        const { data, error } = await api.GET('/api/v1/geo/wells', {
          params: { query },
          signal: ctrl.signal,
          cache: 'no-store',
        })
        if (ctrl.signal.aborted) return
        if (error || !data) {
          setFeatures({ type: 'FeatureCollection', features: [] } as WellFeatureCollection)
        } else {
          // LRU eviction
          if (cacheRef.current.size >= CACHE_LIMIT) {
            const oldestKey = cacheRef.current.keys().next().value
            if (oldestKey) cacheRef.current.delete(oldestKey)
          }
          cacheRef.current.set(key, data)
          setFeatures(data)
        }
      } catch {
        // aborted or network error — leave previous features in place
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    },
    [],
  )

  // refetch when filters change (immediate, no debounce), and fly to province/basin bounds
  useEffect(() => {
    if (lastQueryKey.current === '') {
      // seed key from the initial filters + null bbox so the server data (which the
      // page fetched with the same operator filter) isn't re-fetched on mount
      lastQueryKey.current = JSON.stringify(buildQuery(filters, null))
      return
    }

    const prev = prevRegionRef.current
    const provinceChanged = prev.province !== filters.province
    const basinChanged = prev.basin !== filters.basin
    prevRegionRef.current = { province: filters.province, basin: filters.basin }

    if (provinceChanged || basinChanged) {
      const target = pickRegionBounds(filters)
      const map = mapRef.current
      if (map && target) {
        map.fitBounds(target, {
          padding: { top: 96, bottom: 96, left: 336, right: 336 },
          duration: 800,
          maxZoom: 9,
        })
        // bbox-driven refetch will trigger via the 'move' event after fitBounds
        return
      }
    }

    fetchWells(filters, bbox)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleViewportChange = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const visible: Bbox = [sw.lng, sw.lat, ne.lng, ne.lat]
      const zoom = map.getZoom()

      // Skip while the viewport stays inside the loaded area and hasn't zoomed
      // in enough to need denser data — avoids redundant fetches and the cluster
      // flicker that a wholesale data swap causes on every small pan.
      const last = lastFetchedRef.current
      if (last && bboxContains(last.bbox, visible) && zoom <= last.zoom + REFETCH_ZOOM_DELTA) {
        return
      }

      const fetchBbox = expandBbox(visible, BBOX_MARGIN)
      lastFetchedRef.current = { bbox: fetchBbox, zoom }
      setBbox(fetchBbox)
      fetchWells(filters, fetchBbox)
    }, FETCH_DEBOUNCE_MS)
  }, [filters, fetchWells])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const featureCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, WellProps>>(() => {
    const raw = features as unknown as GeoJSON.FeatureCollection<GeoJSON.Point, WellProps>
    const filtered = raw.features.filter((f) => {
      const p = f.properties
      if (!p) return false
      if (filters.status && p.status_code !== filters.status) return false
      if (filters.hideAbandoned && isAbandonedStatus(p.status_code)) return false
      if (filters.wellType === 'oil' && p.well_type !== 'Petrolífero') return false
      if (filters.wellType === 'gas' && p.well_type !== 'Gasífero') return false
      return true
    })
    return { type: 'FeatureCollection', features: filtered }
  }, [features, filters.status, filters.hideAbandoned, filters.wellType])
  const featureCount = featureCollection.features.length
  const rawCount = (features as unknown as GeoJSON.FeatureCollection<GeoJSON.Point, WellProps>).features
    .length

  const handleSelectOperator = useCallback((slug: string | null) => {
    setFilters((prev) => ({ ...prev, operator: slug }))
  }, [])

  const handleBasinClick = useCallback((name: string) => {
    setFilters((prev) => ({ ...prev, basin: name }))
  }, [])

  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, WellProps>, coordinates: [number, number]) => {
      if (!feature.properties) return
      setSelected({
        longitude: coordinates[0],
        latitude: coordinates[1],
        properties: feature.properties,
      })
    },
    [],
  )

  const handlePopupClose = useCallback(() => setSelected(null), [])

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        className="h-full w-full"
        theme={theme === 'dark' ? 'dark' : 'light'}
        viewport={ARGENTINA_VIEWPORT}
        onViewportChange={handleViewportChange}
        renderWorldCopies={false}
        transformRequest={transformRequest}
      >
        <MapControls position="bottom-right" showZoom showCompass showFullscreen />
        <BasinAreasLayer selectedBasin={filters.basin} onBasinClick={handleBasinClick} />
        <MapClusterLayer<WellProps>
          data={featureCollection}
          clusterRadius={50}
          clusterMaxZoom={12}
          clusterColors={['#22c55e', '#eab308', '#ef4444']}
          clusterThresholds={[50, 250]}
          pointColor="#22c55e"
          pointLabel={GAS_WELL_LABEL}
          onPointClick={handlePointClick}
        />
        {selected && (
          <>
            <MapMarker longitude={selected.longitude} latitude={selected.latitude}>
              <MarkerContent>
                <div className="relative grid place-items-center">
                  <span
                    className="absolute inline-block h-5 w-5 rounded-full animate-ping"
                    style={{ backgroundColor: 'var(--nd-success)', opacity: 0.5 }}
                  />
                  <span
                    className="relative inline-block h-3 w-3 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: 'var(--nd-success)' }}
                  />
                </div>
              </MarkerContent>
            </MapMarker>
            <MapPopup
              longitude={selected.longitude}
              latitude={selected.latitude}
              offset={22}
              onClose={handlePopupClose}
              closeButton
              maxWidth="22rem"
              className="!p-0 rounded-none border-nd-border bg-nd-surface text-nd-text-primary"
            >
              <WellPopup well={selected.properties} />
            </MapPopup>
          </>
        )}
      </Map>

      {/* Desktop overlay: two columns */}
      <div className="pointer-events-none absolute inset-0 hidden justify-between gap-4 p-4 md:flex">
        <div className="flex w-[20rem] flex-col gap-4">
          <OverviewCard
            latest={latest}
            topOperatorSlug={operators[0]?.operator_slug ?? null}
            topOperatorName={operators[0]?.operator_name ?? null}
            timeSeries={topOperatorTimeSeries}
          />
          <TopOperatorsCard
            operators={operators}
            selectedSlug={filters.operator}
            onSelect={handleSelectOperator}
          />
        </div>
        <div className="w-[20rem]">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            operatorOptions={operatorOptions}
            resultCount={featureCount}
            rawCount={rawCount}
            resultCap={WELL_LIMIT}
            loading={loading}
          />
        </div>
      </div>

      {/* Mobile: top toggle bar + drop-down panel */}
      <div className="md:hidden">
        <div className="absolute inset-x-0 top-0 z-20 flex border-b border-nd-border bg-nd-surface/95 backdrop-blur">
          <MobileToggle
            active={mobilePanel === 'info'}
            onClick={() => setMobilePanel((p) => (p === 'info' ? 'none' : 'info'))}
            icon={<BarChart3 size={14} />}
            label={t('summary')}
          />
          <MobileToggle
            active={mobilePanel === 'filters'}
            onClick={() => setMobilePanel((p) => (p === 'filters' ? 'none' : 'filters'))}
            icon={<SlidersHorizontal size={14} />}
            label={`${t('filters.title')} · ${featureCount}`}
          />
        </div>
        {mobilePanel !== 'none' && (
          <div className="absolute inset-x-0 top-[2.6rem] z-10 flex max-h-[72vh] flex-col gap-3 overflow-y-auto border-b border-nd-border bg-nd-surface/95 p-3 backdrop-blur">
            {mobilePanel === 'info' ? (
              <>
                <OverviewCard
                  latest={latest}
                  topOperatorSlug={operators[0]?.operator_slug ?? null}
                  topOperatorName={operators[0]?.operator_name ?? null}
                  timeSeries={topOperatorTimeSeries}
                />
                <TopOperatorsCard
                  operators={operators}
                  selectedSlug={filters.operator}
                  onSelect={handleSelectOperator}
                />
              </>
            ) : (
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                operatorOptions={operatorOptions}
                resultCount={featureCount}
                rawCount={rawCount}
                resultCap={WELL_LIMIT}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MobileToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] font-mono transition-colors"
      style={{
        color: active ? 'var(--nd-text-display)' : 'var(--nd-text-secondary)',
        boxShadow: active ? 'inset 0 -2px 0 0 var(--nd-accent)' : undefined,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

