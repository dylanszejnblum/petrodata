'use client'

import maplibregl, { type Map as MLMap, type GeoJSONSourceSpecification } from 'maplibre-gl'
import { MapShell, MapLegend } from '@/ui/map-shell'
import { COMMODITY_LABEL, type MineralCommodity, type MineralProject } from '@/fixtures/projects'
import { COMMODITY_HEX } from './commodity-colors'

/* Mapa del hub minero — puntos por proyecto coloreados por commodity,
   popup con nombre/operador/etapa. Réplica del MineralsMap de producción
   sobre el MapShell de Estrato. */

const SOURCE_ID = 'proyectos-mineros'

function toFeatureCollection(projects: MineralProject[]): GeoJSONSourceSpecification['data'] {
  return {
    type: 'FeatureCollection',
    features: projects.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        name: p.name,
        commodity: p.commodity,
        operator: p.operator,
        stage: p.stage,
      },
    })),
  }
}

function stylePopup(popup: maplibregl.Popup) {
  const el = popup.getElement()
  const content = el?.querySelector<HTMLElement>('.maplibregl-popup-content')
  if (content) {
    content.style.background = 'var(--surface)'
    content.style.color = 'var(--text-body)'
    content.style.borderRadius = '8px'
    content.style.border = '1px solid var(--border-default)'
    content.style.padding = '10px 12px'
    content.style.boxShadow = 'var(--elevation-overlay)'
  }
  const tip = el?.querySelector<HTMLElement>('.maplibregl-popup-tip')
  if (tip) tip.style.display = 'none'
}

export function MineralsMap({ projects }: { projects: MineralProject[] }) {
  const onReady = (map: MLMap) => {
    if (map.getSource(SOURCE_ID)) return
    map.addSource(SOURCE_ID, { type: 'geojson', data: toFeatureCollection(projects) })
    map.addLayer({
      id: `${SOURCE_ID}-circles`,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-opacity': 0.9,
        'circle-stroke-width': 1.5,
        /* token-exception: maplibre no resuelve CSS vars */
        'circle-stroke-color': '#ffffff',
        'circle-color': [
          'match',
          ['get', 'commodity'],
          'lithium', COMMODITY_HEX.lithium,
          'copper', COMMODITY_HEX.copper,
          'gold', COMMODITY_HEX.gold,
          'silver', COMMODITY_HEX.silver,
          'uranium', COMMODITY_HEX.uranium,
          COMMODITY_HEX.silver,
        ],
      },
    })

    map.on('click', `${SOURCE_ID}-circles`, (e) => {
      const f = e.features?.[0]
      if (!f || f.geometry.type !== 'Point') return
      const props = f.properties as Record<string, string>
      const popup = new maplibregl.Popup({ closeButton: false, offset: 10 })
        .setLngLat(f.geometry.coordinates as [number, number])
        .setHTML(
          `<div class="text-[12px] leading-snug">
             <p class="font-medium">${props.name}</p>
             <p class="text-secondary">${props.operator}</p>
             <p class="text-secondary">${props.stage}</p>
           </div>`,
        )
        .addTo(map)
      stylePopup(popup)
    })
    map.on('mouseenter', `${SOURCE_ID}-circles`, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', `${SOURCE_ID}-circles`, () => {
      map.getCanvas().style.cursor = ''
    })
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-[10px] border">
      <MapShell center={[-67.5, -32]} zoom={4.4} onReady={onReady} label="Mapa de proyectos mineros de Argentina" />
      <div className="absolute bottom-3 left-3">
        <MapLegend
          title="Commodity"
          items={(Object.keys(COMMODITY_HEX) as MineralCommodity[]).map((c) => ({
            color: COMMODITY_HEX[c],
            label: COMMODITY_LABEL[c],
          }))}
        />
      </div>
    </div>
  )
}
