'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Map as MLMap, type ExpressionSpecification } from 'maplibre-gl'
import { MapShell, MapLegend } from '@/ui/map-shell'
import { Chip } from '@/ui/chip'
import {
  FilterChip,
  FilterSegmented,
  OverviewPanel,
  TopOperatorsPanel,
  WellCount,
} from './MapPanels'
import { formatDecimal, formatInteger } from '@/lib/format'
import { STATUS_COLOR, type WellFeature, type WellStatus } from '@/fixtures/wells'
import { OPERATORS } from '@/fixtures/operators'

/* MapExperience — réplica Estrato del MapExperience de producción:
   mapa con overlays (contexto del país, ranking de operadoras, filtros y
   referencias) y popup por pozo. */

type Commodity = 'todos' | 'petroleo' | 'gas'

const SOURCE_ID = 'wells'
const LAYER_ID = 'wells-circle'

const STATUS_LABEL: Record<WellStatus, string> = {
  activo: 'Activo',
  perforacion: 'Perforación',
  abandonado: 'Abandonado',
}

const ALL_STATUSES: WellStatus[] = ['activo', 'perforacion', 'abandonado']

/* token-exception: maplibre no resuelve CSS vars — la expresión del layer
   necesita los hex resueltos de STATUS_COLOR (--status-positive,
   --status-caution, --text-tertiary). Único lugar permitido con hex. */
const CIRCLE_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'activo',
  '#0aa173',
  'perforacion',
  '#9a7420',
  '#837f7c',
]

const CIRCLE_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  2.5,
  9,
  5,
  13,
  9,
]

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/* Popup como HTML string: el DOM sí resuelve las vars CSS del tema. */
function popupHTML(p: WellFeature['properties']): string {
  return `
    <div style="font-family:var(--font-schibsted),system-ui,sans-serif;min-width:180px">
      <p style="margin:0;font-size:13px;font-weight:600;color:var(--text-primary)">${esc(p.name)}</p>
      <p style="margin:2px 0 8px;font-size:11.5px;color:var(--text-secondary)">
        ${esc(p.operatorName)} · ${STATUS_LABEL[p.status]}
      </p>
      <dl style="margin:0;display:grid;grid-template-columns:1fr auto;gap:2px 16px;font-size:11.5px">
        <dt style="color:var(--text-tertiary)">Petróleo</dt>
        <dd style="margin:0;color:var(--text-primary);font-variant-numeric:tabular-nums">${formatInteger(p.oil)} bbl/d</dd>
        <dt style="color:var(--text-tertiary)">Gas</dt>
        <dd style="margin:0;color:var(--text-primary);font-variant-numeric:tabular-nums">${formatDecimal(p.gas, 1)} Mm³/d</dd>
      </dl>
    </div>`
}

