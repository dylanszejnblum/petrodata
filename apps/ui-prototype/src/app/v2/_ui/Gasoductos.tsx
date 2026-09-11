'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import { FLUIDO } from './kit'
import { Icono } from './iconos'
import { formatInteger } from '@/lib/format'

/* GASODUCTOS — la lista de sistemas, y el mapa de cada uno al desplegarlo.

   La geometría existía desde el principio y estaba tirada. El script viejo
   —frontend/scripts/build-pipelines.py— bajaba el mismo shapefile de ENARGAS y
   lo decía en su propio encabezado: «geometry is read for measurement and then
   discarded — nothing is written to /public». De ahí salían los kilómetros por
   operador de esta sección; la traza se descartaba. scripts/build-gasoductos.py
   se la queda.

   Dos cambios sobre lo que había:

   · Las filas pasan a ser GASODUCTOS y no operadores. El shapefile trae 44
     nombres, pero son tramos administrativos —el Norte figura como N1T, N1P,
     N1L, N2P, N3P y N4T— y nadie llama así a un gasoducto. Se agrupan en los
     26 sistemas que la gente sí nombra, y la licenciataria baja a un badge en
     la fila: la información no se pierde, cambia de lugar.

   · La lista se corta en los doce más largos, que son el 93% de la red. Los
     otros catorce suman 1.359 km y van juntos en una fila que también se
     despliega, así ningún kilómetro queda sin representar. Veintiséis filas
     desplegables en una card son una lista para hacer scroll, no para leer.

   El geojson pesa 107 kB y se pide UNA vez, al abrir la primera fila. En la
   carga de la página no está: la sección se puede leer entera sin mapa. */

const FUENTE = 'gasoductos'
/* Cuántos entran en la lista antes del cajón. Doce cubre 18.208 de 19.567 km. */
const VISIBLES = 12

type Props = {
  id: string
  nombre: string
  operador: string
  operadores: string[]
  km: number
  tramos: number
}
type Feat = { type: 'Feature'; properties: Props; geometry: unknown }
type Col = { type: 'FeatureCollection'; features: Feat[] }

function bbox(g: { coordinates: number[][][] }) {
  let o = 180, e = -180, s = 90, n = -90
  for (const linea of g.coordinates) {
    for (const [x, y] of linea) {
      if (x < o) o = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
    }
  }
  return [[o, s], [e, n]] as [[number, number], [number, number]]
}

/** El mapa de un sistema: la red entera en tinta tenue y el elegido encendido.
    La red de fondo no es decoración — una traza suelta sobre el basemap no
    dice si es el troncal que cruza el país o un ramal de veinte kilómetros. */
