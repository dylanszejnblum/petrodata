'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/api/client'
import { formatCompact, formatInteger, formatMonth } from '@/lib/format'
import { COMPANIES } from '@/fixtures/companies'
import { FLUIDO } from '../_ui/kit'
import { LogoEmpresa } from '../_ui/LogoEmpresa'
import { Icono, PATH } from '../_ui/iconos'
import { Serie } from '../_ui/Serie'

/* Paneles flotantes del mapa — con la receta de card MEDIDA de la referencia,
   no con la que yo había inventado.

   La estructura real de sus cards (medida en approval-card y
   recommendation-card):

     div.rounded-card            blanco · radio 10
       ├─ div.primitive-card-pad   padding 12px          ← el cuerpo
       └─ div.primitive-card-footer bg --inset · border-top 1px · padding 10×12

   O sea: NO hay barra de cabecera con divisoria arriba. El título es la
   primera línea del cuerpo, y lo secundario —conteos, ayudas, acciones— baja
   a un pie sobre fondo hundido. Yo tenía exactamente lo contrario: cabecera
   con borde arriba y nada abajo.

   Lo que sí estaba bien y se conserva: fondo opaco (cero backdrop-filter, la
   regla medida), anillo de 1px en vez de sombra difusa y z-index en 10.

   Los rótulos salen de messages/es.json del sitio. */

/* Los dos fluidos llevan su color, el mismo que en el dashboard y en toda la
   web. El filtro es donde más falta hace: es el lugar donde el usuario elige
   entre los dos, así que es donde la clave de color se aprende. */
const RECURSOS = [
  { valor: 'todos', label: 'Todos', color: null },
  { valor: 'petroleo', label: 'Petróleo', color: FLUIDO.petroleo },
  { valor: 'gas', label: 'Gas', color: FLUIDO.gas },
] as const

const EMPRESA_POR_SLUG = new Map(COMPANIES.map((empresa) => [empresa.slug, empresa]))

export type Recurso = (typeof RECURSOS)[number]['valor']

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`s-map-panel pointer-events-auto overflow-hidden ${className}`}
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}

/** Cuerpo: los 12px de padding de la referencia. */
function Cuerpo({ children }: { children: ReactNode }) {
  return <div style={{ padding: 12 }}>{children}</div>
}

/** Pie: fondo hundido, filete arriba, padding 10×12. */
function Pie({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3"
      style={{
        padding: '10px 12px',
        background: 'var(--inset)',
        borderTop: '1px solid var(--line)',
      }}
    >
      {children}
    </div>
  )
}

/** Título del panel: primera línea del cuerpo, no una barra aparte. */
function Titulo({ children }: { children: ReactNode }) {
  return <p className="s-titulo m-0">{children}</p>
}

export function PanelCobertura({
  datos,
  abierto,
  onCambiar,
}: {
  datos: {
    catalogo: number
    muestra: number
    activos: number
    etiquetas: { titulo: string; catalogo: string; muestra: string; activos: string; cerrar: string }
  }
  abierto: boolean
  onCambiar: (abierto: boolean) => void
}) {
  if (!abierto) {
    return (
      <button type="button" className="s-map-reopen pointer-events-auto" onClick={() => onCambiar(true)}>
        <span aria-hidden>◎</span> {datos.etiquetas.titulo}
      </button>
    )
  }
  const filas = [
    [datos.etiquetas.catalogo, datos.catalogo],
    [datos.etiquetas.muestra, datos.muestra],
    [datos.etiquetas.activos, datos.activos],
  ] as const
  return (
    <Panel className="w-[228px] max-w-[calc(100vw-32px)]">
      <Cuerpo>
        <div className="flex items-center justify-between gap-3">
          <Titulo>{datos.etiquetas.titulo}</Titulo>
          <button type="button" className="s-panel-close" onClick={() => onCambiar(false)} aria-label={datos.etiquetas.cerrar}>×</button>
        </div>
        <dl className="m-0 mt-2">
          {filas.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 border-t py-1.5 first:border-t-0">
              <dt className="s-micro" style={{ color: 'var(--ink-2)' }}>{label}</dt>
              <dd className="s-micro s-num m-0 font-medium">{formatInteger(value)}</dd>
            </div>
          ))}
        </dl>
      </Cuerpo>
    </Panel>
  )
}

