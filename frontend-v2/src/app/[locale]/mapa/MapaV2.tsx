'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useSearchParams } from 'next/navigation'
import maplibregl, { type GeoJSONSource, type Map as MLMap, type MapMouseEvent } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import type { WellFeature } from '@/fixtures/wells'
import type { OperadorPais } from '@/lib/data/production'
import { fetchMapWells } from '@/lib/data/wells'
import { PanelCobertura, PanelFiltros, PanelOperadores, PanelProduccion, type Recurso } from './Paneles'
import { PopupPozo } from './PopupPozo'
import { Icono, PATH } from '../_ui/iconos'

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
const BASIN_SOURCE = 'v2-cuencas'
const VERDE = '#189a4d'
const NARANJA = '#ef720c'
const ROJO = '#e3474c'
const CUENCA_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  NOROESTE: [[-67, -27.5], [-58.5, -22]],
  NEUQUINA: [[-71.5, -42], [-65, -34]],
  CUYANA: [[-69.5, -35], [-67, -31.5]],
  'GOLFO SAN JORGE': [[-71.5, -48], [-65, -44.5]],
  AUSTRAL: [[-73, -56], [-65, -50]],
}
export function MapaV2({
  wells: WELLS,
  operadores: OPERADORES = [],
  cobertura,
}: {
  wells: WellFeature[]
  /** ranking nacional por BOE (loadOperators); ordena el panel */
  operadores?: OperadorPais[]
  cobertura: {
    catalogo: number
    muestra: number
    activos: number
    etiquetas: { titulo: string; catalogo: string; muestra: string; activos: string; cerrar: string }
  }
}) {
  const params = useSearchParams()
  const operadoraInicial = params.get('operadora') ?? ''
  const [recurso, setRecurso] = useState<Recurso>('todos')
  const [ocultar, setOcultar] = useState(true)
  const [cuenca, setCuenca] = useState('')
  const [provincia, setProvincia] = useState('')
  const [formacion, setFormacion] = useState('vaca_muerta')
  const [estado, setEstado] = useState('')
  /* La operadora puede venir en la URL: las cards de empresas enlazan acá con
     ?operadora=<slug> y el mapa tiene que abrir ya filtrado, o el enlace
     prometería algo que no cumple. Es el valor INICIAL nada más — después el
     panel manda, y volver a tocar el filtro no reescribe la URL. */
  const [operadora, setOperadora] = useState(operadoraInicial)
  const mapaRef = useRef<MLMap | null>(null)
  const inicializadoRef = useRef(false)
  const [listo, setListo] = useState(false)
  const [mostrarCobertura, setMostrarCobertura] = useState(true)
  const [mostrarOperadores, setMostrarOperadores] = useState(true)

  /* Al elegir una operadora se piden SUS pozos completos —no sólo los que
     cayeron en la muestra— con el mismo ?operator= de la API que usa la v1.
     Mientras llega, el mapa sigue mostrando los que tiene: un mapa que se
      vacía un instante para llenarse después se lee como un parpadeo roto. */
  const [pozosOperadora, setPozosOperadora] = useState<WellFeature[] | null>(null)
  useEffect(() => {
    if (!operadora && !cuenca && !provincia && !formacion) {
      setPozosOperadora(null)
      return
    }
    const controller = new AbortController()
    fetchMapWells({
      ...(operadora ? { operator: operadora } : {}),
      ...(cuenca ? { basin: cuenca } : {}),
      ...(provincia ? { province: provincia } : {}),
      ...(formacion ? { formation: formacion } : {}),
    }, 1000, controller.signal).then((res) => {
      if (!controller.signal.aborted && res) setPozosOperadora(res)
    })
    return () => {
      controller.abort()
    }
  }, [operadora, cuenca, provincia, formacion])

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
  const operadoras = useMemo(() => {
    if (OPERADORES.length) {
      return OPERADORES.slice(0, 5).map((o) => ({
        slug: o.slug,
        nombre: o.nombre,
        pozos: o.pozos,
        boe: o.boe,
      }))
    }
    const m = new Map<string, { slug: string; nombre: string; pozos: number }>()
    for (const w of WELLS) {
      const { operator, operatorName } = w.properties
      const x = m.get(operator) ?? { slug: operator, nombre: operatorName, pozos: 0 }
      x.pozos++
      m.set(operator, x)
    }
    return [...m.values()].sort((a, b) => b.pozos - a.pozos).slice(0, 5).map((o) => ({ ...o, boe: o.pozos }))
  }, [WELLS, OPERADORES])

  const visibles = useMemo(
    () =>
      base.filter((w) => {
        const p = w.properties
        if (operadora && p.operator !== operadora) return false
        if (ocultar && p.status === 'abandonado') return false
        if (estado && p.statusCode !== estado) return false
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
    [recurso, ocultar, operadora, estado, base],
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

  useEffect(() => {
    const map = mapaRef.current
    if (!listo || !map?.getLayer(`${BASIN_SOURCE}-fill`)) return
    map.setPaintProperty(`${BASIN_SOURCE}-fill`, 'fill-opacity', ['case', ['==', ['get', 'name'], cuenca], 0.2, 0.055])
    map.setPaintProperty(`${BASIN_SOURCE}-line`, 'line-width', ['case', ['==', ['get', 'name'], cuenca], 2.2, 1.2])
    const bounds = CUENCA_BOUNDS[cuenca]
    if (bounds) map.fitBounds(bounds, { padding: 72, maxZoom: 8, duration: 700 })
  }, [cuenca, listo])

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
      closeButton: true,
      maxWidth: '360px',
      offset: 18,
    })
      .setLngLat([f.geometry.coordinates[0], f.geometry.coordinates[1]])
      .setDOMContent(nodo)
      .addTo(map)
    const root = createRoot(nodo)
    root.render(
      <PopupPozo
        id={String(id)}
        sigla={String(f.properties?.name ?? '')}
        initial={f.properties ?? {}}
      />,
    )
    popupRef.current = { popup, root }
    popup.on('close', () => {
      root.unmount()
      if (popupRef.current?.popup === popup) popupRef.current = null
    })
  }

  const handleReady = (map: MLMap) => {
    if (map.getSource(SOURCE)) {
      /* El estilo se recargó (toggle de tema): sólo re enganchar los eventos,
         que el DOM del mapa es nuevo. */
      wireEventos(map)
      return
    }
    if (!inicializadoRef.current) {
      let oeste = 180, este = -180, sur = 90, norte = -90
      for (const w of WELLS) {
        const [lng, lat] = w.geometry.coordinates
        if (lng < oeste) oeste = lng
        if (lng > este) este = lng
        if (lat < sur) sur = lat
        if (lat > norte) norte = lat
      }
      map.fitBounds([[oeste, sur], [este, norte]], { padding: 64, animate: false })
      inicializadoRef.current = true
    }

    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: visibles },
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 12,
    })
    map.addSource(BASIN_SOURCE, { type: 'geojson', data: '/data/cuencas.geojson' })
    map.addLayer({
      id: `${SOURCE}-clusters`,
      type: 'circle',
      source: SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], VERDE, 50, NARANJA, 250, ROJO],
        'circle-radius': ['step', ['get', 'point_count'], 10, 50, 15, 250, 20],
        'circle-opacity': 0.88,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(255,255,255,0.32)',
      },
    })
    map.addLayer({ id: `${BASIN_SOURCE}-fill`, type: 'fill', source: BASIN_SOURCE, paint: { 'fill-color': '#1677a8', 'fill-opacity': ['case', ['==', ['get', 'name'], cuenca], 0.2, 0.055] } }, `${SOURCE}-clusters`)
    map.addLayer({ id: `${BASIN_SOURCE}-line`, type: 'line', source: BASIN_SOURCE, paint: { 'line-color': '#2382cf', 'line-opacity': 0.32, 'line-width': ['case', ['==', ['get', 'name'], cuenca], 2.2, 1.2], 'line-dasharray': [2, 2] } }, `${SOURCE}-clusters`)
    map.addLayer({ id: `${BASIN_SOURCE}-labels`, type: 'symbol', source: BASIN_SOURCE, layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-letter-spacing': 0.1, 'text-transform': 'uppercase' }, paint: { 'text-color': '#4da3e8', 'text-halo-color': 'rgba(10,10,10,.72)', 'text-halo-width': 1.2 } }, `${SOURCE}-clusters`)
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
        'circle-radius': 4,
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.6)',
      },
    })
    map.addLayer({
      id: `${SOURCE}-gas-label`,
      type: 'symbol',
      source: SOURCE,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'recurso'], 'gas']],
      layout: {
        'text-field': 'G',
        'text-size': 8,
        'text-font': ['Open Sans'],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': '#ffffff' },
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
        const zoom = await src.getClusterExpansionZoom(clusterId)
        const coordinates = (f.geometry as { coordinates: number[] }).coordinates
        map.easeTo({ center: [coordinates[0], coordinates[1]], zoom, duration: 500 })
      } catch {
        map.flyTo({ center: e.lngLat.toArray(), zoom: map.getZoom() + 2, duration: 600 })
      }
    })
    map.on('mouseenter', `${SOURCE}-point`, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', `${SOURCE}-point`, () => {
      map.getCanvas().style.cursor = ''    })
    map.on('mouseenter', `${SOURCE}-clusters`, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', `${SOURCE}-clusters`, () => { map.getCanvas().style.cursor = '' })
    map.on('click', `${BASIN_SOURCE}-fill`, (e) => {
      const sobrePozos = map.queryRenderedFeatures(e.point, { layers: [`${SOURCE}-point`, `${SOURCE}-clusters`] })
      if (sobrePozos.length) return
      const name = String(e.features?.[0]?.properties?.name ?? '')
      if (name) {
        setCuenca(name)
        /* La cuenca pasa a ser el alcance geográfico completo. Mantener VM
           acá reduciría Pampa de sus 350 pozos neuquinos a sólo los 83 cuya
           formación está rotulada Vaca Muerta. */
        setFormacion('')
      }
    })
    map.on('mouseenter', `${BASIN_SOURCE}-fill`, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', `${BASIN_SOURCE}-fill`, () => { map.getCanvas().style.cursor = '' })
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

  const seleccionarCuenca = (value: string) => {
    setCuenca(value)
    if (value) setFormacion('')
  }

  const seleccionarOperadora = (value: string) => {
    setOperadora(value)
    if (!value) return
    setProvincia('')
    /* Sin cuenca, se conserva el alcance actual (Vaca Muerta por defecto).
       Con una cuenca elegida, el filtro de cuenca manda y ya contiene todas
       las formaciones de esa operadora. */
    if (cuenca) setFormacion('')
    setEstado('')
    setRecurso('todos')
  }

  return (
    <div className="relative h-full w-full">
      <MapShell
        className="h-full w-full"
        label="Mapa de actividad de la cuenca Neuquina"
        controlPosition="bottom-right"
        fullscreen
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
          {mostrarOperadores ? (
            <>
              <PanelOperadores
                operadoras={operadoras}
                seleccionada={operadora}
                onSeleccionar={seleccionarOperadora}
                onCerrar={() => setMostrarOperadores(false)}
              />
              <PanelProduccion slug={slugSerie} nombre={nombreSerie} />
            </>
          ) : (
            <button type="button" className="s-map-reopen pointer-events-auto" onClick={() => setMostrarOperadores(true)} aria-label="Expandir operadores" title="Expandir operadores">
              <Icono d={PATH.expandir} size={15} /> Operadores
            </button>
          )}
        </div>
        <div className="pointer-events-none self-end lg:self-start">
          <div className="flex flex-col items-end gap-3">
            <PanelFiltros
              recurso={recurso}
              onRecurso={setRecurso}
              ocultarAbandonados={ocultar}
              onOcultar={setOcultar}
              visibles={visibles.length}
              total={base.length}
              cuenca={cuenca}
              onCuenca={seleccionarCuenca}
              provincia={provincia}
              onProvincia={setProvincia}
              formacion={formacion}
              onFormacion={setFormacion}
              estado={estado}
              onEstado={setEstado}
            />
            <PanelCobertura datos={cobertura} abierto={mostrarCobertura} onCambiar={setMostrarCobertura} />
          </div>
        </div>
      </div>
    </div>
  )
}
