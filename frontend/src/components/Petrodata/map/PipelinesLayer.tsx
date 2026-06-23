'use client'

import { useEffect, useId, useRef } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import { useMap } from '@/components/ui/map'
import { GAS_COLOR, OIL_COLOR, type PipelineProps, type PipelineNodeProps } from './PipelinePopup'

// Argentina's trunk pipeline overlay: gas transport network (ENARGAS) + oil trunk
// lines (Res. 319/93). The geometry is a static, simplified artifact built by
// scripts/build-pipelines.py and served from /public — fetched once and cached so
// re-mounts (theme toggles, navigation) don't refetch.
const PIPELINES_URL = '/data/ar-pipelines.geojson'

// Ducts only become clickable once zoomed in past the basin-overview range, so
// that at country/basin zoom a click selects the basin underneath rather than a
// line crossing it. The basin fly-to caps at zoom 9, so this sits just above it.
const PIPELINE_CLICK_MIN_ZOOM = 10

// Compressor-plant nodes only appear once zoomed in (they'd clutter the country
// view), and their labels only once zoomed in further still.
const NODE_MIN_ZOOM = 8
const NODE_LABEL_MIN_ZOOM = 10

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

let pipelinesCache: Promise<GeoJSON.FeatureCollection> | null = null
function loadPipelines(): Promise<GeoJSON.FeatureCollection> {
  if (!pipelinesCache) {
    pipelinesCache = fetch(PIPELINES_URL)
      .then((r) => (r.ok ? (r.json() as Promise<GeoJSON.FeatureCollection>) : EMPTY))
      .catch(() => EMPTY)
  }
  return pipelinesCache
}

// Lines thicken with zoom so the network reads as faint threads at country scale
// and clear arteries once zoomed into a basin. Resource-coloured (oil red / gas
// blue). Inlined per-layer rather than shared consts so MapLibre's paint types
// apply in place (matching BasinAreasLayer's style).
const lineWidth: maplibregl.DataDrivenPropertyValueSpecification<number> = [
  'interpolate',
  ['linear'],
  ['zoom'],
  4,
  0.8,
  6,
  1.6,
  9,
  2.6,
  12,
  3.8,
]
const lineColor: maplibregl.DataDrivenPropertyValueSpecification<string> = [
  'match',
  ['get', 'kind'],
  'oil',
  OIL_COLOR,
  GAS_COLOR,
]

