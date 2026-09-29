'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import { WELLS } from '@/fixtures/wells'
import { PanelFiltros, PanelOperadores, type Recurso } from './Paneles'

/* El mapa se reusa tal cual —MapShell absorbe el boilerplate de MapLibre— y
   lo único que cambia es la paleta de los clusters, que pasa a los colores de
   estado del sistema: verde, naranja y rojo según la densidad.

   El encuadre se calcula de los datos con fitBounds en vez de fijar un zoom.
   Con el mapa a sangre la superficie pasó de 608×420 a más de 1300×900, y un
   zoom fijo que servía para la caja chica dejaba la cuenca como un puñado de
   puntos en el medio de medio continente.

   Los filtros son reales, no decorativos: recalculan el GeoJSON y actualizan
   la fuente. El conteo de los paneles sale del mismo cálculo, así no puede
   desincronizarse del mapa. */

const SOURCE = 'v2-wells'
const VERDE = '#189a4d'
const NARANJA = '#ef720c'
const ROJO = '#e3474c'
/** mil m³ de gas ≈ 6,1 barriles equivalentes (1 boe ≈ 164 m³) */
const BOE_POR_MM3 = 6.1

export function MapaV2() {
  const [recurso, setRecurso] = useState<Recurso>('todos')
  const [ocultar, setOcultar] = useState(false)
  /* La operadora puede venir en la URL: las cards de empresas enlazan acá con
     ?operadora=<slug> y el mapa tiene que abrir ya filtrado, o el enlace
     prometería algo que no cumple. Es el valor INICIAL nada más — después el
     panel manda, y volver a tocar el filtro no reescribe la URL. */
  const params = useSearchParams()
  const [operadora, setOperadora] = useState(() => params.get('operadora') ?? '')
  const mapaRef = useRef<MLMap | null>(null)
  const [listo, setListo] = useState(false)

  /* La lista del panel sale de los pozos del mapa, no de un ranking fijo:
     así lo que se puede filtrar es exactamente lo que se está viendo. Se
     cuenta sobre TODOS los pozos y no sobre los visibles, para que elegir una
     operadora no borre a las demás de la lista. */
  const operadoras = useMemo(() => {
    const m = new Map<string, { slug: string; nombre: string; pozos: number }>()
    for (const w of WELLS) {
      const { operator, operatorName } = w.properties
      const x = m.get(operator) ?? { slug: operator, nombre: operatorName, pozos: 0 }
      x.pozos++
      m.set(operator, x)
    }
    return [...m.values()].sort((a, b) => b.pozos - a.pozos)
  }, [])

  const visibles = useMemo(
    () =>
      WELLS.filter((w) => {
        const p = w.properties
        if (operadora && p.operator !== operadora) return false
        if (ocultar && p.status === 'abandonado') return false
        /* La comparación va en BOE, no en los números crudos: el petróleo
           está en bbl/d y el gas en Mm³/d, así que compararlos directo decía
           que sólo 11 de 220 pozos eran de gas. Con mil metros cúbicos ≈ 6,1
           barriles equivalentes, el gas domina en 75, que es el reparto real
           de la muestra. */
        const gasBoe = p.gas * BOE_POR_MM3
        if (recurso === 'petroleo' && p.oil <= gasBoe) return false
        if (recurso === 'gas' && gasBoe <= p.oil) return false
        return true
      }),
    [recurso, ocultar, operadora],
  )

  /* Al cambiar el filtro se reemplazan los datos de la fuente en vez de
     reconstruir el mapa: así el encuadre queda donde lo dejó el usuario.

     Va en un efecto y no en el cuerpo del render: tocar el mapa mientras
     React renderiza es un efecto secundario en render, que con StrictMode
     corre dos veces y en modo concurrente puede correr sobre un render que
     después se descarta. */
  useEffect(() => {
    if (!listo) return
    const src = mapaRef.current?.getSource(SOURCE) as GeoJSONSource | undefined
    src?.setData({ type: 'FeatureCollection', features: visibles })
  }, [visibles, listo])

  const handleReady = (map: MLMap) => {
    if (map.getSource(SOURCE)) return

    let oeste = 180, este = -180, sur = 90, norte = -90
    for (const w of WELLS) {
      const [lng, lat] = w.geometry.coordinates
      if (lng < oeste) oeste = lng
      if (lng > este) este = lng
      if (lat < sur) sur = lat
      if (lat > norte) norte = lat
    }
    map.fitBounds([[oeste, sur], [este, norte]], { padding: 64, animate: false })

    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: visibles },
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 12,
    })
    map.addLayer({
      id: `${SOURCE}-clusters`,
      type: 'circle',
      source: SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], VERDE, 50, NARANJA, 250, ROJO],
        'circle-radius': ['step', ['get', 'point_count'], 10, 50, 15, 250, 20],
        'circle-opacity': 0.8,
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
        'circle-color': VERDE,
        'circle-radius': 3,
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.6)',
      },
    })
    mapaRef.current = map
    setListo(true)
  }

  return (
    <div className="relative h-full w-full">
      <MapShell
        className="h-full w-full"
        label="Mapa de actividad de la cuenca Neuquina"
        controlPosition="bottom-right"
        onReady={handleReady}
      />

      {/* Los paneles no capturan el puntero salvo ellos mismos, así el mapa
          se sigue pudiendo arrastrar por los huecos entre ellos.

          Dos columnas: a la izquierda el resumen arriba y las operadoras
          abajo; a la derecha los filtros y las referencias, las dos arriba.
          El ángulo inferior derecho queda LIBRE a propósito: ahí viven los
          controles de zoom y la atribución de MapLibre. Con las referencias
          ahí abajo se solapaban con el zoom en todos los tamaños. */}
      {/* Los paneles no capturan el puntero salvo ellos mismos, así el mapa
          se sigue pudiendo arrastrar por los huecos entre ellos.

          Dos paneles, los dos arriba: a la izquierda las operadoras con su
          buscador, a la derecha los filtros. El ángulo
          inferior derecho queda LIBRE a propósito: ahí viven los controles de
          zoom y la atribución de MapLibre.

          `items-start` es necesario: sin él los paneles heredan el stretch
          del flex y se estiran a todo el alto del mapa, dejando un bloque
          blanco vacío debajo del pie. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-between gap-3 p-4">
        <PanelOperadores
          operadoras={operadoras}
          seleccionada={operadora}
          onSeleccionar={setOperadora}
        />
        <PanelFiltros
          recurso={recurso}
          onRecurso={setRecurso}
          ocultarAbandonados={ocultar}
          onOcultar={setOcultar}
          visibles={visibles.length}
          total={WELLS.length}
        />
      </div>
    </div>
  )
}
