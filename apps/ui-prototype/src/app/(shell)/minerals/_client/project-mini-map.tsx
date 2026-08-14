'use client'

import type { Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import { COMMODITY_HEX } from './commodity-colors'
import type { MineralProject } from '@/fixtures/projects'

/* Mini mapa de ubicación de la ficha de proyecto — un solo punto. */

const SOURCE_ID = 'proyecto-ubicacion'

export function ProjectMiniMap({
  name,
  lng,
  lat,
  commodity,
}: {
  name: string
  lng: number
  lat: number
  commodity: MineralProject['commodity']
}) {
  const onReady = (map: MLMap) => {
    if (map.getSource(SOURCE_ID)) return
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }],
      },
    })
    map.addLayer({
      id: `${SOURCE_ID}-circle`,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 8,
        'circle-color': COMMODITY_HEX[commodity],
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        /* token-exception: maplibre no resuelve CSS vars */
        'circle-stroke-color': '#ffffff',
      },
    })
  }

  return (
    <div className="h-[320px] overflow-hidden rounded-[10px] border">
      <MapShell center={[lng, lat]} zoom={8} onReady={onReady} label={`Ubicación del proyecto ${name}`} />
    </div>
  )
}
