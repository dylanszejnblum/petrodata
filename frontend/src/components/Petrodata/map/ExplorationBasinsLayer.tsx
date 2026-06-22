'use client'

import { useEffect, useId } from 'react'
import { useMap } from '@/components/ui/map'
import { AR_EXPLORATION_BASINS } from './arExplorationBasins'

// Display-only overlay for Argentina's frontier / exploration basins
// (non-producing, onshore + offshore). Muted, dashed and non-interactive, so
// they read clearly as "exploration acreage" — distinct from the producing
// basins (BasinAreasLayer), which are green, filled and clickable.
export function ExplorationBasinsLayer() {
  const { map, isLoaded } = useMap()
  const uid = useId()
  const sourceId = `explor-basins-source-${uid}`
  const fillId = `explor-basins-fill-${uid}`
  const lineId = `explor-basins-line-${uid}`
  const labelId = `explor-basins-label-${uid}`

  useEffect(() => {
    if (!map || !isLoaded) return

    map.addSource(sourceId, { type: 'geojson', data: AR_EXPLORATION_BASINS })

    map.addLayer({
      id: fillId,
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': '#64748b', 'fill-opacity': 0.05 },
    })

    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#94a3b8',
        'line-width': 1,
        'line-opacity': 0.5,
        'line-dasharray': [2, 2],
      },
    })

    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans'],
        'text-size': 10,
        'text-letter-spacing': 0.1,
        'text-transform': 'uppercase',
        'text-padding': 4,
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': 'rgba(0,0,0,0.5)',
        'text-halo-width': 1,
      },
    })

    return () => {
      try {
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

  return null
}
