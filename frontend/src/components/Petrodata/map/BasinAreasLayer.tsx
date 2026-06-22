'use client'

import { useEffect, useId } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import { useMap } from '@/components/ui/map'
import { AR_BASINS } from './arBasins'

type BasinGeometry = GeoJSON.MultiPolygon | GeoJSON.Polygon
type BasinProps = { name: string; isSelected: boolean }

// Real basin outlines (AR_BASINS) with the current selection state stamped on
// each feature so the fill/line layers can highlight the selected basin.
function buildFeatureCollection(
  selected: string | null,
): GeoJSON.FeatureCollection<BasinGeometry, BasinProps> {
  return {
    type: 'FeatureCollection',
    features: AR_BASINS.features.map((f) => ({
      type: 'Feature',
      properties: { name: f.properties.name, isSelected: f.properties.name === selected },
      geometry: f.geometry,
    })),
  }
}

export function BasinAreasLayer({
  selectedBasin,
  onBasinClick,
}: {
  selectedBasin: string | null
  onBasinClick: (basin: string) => void
}) {
  const { map, isLoaded } = useMap()
  const uid = useId()
  const sourceId = `basins-source-${uid}`
  const fillId = `basins-fill-${uid}`
  const lineId = `basins-line-${uid}`
  const labelId = `basins-label-${uid}`

  useEffect(() => {
    if (!map || !isLoaded) return

    map.addSource(sourceId, {
      type: 'geojson',
      data: buildFeatureCollection(selectedBasin),
    })

    map.addLayer({
      id: fillId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': ['case', ['get', 'isSelected'], 0.18, 0.06],
      },
    })

    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#22c55e',
        'line-width': ['case', ['get', 'isSelected'], 2, 1],
        'line-opacity': ['case', ['get', 'isSelected'], 1, 0.45],
        'line-dasharray': ['case', ['get', 'isSelected'], ['literal', [1, 0]], ['literal', [3, 2]]],
      },
    })

    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans'],
        'text-size': 11,
        'text-letter-spacing': 0.12,
        'text-transform': 'uppercase',
        'text-padding': 4,
      },
      paint: {
        'text-color': '#22c55e',
        'text-halo-color': 'rgba(0,0,0,0.5)',
        'text-halo-width': 1.2,
      },
    })

    const onClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const feature = e.features?.[0]
      const name = feature?.properties?.name as string | undefined
      if (name) onBasinClick(name)
    }

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', fillId, onClick)
    map.on('mouseenter', fillId, onEnter)
    map.on('mouseleave', fillId, onLeave)

    return () => {
      try {
        map.off('click', fillId, onClick)
        map.off('mouseenter', fillId, onEnter)
        map.off('mouseleave', fillId, onLeave)
        if (map.getLayer(labelId)) map.removeLayer(labelId)
        if (map.getLayer(lineId)) map.removeLayer(lineId)
        if (map.getLayer(fillId)) map.removeLayer(fillId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore teardown errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, sourceId, fillId, lineId, labelId])

  // Reactively update selection without rebuilding layers
  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(sourceId) as GeoJSONSource | undefined
    if (source) {
      source.setData(buildFeatureCollection(selectedBasin))
    }
  }, [map, isLoaded, sourceId, selectedBasin])

  return null
}
