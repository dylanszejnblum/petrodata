'use client'

import { useState } from 'react'

/* Serie de líneas con lectura al recorrer — la Insight Card del catálogo.

   Corrijo acá una conclusión mía que estuvo mal toda la sesión: yo había dicho
   que la referencia NO tiene gráficos. Los tiene, en su sección 16, dibujados
   en un <canvas> de 320×166 — por eso mi barrido del DOM buscando SVG no
   encontró nada y me quedé con la conclusión falsa.

   Su lenguaje, mirado: líneas SUAVES superpuestas en el mismo plano, una por
   serie con el color de su categoría; un punto relleno al final de cada línea;
   una punteada horizontal al nivel de ese último valor; y nada más. Sin ejes,
   sin grilla, sin números sobre el trazo: los valores viven ARRIBA del gráfico.

   Lo que se aparta a propósito, y por qué:

   · Un punto por mes. La referencia no los tiene porque su trazo es una señal
     continua; los nuestros son doce mediciones discretas, y verlas evita que la
     curva se lea como una interpolación libre entre dos extremos.
   · Sin el degradado de entrada. Allá la línea se desvanece hacia la izquierda;
     acá la serie arranca en un mes concreto, y si el principio se ve más flojo
     que el resto, la primera medición parece menos cierta que las otras.
   · Sin pista bajo los interruptores. La pista es la afordancia de un control
     de opción única y estos dos son independientes: los dos pueden estar
     encendidos a la vez. Además en tema oscuro quedaba a medio punto de L* del
     fondo de la barra y desaparecía. */

export type SerieDef = {
  nombre: string
  color: string
  unidad: string
  valores: number[]
  /** cada valor ya formateado; el componente no formatea */
  textos: string[]
}

const W = 628
const H = 158
const PAD = 16

/* Con `dom` las series se dibujan contra un dominio impuesto y no contra el
   suyo. Sin él cada línea se normaliza sola, que es lo correcto cuando las
   magnitudes no son comparables —petróleo en bbl/d contra gas en MMm³/d— y lo
   contrario de lo correcto cuando sí lo son: agro y energía son los dos
   dólares de exportación, y el contenido de esa serie es precisamente que una
   se acerca a la otra. Normalizadas por separado, las dos curvas terminan
   arriba y la comparación desaparece. */
function coords(v: number[], dom?: readonly [number, number]) {
  const mn = dom ? dom[0] : Math.min(...v)
  const mx = dom ? dom[1] : Math.max(...v)
  const r = mx - mn || 1
  return v.map((x, i) => [
    PAD + ((W - 2 * PAD) * i) / (v.length - 1),
    H - PAD - ((H - 2 * PAD) * (x - mn)) / r,
  ] as const)
}

/** Catmull-Rom pasada a bézier: el trazo continuo y suave de la referencia,
    sin picos en cada punto. */
