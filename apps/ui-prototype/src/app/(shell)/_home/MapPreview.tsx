'use client'

import Link from 'next/link'
import type { Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import { formatCompact, formatInteger } from '@/lib/format'
import { HEADLINE } from '@/fixtures/production'
import { WELLS } from '@/fixtures/wells'

/* "Mapa de actividad" — tercer panel de la fila del dashboard, como en
   vacamuerta.io: mapa decorativo (no interactivo) con los pozos agrupados
   en clusters, y al pie el tamaño del catálogo con el enlace al mapa
   completo. */

const SOURCE = 'home-wells'

export function MapPreview() {
  const handleReady = (map: MLMap) => {
    if (map.getSource(SOURCE)) return
    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: WELLS },
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 12,
    })
    /* clusters: el color y el radio crecen con la densidad, como producción */
    map.addLayer({
      id: `${SOURCE}-clusters`,
      type: 'circle',
      source: SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#0aa173',
          50,
          '#9a7420',
          250,
          '#dd4136',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 10, 50, 15, 250, 20],
        'circle-opacity': 0.75,
      },
    })
    map.addLayer({
      id: `${SOURCE}-count`,
      type: 'symbol',
      source: SOURCE,
      filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10 },
      paint: { 'text-color': '#fff' },
    })
    map.addLayer({
      id: `${SOURCE}-point`,
      type: 'circle',
      source: SOURCE,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#0aa173',
        'circle-radius': 3,
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.6)',
      },
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border bg-surface">
      <div className="flex items-baseline justify-between gap-3 px-5 py-3">
        <span className="type-label">Mapa de actividad</span>
        <span className="type-label tnums">{formatInteger(WELLS.length)} muestreados</span>
      </div>
      <div className="h-[200px] w-full border-y">
        <MapShell
          className="h-full w-full"
          label="Mapa de actividad de la cuenca"
          interactive={false}
          zoom={5.4}
          onReady={handleReady}
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 px-5 py-3">
        <span>
          <span className="type-kpi block text-xl">{formatCompact(HEADLINE.catalogWells)}</span>
          <span className="type-label mt-0.5 block">pozos en el catálogo</span>
        </span>
        <Link href="/map" className="type-label !text-primary hover:underline">
          Abrir mapa completo →
        </Link>
      </div>
    </div>
  )
}
