'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { formatInteger } from '@/lib/format'
import { FLUIDO, Marca } from '../_ui/kit'

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

export type Recurso = (typeof RECURSOS)[number]['valor']

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`pointer-events-auto overflow-hidden ${className}`}
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

/** Filtros — recurso y estado; el conteo y el reinicio bajan al pie. */
export function PanelFiltros({
  recurso,
  onRecurso,
  ocultarAbandonados,
  onOcultar,
  visibles,
  total,
}: {
  recurso: Recurso
  onRecurso: (r: Recurso) => void
  ocultarAbandonados: boolean
  onOcultar: (v: boolean) => void
  visibles: number
  total: number
}) {
  const limpio = recurso === 'todos' && !ocultarAbandonados
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
              onOcultar(false)
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
}: {
  /** slug, nombre y pozos de cada operadora presente en el mapa */
  operadoras: { slug: string; nombre: string; pozos: number }[]
  seleccionada: string
  onSeleccionar: (slug: string) => void
}) {
  const [busca, setBusca] = useState('')
  const max = Math.max(1, ...operadoras.map((o) => o.pozos))
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? operadoras.filter((o) => o.nombre.toLowerCase().includes(q)) : operadoras
  }, [busca, operadoras])

  return (
    <Panel className="w-[268px]">
      <Cuerpo>
        <Titulo>Operadores principales</Titulo>

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
          className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0"
          style={{ maxHeight: 168, overflowY: 'auto' }}
        >
          {filtradas.map((op, i) => {
            const on = op.slug === seleccionada
            return (
              <li key={op.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSeleccionar(on ? '' : op.slug)}
                  className="flex items-center gap-2 rounded-[7px] px-1.5 py-1 text-left transition-colors"
                  style={{
                    background: on ? 'var(--hover)' : 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    marginInline: -6,
                    width: 'calc(100% + 12px)',
                  }}
                >
                  <span
                    className="s-mono w-4 shrink-0 text-[11px]"
                    style={{ color: on ? 'var(--accent-ink)' : 'var(--ink-3)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Marca nombre={op.nombre} />
                  <span
                    className="s-micro min-w-0 flex-1 truncate"
                    style={{ color: 'var(--ink)', fontWeight: on ? 500 : 400 }}
                  >
                    {op.nombre}
                  </span>
                  <span className={`s-barra hidden w-10 shrink-0 sm:block ${on ? 's-barra--lider' : ''}`} aria-hidden>
                    <i style={{ width: `${Math.max(3, (op.pozos / max) * 100)}%` }} />
                  </span>
                  <span className="s-num s-micro w-6 shrink-0 text-right" style={{ fontWeight: 500 }}>
                    {op.pozos}
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
          {filtradas.length === operadoras.length ? `${operadoras.length}` : `${filtradas.length}/${operadoras.length}`}
        </span>
      </Pie>
    </Panel>
  )
}