function trazo(P: readonly (readonly [number, number])[]) {
  let d = `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = i > 0 ? P[i - 1] : P[0]
    const p1 = P[i]
    const p2 = P[i + 1]
    const p3 = i + 2 < P.length ? P[i + 2] : P[P.length - 1]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export function SerieLinea({
  series,
  meses,
  rango,
  escala = 'propia',
}: {
  series: SerieDef[]
  /** rótulo de cada mes, ya formateado */
  meses: string[]
  /** rótulo del período completo, para el chip en reposo */
  rango: string
  /** 'propia': cada línea contra su propio rango, para magnitudes que no se
      comparan. 'comun': todas contra el mismo, para magnitudes que sí. */
  escala?: 'propia' | 'comun'
}) {
  const [mes, setMes] = useState<number | null>(null)
  const [ocultas, setOcultas] = useState<string[]>([])
  const n = meses.length
  const i = mes ?? n - 1
  /* El dominio común arranca en CERO y no en el mínimo del conjunto: con dos
     magnitudes comparadas entre sí, la distancia entre las curvas tiene que ser
     la razón entre los valores. Recortado al mínimo, un 11 contra 52 se dibuja
     como si fuera un 1 contra 5. */
  const todos = series.flatMap((s) => s.valores)
  const dom = escala === 'comun' ? ([0, Math.max(...todos)] as const) : undefined
  const geo = series.map((s) => coords(s.valores, dom))

  return (
    <>
      {/* Las cifras van AFUERA del bloque hundido, en el cuerpo de la card.
          En la referencia es así y yo las había metido adentro. Y en DOS
          renglones: la unidad sube a la línea de base de la cifra en vez de
          colgar debajo, que es lo que ya hacen las filas de dato del resto. */}
      <div className="flex items-start gap-6">
        {series.map((s) => (
          <div key={s.nombre} className="min-w-0 flex-1">
            <span className="s-micro flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
              <i
                aria-hidden
                className="block size-2 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              {s.nombre}
            </span>
            {/* 13/600 y no 17: es exactamente el tratamiento del titular de la
                card 01 —"28.176.497 BOE"—, así las dos secciones se leen como
                el mismo nivel de jerarquía. Entre 13 y 17 el sistema no tiene
                nada, así que 13 es el escalón que hay. */}
            <p className="m-0 mt-0.5 flex items-baseline gap-1.5">
              <span className="s-titulo s-num">{s.textos[i]}</span>
              <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {s.unidad}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="s-hundido mt-2.5">
        {/* Lo accionable a la izquierda y el contexto a la derecha, que es cómo
            la referencia arma esta ranura. El chip dice el rango en reposo y el
            mes señalado mientras se recorre el gráfico. */}
        <div className="s-hundido-bar">
          <span className="flex gap-1.5">
            {series.map((s) => {
              const off = ocultas.includes(s.nombre)
              return (
                <button
                  key={s.nombre}
                  type="button"
                  aria-pressed={!off}
                  onClick={() =>
                    setOcultas((v) =>
                      v.includes(s.nombre) ? v.filter((x) => x !== s.nombre) : [...v, s.nombre],
                    )
                  }
                  className="s-toggle-btn"
                  style={{ opacity: off ? 0.5 : 1 }}
                >
                  <i style={{ background: s.color }} />
                  {s.nombre}
                </button>
              )
            })}
          </span>
          <span className="s-chip s-chip--neutro s-chip--mini shrink-0">
            {mes === null ? rango : meses[mes]}
          </span>
        </div>

        <div className="px-2.5 pt-3 pb-2">
          <svg
            className="s-graf"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Serie de ${n} meses`}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setMes(
                Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))),
              )
            }}
            onMouseLeave={() => setMes(null)}
          >
            {series.map((s, k) =>
              ocultas.includes(s.nombre) ? null : (
                <line
                  key={`g${s.nombre}`}
                  className="s-graf-guia"
                  x1={PAD}
                  x2={W - PAD}
                  y1={geo[k][n - 1][1]}
                  y2={geo[k][n - 1][1]}
                  stroke={s.color}
                />
              ),
            )}
            {series.map((s, k) =>
              ocultas.includes(s.nombre) ? null : (
                <path
                  key={`l${s.nombre}`}
                  className="s-graf-linea"
                  d={trazo(geo[k])}
                  stroke={s.color}
                />
              ),
            )}
            {/* Un punto por mes: cada uno es una medición. Chicos y con borde de
                --surface, así el trazo pasa por detrás sin ensuciarlos. */}
            {series.map((s, k) =>
              ocultas.includes(s.nombre)
                ? null
                : geo[k].slice(0, -1).map(([x, y], j) => (
                    <circle
                      key={`p${s.nombre}${j}`}
                      cx={x}
                      cy={y}
                      r={2.5}
                      fill={s.color}
                      stroke="var(--surface)"
                      strokeWidth={1.5}
                    />
                  )),
            )}
            {series.map((s, k) =>
              ocultas.includes(s.nombre) ? null : (
                <g key={`f${s.nombre}`}>
                  <circle
                    className="s-graf-halo"
                    cx={geo[k][n - 1][0]}
                    cy={geo[k][n - 1][1]}
                    fill={s.color}
                  />
                  <circle
                    className="s-graf-fin"
                    cx={geo[k][n - 1][0]}
                    cy={geo[k][n - 1][1]}
                    fill={s.color}
                  />
                </g>
              ),
            )}
            {mes !== null && (
              <>
                <line
                  className="s-graf-scrub"
                  x1={geo[0][mes][0]}
                  x2={geo[0][mes][0]}
                  y1={6}
                  y2={H - 6}
                />
                {series.map((s, k) =>
                  ocultas.includes(s.nombre) ? null : (
                    <circle
                      key={`s${s.nombre}`}
                      className="s-graf-pt"
                      cx={geo[k][mes][0]}
                      cy={geo[k][mes][1]}
                      fill={s.color}
                    />
                  ),
                )}
              </>
            )}
          </svg>
          <div className="mt-0.5 flex justify-between">
            <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
              {meses[0]}
            </span>
            <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
              {meses[n - 1]}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