export function PipelinesLayer({
  visible,
  onSelect,
  onSelectNode,
}: {
  visible: boolean
  onSelect: (pipeline: PipelineProps, lngLat: [number, number]) => void
  onSelectNode: (node: PipelineNodeProps, lngLat: [number, number]) => void
}) {
  const { map, isLoaded } = useMap()
  const uid = useId()

  // The map event handlers below are bound once (in the mount effect), so they
  // must read the callbacks through refs to always hit the latest props rather
  // than a stale closure captured at bind time.
  const onSelectRef = useRef(onSelect)
  const onSelectNodeRef = useRef(onSelectNode)
  useEffect(() => {
    onSelectRef.current = onSelect
    onSelectNodeRef.current = onSelectNode
  }, [onSelect, onSelectNode])

  const sourceId = `pipelines-source-${uid}`
  const lineId = `pipelines-line-${uid}`
  const projectedId = `pipelines-projected-${uid}`
  const nodeId = `pipelines-node-${uid}`
  const nodeLabelId = `pipelines-node-label-${uid}`

  useEffect(() => {
    if (!map || !isLoaded) return

    map.addSource(sourceId, { type: 'geojson', data: EMPTY })

    // Built/operational ducts — solid, coloured by resource. (Node points are
    // excluded; they have no `subtype` and would otherwise pass this filter.)
    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      filter: ['all', ['!=', ['get', 'kind'], 'node'], ['!=', ['get', 'subtype'], 'Proyecto']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth,
        'line-opacity': 0.85,
      },
    })

    // Projected gas ducts (e.g. reversals/expansions) — dashed, dimmer.
    map.addLayer({
      id: projectedId,
      type: 'line',
      source: sourceId,
      filter: ['all', ['!=', ['get', 'kind'], 'node'], ['==', ['get', 'subtype'], 'Proyecto']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth,
        'line-opacity': 0.6,
        'line-dasharray': [2, 2],
      },
    })

    // Compressor-plant nodes — white dots ringed in gas blue, revealed on zoom-in.
    map.addLayer({
      id: nodeId,
      type: 'circle',
      source: sourceId,
      filter: ['==', ['get', 'kind'], 'node'],
      minzoom: NODE_MIN_ZOOM,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 12, 5],
        'circle-color': '#ffffff',
        'circle-stroke-color': GAS_COLOR,
        'circle-stroke-width': 1.75,
        'circle-opacity': 0.95,
      },
    })

    map.addLayer({
      id: nodeLabelId,
      type: 'symbol',
      source: sourceId,
      filter: ['==', ['get', 'kind'], 'node'],
      minzoom: NODE_LABEL_MIN_ZOOM,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans'],
        'text-size': 11,
        'text-offset': [0, 1.1],
        'text-anchor': 'top',
        'text-padding': 6,
      },
      paint: {
        'text-color': GAS_COLOR,
        'text-halo-color': 'rgba(255,255,255,0.85)',
        'text-halo-width': 1.2,
      },
    })

    loadPipelines().then((data) => {
      const src = map.getSource(sourceId) as GeoJSONSource | undefined
      if (src) src.setData(data)
    })

    const onClick = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
    ) => {
      // Below the threshold, let the click fall through to the basin underneath.
      if (map.getZoom() < PIPELINE_CLICK_MIN_ZOOM) return
      // A compressor node sits on top of its line — let the node own the click.
      if (map.queryRenderedFeatures(e.point, { layers: [nodeId] }).length) return
      const props = e.features?.[0]?.properties as PipelineProps | undefined
      if (props) onSelectRef.current(props, [e.lngLat.lng, e.lngLat.lat])
    }
    const onEnter = () => {
      // Only advertise the duct as clickable where clicking it actually does something.
      if (map.getZoom() < PIPELINE_CLICK_MIN_ZOOM) return
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    // Nodes are clickable wherever they're visible (zoom ≥ NODE_MIN_ZOOM).
    const onNodeClick = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
    ) => {
      const props = e.features?.[0]?.properties as PipelineNodeProps | undefined
      if (props) onSelectNodeRef.current(props, [e.lngLat.lng, e.lngLat.lat])
    }
    const onNodeEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    for (const id of [lineId, projectedId]) {
      map.on('click', id, onClick)
      map.on('mouseenter', id, onEnter)
      map.on('mouseleave', id, onLeave)
    }
    map.on('click', nodeId, onNodeClick)
    map.on('mouseenter', nodeId, onNodeEnter)
    map.on('mouseleave', nodeId, onLeave)

    return () => {
      try {
        for (const id of [lineId, projectedId]) {
          map.off('click', id, onClick)
          map.off('mouseenter', id, onEnter)
          map.off('mouseleave', id, onLeave)
        }
        map.off('click', nodeId, onNodeClick)
        map.off('mouseenter', nodeId, onNodeEnter)
        map.off('mouseleave', nodeId, onLeave)
        for (const id of [lineId, projectedId, nodeId, nodeLabelId]) {
          if (map.getLayer(id)) map.removeLayer(id)
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore teardown errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, sourceId, lineId, projectedId, nodeId, nodeLabelId])

  // Toggle visibility without rebuilding the layers.
  useEffect(() => {
    if (!map || !isLoaded) return
    const v = visible ? 'visible' : 'none'
    for (const id of [lineId, projectedId, nodeId, nodeLabelId]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
    }
  }, [map, isLoaded, visible, lineId, projectedId, nodeId, nodeLabelId])

  return null
}
