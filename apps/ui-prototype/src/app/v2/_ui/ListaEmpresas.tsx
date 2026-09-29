'use client'

import { useId, useMemo, useState } from 'react'
import { Icono, PATH } from './iconos'

/* LISTA FILTRABLE — la Filter Table (§13) con el buscador de la §15 y un
   desglose por fila.

   Nadie lee 52 filas: busca una, o mira un grupo. Antes acá vivía la Records
   Table (§12) completa, que es la otra receta que el catálogo tiene para una
   tabla larga. Se cambió por ésta (pedido de Mariano, 2026-08-17) y el motivo
   es sano: la §12 trae selección con checkbox, y la selección sólo significa
   algo si hay acciones que aplicarle. Acá no las hay, así que era una casilla
   que se marca y no pasa nada. La §13 no promete nada que no cumpla.

   Lo que se gana de paso es la única animación ESTRUCTURAL del sistema:
   `grid-template-rows: 1fr → 0fr`, que es cómo se anima una altura `auto`. La
   usa dos veces: al filtrar, para que las filas que salen se colapsen en vez de
   desaparecer de un frame al otro, y al clickear una fila, para abrir su ficha.

   El desglose es el MISMO que el de provincias: riel vertical con un codo por
   línea, y cada línea un `.s-paso` con su ícono de 14. No es parecido, es la
   misma pieza — la geometría del riel, el paso, los badges mini y el ícono de
   introducción salen todos de sistema.css, y los cuatro íconos que comparten
   —producción, barras, intensidad, información— son los mismos paths. Dos
   desgloses distintos para la misma acción serían dos vocabularios.

   Pasó por una versión con placa de logo y renglones etiqueta→valor, que era
   la opción C de design-research/beautifului-dev/empresa-card-5.html. El logo
   se fue (pedido de Mariano, 2026-08-17): en una card suelta anclaba la
   identidad, pero acá el nombre ya está impreso en la fila justo arriba, así
   que ocupaba 56px de ancho para repetir lo que ya se sabía.

   Todo llega ya formateado desde el servidor —los `*_n` son sólo para
   comparar— por la razón de siempre: una función de formato no cruza el
   límite de servidor a cliente. */

export type FilaEmpresa = {
  slug: string
  nombre: string
  /** clave del grupo al que pertenece, para los filtros */
  grupo: string
  /** true si cotiza; es un filtro que cruza a los otros */
  cotiza: boolean
  /** ya formateado, p. ej. "34,2%" */
  nacional: string
  nacional_n: number
  /** rótulo del fluido; sin color, se lee como sin dato. `razon` es la
      relación valor/volumen de la que sale el rótulo, y es lo que lo explica:
      «Gas ×0,08» dice por qué es gas mucho mejor que «Gas» solo. */
  mix: { rot: string; color?: string; razon?: string }
  pozos: string
  pozos_n: number
  /* ── lo que se ve sólo al abrir la fila ──────────────────────────────── */
  /** reseña del fixture, o la frase derivada del mix si no hay */
  resena: string
  /** % del valor en dólares, formateado */
  valor: string
  /** qué parte de los pozos del país opera, formateado */
  pctPozos: string
  /** rinde por pozo contra la media, p. ej. "×1,6"; null si no se puede */
  rinde: string | null
  /** en qué tercio cae ese rinde: 1, 2 o 3 */
  rindeNivel: number
  bolsa?: { ticker: string; mercado: string; precio: string; delta: number }
}

export type GrupoFiltro = {
  id: string
  rot: string
  color?: string
  /** cuántas caen en el grupo; se calcula en el servidor */
  n: number
}