/** Filtros — recurso y estado; el conteo y el reinicio bajan al pie. */
export function PanelFiltros({
  recurso,
  onRecurso,
  ocultarAbandonados,
  onOcultar,
  visibles,
  total,
  cuenca,
  onCuenca,
  provincia,
  onProvincia,
  formacion,
  onFormacion,
  estado,
  onEstado,
}: {
  recurso: Recurso
  onRecurso: (r: Recurso) => void
  ocultarAbandonados: boolean
  onOcultar: (v: boolean) => void
  visibles: number
  total: number
  cuenca: string
  onCuenca: (value: string) => void
  provincia: string
  onProvincia: (value: string) => void
  formacion: string
  onFormacion: (value: string) => void
  estado: string
  onEstado: (value: string) => void
}) {
  const limpio = recurso === 'todos' && ocultarAbandonados && !cuenca && !provincia && formacion === 'vaca_muerta' && !estado
  return (
    <Panel className="w-[228px]">
      <Cuerpo>
        <Titulo>Filtros</Titulo>
        <p className="s-micro m-0 mt-2.5 mb-1.5" style={{ color: 'var(--ink-2)' }}>
          Recurso
        </p>
        <div
          role="group"
          aria-label="Recurso"
          className="flex rounded-full p-0.5"
          style={{ background: 'var(--field)' }}
        >
          {RECURSOS.map((r) => {
            const on = r.valor === recurso
            return (
              <button
                key={r.valor}
                type="button"
                aria-pressed={on}
                onClick={() => onRecurso(r.valor)}
                className="s-micro flex-1 rounded-full px-2 py-1 transition-colors"
                style={{
                  background: on ? 'var(--surface)' : 'transparent',
                  boxShadow: on ? 'var(--shadow-btn)' : 'none',
                  color: on ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: on ? 500 : 400,
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {r.color && (
                    <i
                      aria-hidden
                      className="block size-1.5 shrink-0 rounded-full"
                      style={{ background: r.color, opacity: on ? 1 : 0.55 }}
                    />
                  )}
                  {r.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 grid gap-1.5">
          <select className="s-map-select" aria-label="Cuenca" value={cuenca} onChange={(e) => onCuenca(e.target.value)}>
            <option value="">Todas las cuencas</option>
            {['NOROESTE', 'NEUQUINA', 'CUYANA', 'GOLFO SAN JORGE', 'AUSTRAL'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="s-map-select" aria-label="Provincia" value={provincia} onChange={(e) => onProvincia(e.target.value)}>
            <option value="">Todas las provincias</option>
            {['Neuquén', 'Río Negro', 'Mendoza', 'La Pampa', 'Chubut', 'Santa Cruz', 'Tierra del Fuego', 'Salta', 'Jujuy'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="s-map-select" aria-label="Formación" value={formacion} onChange={(e) => onFormacion(e.target.value)}>
            <option value="">Todas las formaciones</option>
            <option value="vaca_muerta">Vaca Muerta</option>
            <option value="grupo_chubut">Grupo Chubut</option>
            <option value="huitr_n">Huitrín</option>
            <option value="mulichinco">Mulichinco</option>
            <option value="quintuco">Quintuco</option>
            <option value="lajas">Lajas</option>
          </select>
          <select className="s-map-select" aria-label="Estado" value={estado} onChange={(e) => onEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {['En Producción Efectiva', 'Parado Transitoriamente', 'En Estudio', 'En Espera de Abandono', 'Abandono Definitivo', 'Pozo Inyector'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <label
          className="s-micro mt-2.5 flex cursor-pointer items-center gap-2"
          style={{ color: 'var(--ink-2)' }}
        >
          <input
            type="checkbox"
            checked={ocultarAbandonados}
            onChange={(e) => onOcultar(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Ocultar abandonados
        </label>
      </Cuerpo>
      <Pie>
        <span className="s-micro s-num" style={{ fontWeight: 500 }}>
          {formatInteger(visibles)} pozos
        </span>
        {limpio ? (
          <span className="s-micro s-num" style={{ color: 'var(--ink-2)' }}>
            de {formatInteger(total)}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              onRecurso('todos')
              onOcultar(true)
              onCuenca('')
              onProvincia('')
              onFormacion('vaca_muerta')
              onEstado('')
            }}
            className="s-micro"
            style={{ color: 'var(--accent-ink)', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
          >
            Reiniciar
          </button>
        )}
      </Pie>
    </Panel>
  )
}

/** Operadores principales — la lista sale de los pozos que hay en el mapa,
    no del ranking fijo del dashboard. Con el sorteo pesado por participación
    nacional son 20 operadoras sobre 220 pozos, así que el buscador filtra de
    verdad: sobre cinco habría sido un control decorativo.

    El campo va con la receta del sistema: el input es transparente y sin
    borde, y quien dibuja el estado es su contenedor con :focus-within. */
export function PanelOperadores({
  operadoras,
  seleccionada,
  onSeleccionar,
  onCerrar,
}: {
  /** slug, nombre y pozos de cada operadora presente en el mapa */
  operadoras: { slug: string; nombre: string; pozos: number; boe: number }[]
  seleccionada: string
  onSeleccionar: (slug: string) => void
  onCerrar: () => void
}) {
  const [busca, setBusca] = useState('')
  const max = Math.max(1, ...operadoras.map((o) => o.boe))
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? operadoras.filter((o) => o.nombre.toLowerCase().includes(q)) : operadoras
  }, [busca, operadoras])

  return (
    <Panel className="w-[320px] max-w-[calc(100vw-32px)]">
      <Cuerpo>
        <div className="flex items-center justify-between gap-3">
          <Titulo>Operadores principales</Titulo>
          <button type="button" className="s-panel-close" onClick={onCerrar} aria-label="Contraer operadores" title="Contraer operadores">
            <Icono d={PATH.contraer} size={15} />
          </button>
        </div>

        <label className="s-buscador mt-2">
          <span aria-hidden className="s-micro" style={{ color: 'var(--ink-3)' }}>
            ⌕
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar operador…"
            aria-label="Buscar operador"
            className="s-micro"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpiar búsqueda"
              className="s-micro shrink-0"
              style={{ border: 0, background: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </label>

        <ul
          className="s-operator-list m-0 mt-2 flex list-none flex-col gap-0.5 p-0"
          style={{ maxHeight: 184, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {filtradas.map((op, i) => {
            const on = op.slug === seleccionada
            return (
              <li key={op.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSeleccionar(on ? '' : op.slug)}
                  className="s-operator-row grid w-full grid-cols-[20px_24px_minmax(0,1fr)_40px_34px] items-center gap-2 rounded-[7px] px-1.5 py-1.5 text-left transition-colors"
                  style={{
                    background: on ? 'var(--hover)' : 'transparent',
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="s-mono w-4 shrink-0 text-[11px]"
                    style={{ color: on ? 'var(--accent-ink)' : 'var(--ink-3)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <LogoEmpresa
                    nombre={op.nombre}
                    website={EMPRESA_POR_SLUG.get(op.slug)?.website}
                    logoUrl={EMPRESA_POR_SLUG.get(op.slug)?.logoUrl}
                    caja={24}
                  />
                  <span
                    className="s-micro min-w-0 flex-1 truncate"
                    style={{ color: 'var(--ink)', fontWeight: on ? 500 : 400 }}
                  >
                    {op.nombre}
                  </span>
                  <span className={`s-barra hidden w-10 shrink-0 sm:block ${on ? 's-barra--lider' : ''}`} aria-hidden>
                    <i style={{ width: `${Math.max(3, (op.boe / max) * 100)}%` }} />
                  </span>
                  <span className="s-num s-micro min-w-0 text-right" style={{ fontWeight: 500 }}>
                    {formatCompact(op.boe)}
                  </span>
                </button>
              </li>
            )
          })}
          {filtradas.length === 0 && (
            <li className="s-micro py-2" style={{ color: 'var(--ink-2)' }}>
              Ninguna operadora coincide.
            </li>
          )}
        </ul>
      </Cuerpo>
      <Pie>
        <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
          {seleccionada ? 'Clic de nuevo para quitarlo' : 'Haz clic para filtrar el mapa'}
        </span>
        <span className="s-micro s-num" style={{ color: 'var(--ink-2)' }}>
          BOE · mes
        </span>
      </Pie>
    </Panel>
  )
}

/* ── La producción de la operadora seleccionada ──────────────────────────
   GET /api/v1/operators/{slug}/production — la serie que la v1 muestra en la
   OverviewCard del mapa. Doce meses de BOE/d, nacional (la serie por
   operadora no tiene filtro de formación), con la misma Serie compacta de las
   filas de provincias.

   El cache es a nivel de módulo: cambiar de operadora y volver no vuelve a
   golpear la API. Sin slug muestra la de la PRIMERA del ranking —es lo que
   hace la v1 con la top— y si el pedido falla el panel no se dibuja: una caja
   vacía con un rótulo es peor que nada. */

const cacheSerie = new Map<string, { valores: number[]; textos: string[]; mes: string }>()

function useSerieOperadora(slug: string | null) {
  const [serie, setSerie] = useState<{ valores: number[]; textos: string[]; mes: string } | null>(
    () => (slug ? cacheSerie.get(slug) ?? null : null),
  )
  useEffect(() => {
    setSerie(null)
    if (!slug) return
    const hit = cacheSerie.get(slug)
    if (hit) {
      setSerie(hit)
      return
    }
    let vivo = true
    ;(async () => {
      try {
        const { data, error } = await api.GET('/api/v1/operators/{slug}/production', {
          params: { path: { slug } },
        })
        if (vivo && !error && data?.data?.length) {
          const puntos = data.data.slice(-12)
          const dias = (m: string) => {
            const [y, mm] = m.split('-').map(Number)
            return new Date(y, mm, 0).getDate()
          }
          const res = {
            valores: puntos.map((p) => Math.round(p.boe / (dias(p.date_month.slice(0, 7)) || 30))),
            textos: puntos.map(
              (p) =>
                `${formatMonth(p.date_month.slice(0, 7))} · ${formatInteger(
                  Math.round(p.boe / (dias(p.date_month.slice(0, 7)) || 30)),
                )} boe/d`,
            ),
            mes: puntos[puntos.length - 1].date_month.slice(0, 7),
          }
          cacheSerie.set(slug, res)
          setSerie(res)
        }
      } catch {
        /* sin serie: el panel se desmonta */
      }
    })()
    return () => {
      vivo = false
    }
  }, [slug])
  return serie
}

export function PanelProduccion({
  slug,
  nombre,
}: {
  slug: string | null
  nombre: string
}) {
  const serie = useSerieOperadora(slug)
  if (!slug || !serie) return null
  return (
    <Panel className="w-[320px] max-w-[calc(100vw-32px)]">
      <Cuerpo>
        <Titulo>Producción de {nombre}</Titulo>
        <p className="s-micro m-0 mt-1" style={{ color: 'var(--ink-2)' }}>
          BOE por día · doce meses · nacional
        </p>
        <span className="mt-2 block">
          <Serie valores={serie.valores} textos={serie.textos} className="w-full" />
        </span>
      </Cuerpo>
      <Pie>
        <span className="s-micro s-num" style={{ fontWeight: 500 }}>
          {formatInteger(serie.valores[serie.valores.length - 1])} boe/d
        </span>
        <span className="s-micro s-num" style={{ color: 'var(--ink-2)' }}>
          corte {serie.mes}
        </span>
      </Pie>
    </Panel>
  )
}