export function MapExperience({
  wells,
  initialOperator = null,
}: {
  wells: WellFeature[]
  /** Preselección de operadora vía ?operator= (como producción). */
  initialOperator?: string | null
}) {
  const [statuses, setStatuses] = useState<WellStatus[]>(ALL_STATUSES)
  const [commodity, setCommodity] = useState<Commodity>('todos')
  const [operator, setOperator] = useState<string>(() =>
    initialOperator && OPERATORS.some((o) => o.slug === initialOperator) ? initialOperator : '',
  )
  const [mobilePanel, setMobilePanel] = useState<'none' | 'resumen' | 'filtros'>('none')

  const filtered = useMemo(
    () =>
      wells.filter((w) => {
        const p = w.properties
        if (!statuses.includes(p.status)) return false
        if (operator && p.operator !== operator) return false
        if (commodity === 'petroleo' && p.oil <= 0) return false
        if (commodity === 'gas' && p.gas <= 0) return false
        return true
      }),
    [wells, statuses, commodity, operator],
  )

  const fc = useMemo(
    () => ({ type: 'FeatureCollection' as const, features: filtered }),
    [filtered],
  )

  const oilTotal = useMemo(() => filtered.reduce((acc, w) => acc + w.properties.oil, 0), [filtered])
  const gasTotal = useMemo(() => filtered.reduce((acc, w) => acc + w.properties.gas, 0), [filtered])

  const mapRef = useRef<MLMap | null>(null)
  const fcRef = useRef(fc)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  /* onReady corre en load y tras cada cambio de tema (setStyle limpia
     sources/layers); los listeners del mapa se registran una sola vez. */
  const handleReady = (map: MLMap) => {
    const isNewMap = mapRef.current !== map
    mapRef.current = map

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: fcRef.current })
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': CIRCLE_COLOR,
          'circle-radius': CIRCLE_RADIUS,
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.65)',
        },
      })
    }

    if (isNewMap) {
      map.on('click', LAYER_ID, (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const p = feature.properties as WellFeature['properties']
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({
          offset: 12,
          className: 'estrato-popup',
          maxWidth: '20rem',
        })
          .setLngLat(e.lngLat)
          .setHTML(popupHTML(p))
          .addTo(map)
      })
      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })
    }
  }

  /* Los filtros actualizan el geojson en vivo (setData). */
  useEffect(() => {
    fcRef.current = fc
    popupRef.current?.remove()
    const src = mapRef.current?.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    src?.setData(fc)
  }, [fc])

  const toggleStatus = (s: WellStatus) =>
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const hasActiveFilters =
    statuses.length !== ALL_STATUSES.length || commodity !== 'todos' || operator !== ''

  const clearFilters = () => {
    setStatuses(ALL_STATUSES)
    setCommodity('todos')
    setOperator('')
  }

  /* Panel de filtros — estructura de producción (encabezado con acción de
     reinicio + controles + pie con el conteo), vestida en Estrato. El
     <select> de operadora se fue: ahora se filtra desde el ranking. */
  const filtersPanel = (
    <div className="flex flex-col gap-2 rounded-[10px] border-4 border-black bg-inverse px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-label !text-on-dark-2">Filtros</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="type-label !text-oil transition-opacity duration-200 hover:opacity-70"
          >
            Reiniciar
          </button>
        )}
      </div>
      <div role="group" aria-label="Estado del pozo" className="flex flex-wrap gap-1">
        {ALL_STATUSES.map((s) => (
          <FilterChip key={s} selected={statuses.includes(s)} onClick={() => toggleStatus(s)}>
            {STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>
      <FilterSegmented<Commodity>
        value={commodity}
        onChange={setCommodity}
        label="Recurso"
        options={[
          { value: 'todos', label: 'Todos' },
          { value: 'petroleo', label: 'Petróleo' },
          { value: 'gas', label: 'Gas' },
        ]}
      />
      <div aria-live="polite">
        <WellCount
          visibles={filtered.length}
          total={wells.length}
          oil={oilTotal}
          gas={gasTotal}
        />
      </div>
    </div>
  )

  /* Columna de contexto: qué produjo el país y quién lo produce. */
  const contextPanels = (
    <>
      <OverviewPanel />
      <TopOperatorsPanel selected={operator} onSelect={setOperator} />
    </>
  )

  const legend = (
    <MapLegend
      inline
      title="Referencias"
      items={ALL_STATUSES.map((s) => ({ color: STATUS_COLOR[s], label: STATUS_LABEL[s] }))}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tema del popup maplibre: el contenedor .maplibregl-popup-content
          viene blanco de fábrica; acá sigue las vars de Estrato. */}
      <style>{`
        .estrato-popup .maplibregl-popup-content{background:var(--surface);color:var(--text-body);border:1px solid var(--border-default);border-radius:10px;box-shadow:var(--elevation-overlay);padding:12px 14px}
        .estrato-popup .maplibregl-popup-close-button{color:var(--text-secondary);font-size:16px;right:4px;top:2px}
        .estrato-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,
        .estrato-popup.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,
        .estrato-popup.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip{border-top-color:var(--surface)}
        .estrato-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip,
        .estrato-popup.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,
        .estrato-popup.maplibregl-popup-anchor-top-right .maplibregl-popup-tip{border-bottom-color:var(--surface)}
        .estrato-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip{border-right-color:var(--surface)}
        .estrato-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip{border-left-color:var(--surface)}
      `}</style>

      {/* Mobile: 2 chips toggle arriba del mapa; el panel abre en flujo,
          no tapa el mapa ni pierde el foco (fix del patrón de producción). */}
      <div className="flex max-h-[45%] shrink-0 flex-col gap-3 overflow-y-auto px-4 pb-3 pt-3 md:hidden">
        <div className="flex gap-2">
          <Chip
            selected={mobilePanel === 'resumen'}
            aria-expanded={mobilePanel === 'resumen'}
            onClick={() => setMobilePanel((p) => (p === 'resumen' ? 'none' : 'resumen'))}
          >
            Resumen
          </Chip>
          <Chip
            selected={mobilePanel === 'filtros'}
            aria-expanded={mobilePanel === 'filtros'}
            onClick={() => setMobilePanel((p) => (p === 'filtros' ? 'none' : 'filtros'))}
          >
            Filtros · {formatInteger(filtered.length)}
          </Chip>
        </div>
        {mobilePanel === 'filtros' && filtersPanel}
        {mobilePanel === 'resumen' && (
          <div className="flex flex-col gap-3">
            {contextPanels}
            {legend}
          </div>
        )}
      </div>

      <div className="relative min-h-0 w-full flex-1">
        <MapShell
          className="h-full w-full"
          label="Mapa de pozos de la cuenca Neuquina"
          controlPosition="bottom-right"
          onReady={handleReady}
        />
        {/* Desktop: overlays flotantes. La columna derecha arranca debajo
            del NavigationControl de MapShell (top-right). */}
        <div className="pointer-events-none absolute inset-0 hidden items-start justify-between gap-4 p-4 md:flex">
          {/* Izquierda: contexto del país + ranking de operadoras + leyenda,
              en el mismo orden que vacamuerta.io */}
          <div className="pointer-events-auto flex max-h-full w-[19rem] flex-col gap-3 overflow-y-auto">
            {contextPanels}
            {legend}
          </div>
          {/* Derecha: filtros. Con los controles de zoom abajo, el panel
              ya puede arrancar al ras del borde superior */}
          <div className="pointer-events-auto max-h-full w-[17rem] overflow-y-auto">
            {filtersPanel}
          </div>
        </div>
      </div>

    </div>
  )
}
