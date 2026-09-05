'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useSearchParams } from 'next/navigation'
import maplibregl, { type GeoJSONSource, type Map as MLMap, type MapMouseEvent } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import type { WellFeature } from '@/fixtures/wells'
import type { OperadorPais } from '@/lib/data/production'
import { fetchWellsByOperator } from '@/lib/data/wells'
import { PanelFiltros, PanelOperadores, PanelProduccion, type Recurso } from './Paneles'
import { PopupPozo } from './PopupPozo'

/* El mapa se reusa tal cual —MapShell absorbe el boilerplate de MapLibre— y
   lo único que cambia es la paleta de los clusters, que pasa a los colores de
   estado del sistema: verde, naranja y rojo según la densidad.

   El encuadre se calcula de los datos con fitBounds en vez de fijar un zoom.
   Con el mapa a sangre la superficie pasó de 608×420 a más de 1300×900, y un
   zoom fijo que servía para la caja chica dejaba la cuenca como un puñado de
   puntos en el medio de medio continente.

   Los filtros son reales, no decorativos: recalculan el GeoJSON y actualizan
   la fuente. El conteo de los paneles sale del mismo cálculo, así no puede
   desincronizarse del mapa.

   DATOS EN VIVO (la paridad con la v1): el ranking del panel y la serie de
   producción salen de /v1/operators y /v1/operators/{slug}/production, y al
   seleccionar una operadora el mapa vuelve a pedir /v1/geo/wells?operator= —
   la muestra inicial son 1.000 pozos, pero los de la operadora elegida
   llegan completos. El popup del pozo busca /v1/wells/{id} al abrirlo. */