function MapaDe({ datos, ids }: { datos: Col; ids: string[] }) {
  const mapRef = useRef<MLMap | null>(null)

  const pintar = (map: MLMap) => {
    if (!map.getSource(FUENTE)) {
      map.addSource(FUENTE, { type: 'geojson', data: datos as never })
      /* La red de fondo NO es decoración: una traza suelta sobre el basemap no
         dice si es el troncal que cruza el país o un ramal de veinte
         kilómetros. Y tiene que despegarse del mapa base —que ya trae rutas y
         límites en gris— o no se distingue de una ruta: por eso va en la tinta
         del fluido al 30% y no en gris, y con guiones. Es la red de gas
         apagada, no una carretera más. */
      map.addLayer({
        id: `${FUENTE}-fondo`,
        type: 'line',
        source: FUENTE,
        paint: {
          'line-color': FLUIDO.gas,
          'line-width': 1.2,
          'line-opacity': 0.3,
          'line-dasharray': [3, 2],
        },
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
      })
      map.addLayer({
        id: `${FUENTE}-sel`,
        type: 'line',
        source: FUENTE,
        filter: ['in', ['get', 'id'], ['literal', ids]],
        paint: { 'line-color': FLUIDO.gas, 'line-width': 2.5 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })
    } else {
      map.setFilter(`${FUENTE}-sel`, ['in', ['get', 'id'], ['literal', ids]])
    }

    const elegidos = datos.features.filter((f) => ids.includes(f.properties.id))
    if (!elegidos.length) return
    let o = 180, e = -180, s = 90, n = -90
    for (const f of elegidos) {
      const [[a, b], [c, d]] = bbox(f.geometry as { coordinates: number[][][] })
      o = Math.min(o, a); s = Math.min(s, b); e = Math.max(e, c); n = Math.max(n, d)
    }
    map.fitBounds([[o, s], [e, n]], { padding: 26, animate: false })
    mapRef.current = map
  }

  /* Al cambiar de fila el mapa ya está montado, así que hay que reencuadrar a
     mano: MapShell sólo llama onReady en el load y en el cambio de tema. */
  useEffect(() => {
    const map = mapRef.current
    if (map && map.getSource(FUENTE)) pintar(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  return (
    <div className="relative h-[240px] w-full">
      <MapShell
        label="Traza del gasoducto"
        onReady={pintar}
        atribucion={false}
        controlPosition="top-right"
      />
    </div>
  )
}

export function Gasoductos() {
  const [datos, setDatos] = useState<Col | null>(null)
  const [error, setError] = useState(false)
  const [abierto, setAbierto] = useState<string | null>(null)
  const base = useId()

  /* Se pide al abrir la primera fila y no al montar: la sección se lee entera
     sin mapa, y 107 kB en la carga de una página que ya trae catorce secciones
     es peaje para todos por algo que quizá nadie despliegue. */
  useEffect(() => {
    if (!abierto || datos || error) return
    let vivo = true
    fetch('/data/gasoductos.geojson')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Col) => vivo && setDatos(d))
      .catch(() => vivo && setError(true))
    return () => { vivo = false }
  }, [abierto, datos, error])

  return <Lista datos={datos} abierto={abierto} setAbierto={setAbierto} base={base} error={error} />
}

function Lista({
  datos,
  abierto,
  setAbierto,
  base,
  error,
}: {
  datos: Col | null
  abierto: string | null
  setAbierto: (v: string | null) => void
  base: string
  error: boolean
}) {
  const fs = datos?.features ?? INDICE
  const cabeza = fs.slice(0, VISIBLES)
  const cola = fs.slice(VISIBLES)
  /* Con el índice estático la cola viene vacía —son doce entradas— y la fila
     «otros» no existía hasta abrir la primera del listado. Una fila que
     aparece sola después del primer clic es peor que no tenerla: mientras no
     haya datos se dibuja con el resumen del build, y cuando llegan se rearma
     con los de verdad. */
  const resumen = cola.length
    ? {
        n: cola.length,
        km: cola.reduce((s, f) => s + f.properties.km, 0),
        tramos: cola.reduce((s, f) => s + f.properties.tramos, 0),
      }
    : COLA
  const idsCola = cola.map((f) => f.properties.id)

  const fila = (id: string, nombre: string, operador: string, km: number, tramos: number, ids: string[]) => {
    const esta = abierto === id
    const panel = `${base}-${id}`
    return (
      <div key={id}>
        <button
          type="button"
          className="s-gfila s-gfila--gaso"
          aria-expanded={esta}
          aria-controls={panel}
          onClick={() => setAbierto(esta ? null : id)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{nombre}</span>
            <span className="s-chip s-chip--neutro s-chip--mini shrink-0">{operador}</span>
          </span>
          <span className="tramos s-micro pr-3 whitespace-nowrap" style={{ color: 'var(--ink-2)' }}>
            {tramos} {tramos === 1 ? 'tramo' : 'tramos'}
          </span>
          <span className="s-num pr-3 text-right text-[13px] font-medium">
            {formatInteger(km)} <span className="s-micro" style={{ color: 'var(--ink-3)' }}>km</span>
          </span>
          {/* El mismo chevron que abre el desglose de empresas y provincias:
              dos formas distintas de «esto se abre» en la misma web es una de
              más. */}
          <span
            aria-hidden
            className="flex items-center justify-center"
            style={{
              color: 'var(--ink-3)',
              transform: esta ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform var(--dur-slow) var(--ease-in-out)',
            }}
          >
            <Icono d="M6 9l6 6 6-6" size={14} grosor={2.2} />
          </span>
        </button>
        <div id={panel} className="s-colapsa" data-abierto={esta ? 'si' : 'no'}>
          <div>
            {esta && datos && <MapaDe datos={datos} ids={ids} />}
            {esta && !datos && (
              <p className="s-micro m-0 px-3 py-8 text-center" style={{ color: 'var(--ink-2)' }}>
                {error ? 'No se pudo cargar la traza.' : 'Cargando la traza…'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {cabeza.map((f) =>
        fila(f.properties.id, f.properties.nombre, f.properties.operador, f.properties.km, f.properties.tramos, [f.properties.id]),
      )}
      {fila('otros', `Otros ${resumen.n} sistemas`, 'varios', resumen.km, resumen.tramos, idsCola)}
    </>
  )
}

/** El resumen de la cola, para que la fila «otros» exista antes del geojson.
    Sale de la misma corrida del build que INDICE. */
const COLA = { n: 14, km: 1359, tramos: 34 }

/* Índice estático: los mismos doce sistemas con sus kilómetros, para que la
   lista exista antes de que llegue el geojson. Sale del propio build —está en
   la salida de scripts/build-gasoductos.py— y si los dos se desincronizan, el
   que manda es el archivo: apenas carga, la lista se rearma con él. */
const INDICE: Feat[] = (
  [
    ['gasoducto-general-san-martin', 'Gasoducto General San Martín', 'TGS', 4662, 105],
    ['gasoducto-norte', 'Gasoducto Norte', 'TGN', 4190, 46],
    ['neuba', 'Neuba', 'TGS', 3251, 42],
    ['gasoducto-centro-oeste', 'Gasoducto Centro Oeste', 'TGN', 2240, 26],
    ['gnea', 'GNEA', 'sin operador declarado', 834, 8],
    ['perito-moreno-ex-nestor-kirchner', 'Perito Moreno (ex Néstor Kirchner)', 'TGS', 650, 2],
    ['gasoducto-atacama-argentina', 'Gasoducto Atacama Argentina', 'Atacama', 529, 8],
    ['gasoducto-uruguayana', 'Gasoducto Uruguayana', 'TGN', 422, 4],
    ['cordillerano', 'Cordillerano', 'TGS', 383, 9],
    ['norandino', 'Norandino', 'Nor Andino', 375, 4],
    ['san-jeronimo-santa-fe', 'San Jerónimo – Santa Fe', 'TGN', 359, 5],
    ['gasoducto-gasandes-argentina-s-a', 'Gasoducto GasAndes Argentina S.A.', 'GasAndes', 313, 3],
  ] as const
).map(([id, nombre, operador, km, tramos]) => ({
  type: 'Feature',
  properties: { id, nombre, operador, operadores: [operador], km, tramos },
  geometry: { type: 'MultiLineString', coordinates: [] },
}))