export function ListaEmpresas({
  filas,
  grupos,
  /** rótulos del pie, ya formateados por el servidor para el estado inicial */
  totalPct,
  totalPozos,
}: {
  filas: FilaEmpresa[]
  grupos: GrupoFiltro[]
  totalPct: string
  totalPozos: string
}) {
  const idBase = useId()
  const [grupo, setGrupo] = useState('todas')
  const [q, setQ] = useState('')
  /* Una sola abierta a la vez. En provincias cada fila guarda su estado y se
     pueden abrir todas, pero ahí son once; con 52 y una ficha de 130px, dejar
     abrir varias convierte la lista en una pila que hay que volver a cerrar a
     mano. El acordeón mantiene el largo previsible. */
  const [abierta, setAbierta] = useState<string | null>(null)

  /* El filtro decide qué se VE, no qué se renderiza: las 52 filas están
     siempre en el DOM y las que salen quedan colapsadas en alto cero. Es lo
     que permite animarlas — una fila desmontada no tiene qué animar — y de
     paso el buscador no vuelve a montar 52 nodos en cada tecla. */
  const { visible, resumen } = useMemo(() => {
    const txt = q.trim().toLowerCase()
    const pasa = (f: FilaEmpresa) =>
      (grupo === 'todas' || (grupo === 'cotizan' ? f.cotiza : f.grupo === grupo)) &&
      (!txt || f.nombre.toLowerCase().includes(txt))
    const v = new Set(filas.filter(pasa).map((f) => f.slug))
    const dentro = filas.filter((f) => v.has(f.slug))
    return {
      visible: v,
      resumen: {
        n: dentro.length,
        pct: dentro.reduce((s, f) => s + f.nacional_n, 0),
        pozos: dentro.reduce((s, f) => s + f.pozos_n, 0),
      },
    }
  }, [filas, grupo, q])

  const sinResultados = resumen.n === 0
  /* El pie arranca con los textos del servidor y sólo recalcula cuando hay un
     filtro puesto: así el primer render coincide exacto con el HTML servido y
     no hay parpadeo de hidratación por el formato de número. */
  const intacto = grupo === 'todas' && q.trim() === ''

  /* Cambiar de filtro cierra la ficha: si la que estaba abierta sale del
     filtro, quedaría un desglose colgando de una fila que ya no se ve. */
  function filtrar(id: string) {
    setGrupo(id)
    setAbierta(null)
  }

  return (
    /* A ancho completo de la sección y no centrada en 520: con seis píldoras la
       barra de filtros mide 563 y en 520 «Cotizan» quedaba cortada. Además las
       cards de las secciones 01 y 02 ocupan el ancho entero, así que centrar
       ésta la dejaba como la única angosta de la página. */
    <div>
      <div className="s-card mb-2">
        <div className="s-busca">
          <span className="shrink-0" style={{ color: 'var(--ink-3)' }}>
            <Icono d={PATH.buscar} size={14} grosor={2} />
          </span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setAbierta(null)
            }}
            placeholder="Buscar empresa…"
            aria-label="Buscar empresa"
          />
          {q && (
            <button
              type="button"
              className="s-icono shrink-0"
              style={{ width: 22, height: 22 }}
              onClick={() => setQ('')}
              aria-label="Limpiar la búsqueda"
            >
              <Icono d={PATH.cerrar} size={12} grosor={2} />
            </button>
          )}
        </div>
      </div>

      <div className="s-filtros" role="group" aria-label="Filtrar por fluido">
        {grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            className="s-fpill"
            aria-pressed={grupo === g.id}
            onClick={() => filtrar(g.id)}
          >
            {g.color && <i style={{ background: g.color }} />}
            {g.rot}
            <b>{g.n}</b>
          </button>
        ))}
      </div>

      <div className="s-card">
        <div className="s-gcab">
          <span>Empresa</span>
          <span className="text-right">Nacional</span>
          <span className="pl-3">Mix</span>
          <span className="text-right">Pozos</span>
          <span />
        </div>
        <div className="max-h-[392px] overflow-auto">
          {filas.map((f) => {
            const id = `${idBase}-${f.slug}`
            const esta = abierta === f.slug
            return (
              <div key={f.slug} className="s-colapsa" data-abierto={visible.has(f.slug) ? 'si' : 'no'}>
                <div>
                  <button
                    type="button"
                    className="s-gfila"
                    aria-expanded={esta}
                    aria-controls={id}
                    onClick={() => setAbierta((a) => (a === f.slug ? null : f.slug))}
                  >
                    <span className="truncate font-medium">{f.nombre}</span>
                    <span className="s-num text-right">{f.nacional}</span>
                    <span className="pl-3">
                      <span
                        className="s-festado"
                        style={
                          f.mix.color
                            ? {
                                /* La misma receta que .s-tag: el fondo lleva 13% del
                                   color y el texto 55% mezclado con la tinta, que es
                                   el escalón donde los ocho de la paleta llegan a
                                   AA. Va inline porque el color entra por fila. */
                                background: `color-mix(in srgb, ${f.mix.color} 13%, var(--surface))`,
                                color: `color-mix(in srgb, ${f.mix.color} 55%, var(--ink))`,
                              }
                            : { background: 'var(--field)', color: 'var(--ink-2)' }
                        }
                      >
                        {f.mix.rot}
                      </span>
                    </span>
                    <span className="s-num text-right" style={{ color: 'var(--ink-2)' }}>
                      {f.pozos}
                    </span>
                    {/* Chevron de 14 con trazo 2,2 y giro en 300ms: el mismo que
                        abre el desglose de provincias. Que sean la misma pieza
                        importa más que su tamaño — dos formas distintas de
                        «esto se abre» en la misma web es una de más. */}
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

                  <div id={id} className="s-colapsa" data-abierto={esta ? 'si' : 'no'}>
                    <div>
                      <Ficha f={f} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {/* El vacío no se esconde: si el buscador no encuentra nada, la card
              lo dice en el mismo renglón que ocuparía una fila. */}
          {sinResultados && (
            <p className="s-etq m-0 px-3 py-6 text-center">
              Ninguna empresa coincide con «{q.trim()}».
            </p>
          )}
        </div>
        <div className="s-pie-card">
          <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
            <b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
              {intacto ? filas.length : resumen.n}
            </b>{' '}
            de {filas.length}
          </span>
          <span className="s-micro ml-auto" style={{ color: 'var(--ink-2)' }}>
            <b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
              {intacto ? totalPct : `${resumen.pct.toFixed(1).replace('.', ',')}%`}
            </b>{' '}
            del país
          </span>
          <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
            <b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
              {intacto ? totalPozos : resumen.pozos.toLocaleString('es-AR')}
            </b>{' '}
            pozos
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── El desglose ────────────────────────────────────────────────────────
   La misma composición que el de provincias, con la geometría del riel
   adaptada a esta fila.

   Allá el riel cae en el centro de la pastilla de la inicial (52px) porque hay
   una pastilla donde engancharse. Acá la fila es una grilla sin marca a la
   izquierda, así que el riel va en 20 —adentro de los 12 de padding de la
   celda, debajo del nombre— y el contenido en 27. Lo que se conserva es la
   RELACIÓN: 7px entre el riel y la caja del paso, y con los 6 de padding del
   paso, 13 entre el riel y el ícono. Los mismos que en provincias. */
function Ficha({ f }: { f: FilaEmpresa }) {
  return (
    <div
      style={{
        padding: '4px 12px 12px 27px',
        background: 'var(--inset)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Todo cuelga como hijo DIRECTO del riel: envolver algo en un contenedor
          haría que el codo se enganche al contenedor y hubiera un solo codo
          para todo el grupo. */}
      <div className="s-rama flex flex-col gap-1">
        {/* La reseña cuelga del riel como el resto, con la variante de
            introducción: el ícono se alinea al primer renglón —la prosa
            envuelve— y el codo lo sigue hasta ahí. */}
        <div className="s-paso s-paso--intro">
          <span className="mt-[3px] shrink-0" style={{ color: 'var(--ink-3)' }}>
            <Icono d={PATH.info} size={14} grosor={2} />
          </span>
          <p
            className="m-0 min-w-0 flex-1 text-[12.5px] leading-relaxed"
            style={{ color: 'var(--ink-2)', textWrap: 'pretty' }}
          >
            {f.resena}
          </p>
        </div>

        <Paso icono={PATH.tendencia} rotulo="Producción" valor={f.nacional} badges={['del país']} />
        <Paso icono={PATH.barras} rotulo="Valor en dólares" valor={f.valor} badges={['del país']} />
        <Paso
          icono={PATH.pozo}
          rotulo="Pozos"
          valor={f.pozos}
          badges={[`${f.pctPozos} del país`]}
        />
        {f.rinde && (
          <Paso
            icono={PATH.intensidad}
            rotulo="Rinde por pozo"
            valor={f.rinde}
            badges={['contra la media del país']}
          />
        )}
        {/* El fluido es el rótulo, no un valor: «Petróleo» ES la información.
            El color va en la gota, que es donde significa algo — un chip de
            color al lado del rótulo sería el mismo dato dos veces. */}
        <Paso
          icono={PATH.gota}
          color={f.mix.color}
          rotulo={f.mix.rot}
          badges={f.mix.razon ? [`${f.mix.razon} valor/volumen`] : ['sin relación calculable']}
        />
        {/* Sólo si cotiza: un renglón que diga «no cotiza» gasta una línea en
            informar que no hay nada. */}
        {f.bolsa && (
          <Paso
            icono={PATH.moneda}
            rotulo={`${f.bolsa.ticker} · ${f.bolsa.mercado}`}
            valor={`US$ ${f.bolsa.precio}`}
            delta={f.bolsa.delta}
          />
        )}
      </div>
    </div>
  )
}

/* Un renglón del riel. Es .s-paso, MEDIDO en la traza «Thinking» de la
   referencia: 28 de alto mínimo, fondo transparente, sin anillo y sin sombra.
   Todos los hijos del riel son esta misma pieza, y ahí está la mitad del valor
   — cinco cosas que cuelgan del mismo riel se leen como pares porque tienen la
   misma forma. */
function Paso({
  icono,
  rotulo,
  valor,
  badges = [],
  delta,
  color,
}: {
  icono: string
  rotulo: string
  /** ya formateado; sin valor, el paso es sólo rótulo y badges */
  valor?: string
  badges?: string[]
  /** variación del día, para la cotización */
  delta?: number
  /** tiñe el ícono. Sólo cuando el color dice algo — el fluido. */
  color?: string
}) {
  return (
    <div className="s-paso">
      {/* Ícono de trazo y no un punto de color: un círculo de color sin
          significado contradice la regla del sistema, y la referencia usa
          íconos de trazo en todas sus trazas. */}
      <span className="shrink-0" style={{ color: color ?? 'var(--ink-3)' }}>
        <Icono d={icono} size={14} grosor={2} />
      </span>
      {/* El rótulo cede antes que nada: es lo único flexible de la fila. */}
      <span className="min-w-0 truncate text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
        {rotulo}
      </span>
      {valor && <span className="s-num shrink-0 text-[12.5px] font-medium">{valor}</span>}
      {delta !== undefined && (
        <span className={`s-delta shrink-0 ${delta >= 0 ? 's-delta--sube' : 's-delta--baja'}`}>
          {delta >= 0 ? '+' : '\u2212'}
          {Math.abs(delta).toFixed(1).replace('.', ',')}%
        </span>
      )}
      {/* No crecen ni se recortan: bajan de renglón, que es lo que hace el paso
          desde que envuelve. .s-chip es inline-flex y ahí text-overflow no
          aplica sobre un nodo de texto suelto. */}
      {badges.map((b) => (
        <span key={b} className="s-chip s-chip--neutro s-chip--mini shrink-0">
          {b}
        </span>
      ))}
    </div>
  )
}