const SOURCE = 'v2-wells'
const VERDE = '#189a4d'
const NARANJA = '#ef720c'
const ROJO = '#e3474c'
export function MapaV2({
  wells: WELLS,
  operadores: OPERADORES = [],
}: {
  wells: WellFeature[]
  /** ranking nacional por BOE (loadOperators); ordena el panel */
  operadores?: OperadorPais[]
}) {
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

  /* Al elegir una operadora se piden SUS pozos completos —no sólo los que
     cayeron en la muestra— con el mismo ?operator= de la API que usa la v1.
     Mientras llega, el mapa sigue mostrando los que tiene: un mapa que se
      vacía un instante para llenarse después se lee como un parpadeo roto. */
  const [pozosOperadora, setPozosOperadora] = useState<WellFeature[] | null>(null)
  useEffect(() => {
    if (!operadora) {
      setPozosOperadora(null)
      return
    }
    let vivo = true
    fetchWellsByOperator(operadora).then((res) => {
      if (vivo) setPozosOperadora(res)
    })
    return () => {
      vivo = false
    }
  }, [operadora])

  /* La base sobre la que se filtra: los pozos de la operadora si hay, si no
     la muestra completa. */
  const base = pozosOperadora ?? WELLS

  /* La lista del panel sale de los pozos del mapa, no de un ranking fijo:
     así lo que se puede filtrar es exactamente lo que se está viendo. Se
     cuenta sobre TODOS los pozos y no sobre los visibles, para que elegir una
     operadora no borre a las demás de la lista.

     EL ORDEN sí es el del ranking nacional por BOE (/v1/operators), que es
     estable y no depende de qué cayó en la muestra. Las que no están en el
     ranking (la API trae todas, pero por si falla) quedan al final por sus
     pozos en la muestra. */
  const ordenBoe = useMemo(() => new Map(OPERADORES.map((o, i) => [o.slug, i])), [OPERADORES])
  const operadoras = useMemo(() => {
    const m = new Map<string, { slug: string; nombre: string; pozos: number }>()
    for (const w of WELLS) {
      const { operator, operatorName } = w.properties
      const x = m.get(operator) ?? { slug: operator, nombre: operatorName, pozos: 0 }
      x.pozos++
      m.set(operator, x)
    }
    return [...m.values()].sort(
      (a, b) =>
        (ordenBoe.get(a.slug) ?? 999) - (ordenBoe.get(b.slug) ?? 999) || b.pozos - a.pozos,
    )
  }, [WELLS, ordenBoe])

  const visibles = useMemo(
    () =>
      base.filter((w) => {
        const p = w.properties
        if (operadora && p.operator !== operadora) return false
        if (ocultar && p.status === 'abandonado') return false
        /* EL RECURSO ES EL `well_type` DEL DATO, no una comparación entre la
           producción de petróleo y la de gas. El GeoJSON de /v1/geo/wells no
           trae producción por pozo —llegaba oil = gas = 0—, así que comparar
           los dos daba `0 <= 0` para todos y elegir «Petróleo» o «Gas»
           dejaba el mapa VACÍO. La Secretaría ya clasifica cada pozo
           (Petrolífero / Gasífero / Otro tipo), que es el mismo campo con el
           que filtra la v1. */
        if (recurso !== 'todos' && p.recurso !== recurso) return false
        return true
      }),
    [recurso, ocultar, operadora, base],
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

  /* EL POPUP DEL POZO. MapLibre sólo acepta DOM crudo, así que el contenido
     React se monta con createRoot en el nodo que le pasamos al Popup. El root
     se guarda para desmontarlo al cerrar —sin eso queda un árbol huérfano y
     con StrictMode, dos. */
  const popupRef = useRef<{ popup: maplibregl.Popup; root: Root } | null>(null)
  const abrirPopup = (map: MLMap, e: MapMouseEvent & { features?: unknown[] }) => {
    const f = e.features?.[0] as
      | { properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }
      | undefined
    const id = f?.properties?.id
    if (!id || !f?.geometry?.coordinates) return

    popupRef.current?.popup.remove()
    const nodo = document.createElement('div')
    const popup = new maplibregl.Popup({
      closeButton: false,
      maxWidth: '320px',
      offset: 10,
    })
      .setLngLat([f.geometry.coordinates[0], f.geometry.coordinates[1]])
      .setDOMContent(nodo)
      .addTo(map)
    const root = createRoot(nodo)
    root.render(<PopupPozo id={String(id)} sigla={String(f.properties?.name ?? '')} />)
    popupRef.current = { popup, root }
    popup.on('close', () => {
      popupRef.current?.root.unmount()
      popupRef.current = null
    })
  }

  const handleReady = (map: MLMap) => {
    if (map.getSource(SOURCE)) {
      /* El estilo se recargó (toggle de tema): sólo re enganchar los eventos,
         que el DOM del mapa es nuevo. */
      wireEventos(map)
      return
    }
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
    /* Debug desde la consola del navegador: window.__v2map.queryRenderedFeatures()
       y company. No cuesta nada en producción y ahorra cada debugging de
       interacción que sólo se ve desde el navegador. */
    ;(window as unknown as { __v2map?: MLMap }).__v2map = map
    wireEventos(map)
    setListo(true)
  }

  /* Los clics se enganchan UNA vez por instancia de mapa: handleReady corre
     otra vez al cambiar el tema (MapShell recarga el estilo y llama de
     nuevo), y apilar dos listeners abriría dos popups por clic. */
  const wireEventos = (map: MLMap) => {
    const m = map as MLMap & { __pozosWired?: boolean }
    if (m.__pozosWired) return
    m.__pozosWired = true
    map.on('click', `${SOURCE}-point`, (e) => abrirPopup(map, e))
    /* El cluster también se clickea: como en la v1, el clic entra al cluster
       (flyTo + zoom) en vez de no hacer nada. Sin esto, un mapa de 1.000
       pozos que arranca todo agrupado parece muerto al primer clic. */
    map.on('click', `${SOURCE}-clusters`, async (e) => {
      const f = e.features?.[0]
      if (!f) return
      const clusterId = (f.properties as { cluster_id?: number } | null)?.cluster_id
      const src = map.getSource(SOURCE) as GeoJSONSource | undefined
      if (clusterId == null || !src) return
      try {
        const hijos = await src.getClusterLeaves(clusterId, 1, 0)
        const lngLat =
          hijos[0]?.geometry?.coordinates ?? e.lngLat.toArray()
        map.flyTo({
          center: [lngLat[0], lngLat[1]],
          zoom: Math.max(map.getZoom() + 2, 12),
          duration: 600,
        })
      } catch {
        map.flyTo({ center: e.lngLat.toArray(), zoom: map.getZoom() + 2, duration: 600 })
      }
    })
    map.on('mouseenter', `${SOURCE}-point`, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', `${SOURCE}-point`, () => {
      map.getCanvas().style.cursor = ''    })
  }

  /* La del panel de producción: la seleccionada, o la primera del ranking
     que tenga pozos en el mapa — la v1 muestra la de arriba por defecto. */
  const slugSerie =
    operadora ||
    operadoras[0]?.slug ||
    OPERADORES[0]?.slug ||
    null
  const nombreSerie =
    (slugSerie && operadoras.find((o) => o.slug === slugSerie)?.nombre) ||
    OPERADORES.find((o) => o.slug === slugSerie)?.nombre ||
    ''

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

          Dos columnas: a la izquierda las operadoras y, debajo, su producción;
          a la derecha los filtros. El ángulo inferior derecho queda LIBRE a
          propósito: ahí viven los controles de zoom y la atribución.

          `items-start` es necesario: sin él los paneles heredan el stretch
          del flex y se estiran a todo el alto del mapa, dejando un bloque
          blanco vacío debajo del pie. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-between gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="pointer-events-none flex min-w-0 flex-col gap-3">
          <PanelOperadores
            operadoras={operadoras}
            seleccionada={operadora}
            onSeleccionar={setOperadora}
          />
          <PanelProduccion slug={slugSerie} nombre={nombreSerie} />
        </div>
        <div className="pointer-events-none self-end lg:self-start">
          <PanelFiltros
            recurso={recurso}
            onRecurso={setRecurso}
            ocultarAbandonados={ocultar}
            onOcultar={setOcultar}
            visibles={visibles.length}
            total={base.length}
          />
        </div>
      </div>
    </div>
  )
}
