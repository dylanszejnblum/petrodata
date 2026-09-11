import { Card, CardHead, CardPie, Chip } from './kit'
import { formatInteger } from '@/lib/format'

/* ARGENTINA EN EL MUNDO — la sección que /v2/indicadores no tenía.

   Es el único lugar de la página donde la cifra deja de ser «cuánto produce
   Vaca Muerta» y pasa a ser «qué puesto ocupa el país», y por eso vale una
   pieza propia y no otra lista de ranking.

   Tres decisiones que no son obvias:

   1. El gráfico es el PUESTO en el tiempo, no el volumen. El volumen ya está
      en las otras dos secciones; lo que sólo se ve acá es que Argentina cayó
      del 20.º al 29.º entre 2000 y 2019 y desde entonces recuperó ocho. Sin
      esa curva, el «#21» de hoy es un número suelto y la proyección a #15 no
      tiene de dónde agarrarse.

   2. El eje va INVERTIDO: el puesto 1 arriba. Es la única escala de la página
      donde el número chico es el bueno, y dibujarla como las demás —más alto,
      más grande— haría que la caída se leyera como una mejora.

   3. La proyección va punteada y con el punto hueco. No es una medición y no
      se puede dibujar con el mismo trazo que veinticinco años de datos de la
      EIA. Además lleva su chip, porque la línea sola no dice de dónde sale. */

type Punto = { year: number; rank: number }

/* La EIA publica los países en inglés y el fixture los guarda tal cual, que
   está bien: es el dato crudo. La traducción va acá y no en el fixture, porque
   traducir el fixture rompería el próximo re-scrape.

   Por ISO3 y no por el nombre en inglés: el código es estable y el nombre no
   —«Turkey» pasó a «Türkiye» en las series de la EIA— y una clave que cambia
   deja el país sin traducir sin que nadie se entere. */
const ES: Record<string, string> = {
  USA: 'Estados Unidos', RUS: 'Rusia', SAU: 'Arabia Saudita', CAN: 'Canadá',
  IRQ: 'Irak', CHN: 'China', IRN: 'Irán', ARE: 'Emiratos Árabes Unidos',
  BRA: 'Brasil', KWT: 'Kuwait', KAZ: 'Kazajistán', NOR: 'Noruega',
  ARG: 'Argentina', QAT: 'Qatar', AUS: 'Australia', DZA: 'Argelia',
  MYS: 'Malasia', TKM: 'Turkmenistán', LBY: 'Libia', VEN: 'Venezuela',
  GAB: 'Gabón', ISR: 'Israel', AZE: 'Azerbaiyán', OMN: 'Omán',
}

/** El nombre en castellano si lo tenemos; si no, el de la fuente sin tocar.
    Nunca una cadena vacía: un país sin traducir se muestra en inglés, que es
    peor que en castellano y mucho mejor que en blanco. */
const nombrePais = (iso3: string, ingles: string) => ES[iso3] ?? ingles

export function MundoRanking({
  rot,
  unidad,
  anio,
  paises,
  historia,
  arg,
  proyectado,
  color,
}: {
  rot: string
  unidad: string
  anio: number
  paises: number
  historia: Punto[]
  arg: { puesto: number; valor: number }
  proyectado: { anio: number; puesto: number; valor: number }
  color: string
}) {
  const peor = Math.max(...historia.map((h) => h.rank))
  const anioPeor = historia.find((h) => h.rank === peor)!.year
  /* La regla va del puesto proyectado —el mejor— al peor histórico. Todo lo
     que la card muestra cae adentro de ese rango por construcción. */
  const lo = proyectado.puesto
  const hi = peor
  const pos = (r: number) => ((r - lo) / (hi - lo || 1)) * 100
  const hoy = pos(arg.puesto)

  return (
    <Card>
      {/* «puesto mundial» en la cabecera: los tres números de la banda son
          rankings y nada lo decía. El «#» solo no alcanza —podría ser un número
          de proyecto, de pozo o de cualquier cosa— y el título del card habla
          del fluido, no de la unidad. */}
      <CardHead titulo={rot} nota={`puesto mundial · ${paises} países · ${anio}`} />
      <div className="px-4 pt-3 pb-3.5">
        <div className="s-banda">
          <span className="s-banda-riel" aria-hidden />
          {/* Lo recuperado: del peor puesto hasta el de hoy. */}
          <span
            className="s-banda-hecho"
            aria-hidden
            style={{ left: `${hoy}%`, right: 0, background: color }}
          />
          {/* Lo que falta, punteado: es una proyección y no puede pesar lo
              mismo que ocho años de datos de la EIA. */}
          <span
            className="s-banda-falta"
            aria-hidden
            style={{ left: 0, right: `${100 - hoy}%`, color }}
          />

          {/* El número va en ink-2 y NO en el color del fluido: medido daba
              2,87 en claro y 3,95 en oscuro, o sea reprobado en los dos. Y
              tampoco hace falta —la raya de abajo ya lleva el color y el pie
              dice «proyectado»—. Queda la jerarquía de tinta del sistema: el
              puesto de hoy en tinta plena, los dos de contexto en ink-2. */}
          <span className="s-banda-marca s-banda-marca--ini s-banda-marca--act">
            <span className="p" style={{ color: 'var(--ink-2)' }}>
              #{proyectado.puesto}
            </span>
            <i style={{ background: color }} aria-hidden />
            <span className="cap">{proyectado.anio} · proyectado</span>
          </span>
          <span
            className="s-banda-marca s-banda-marca--mid s-banda-marca--act"
            style={{ left: `${hoy}%` }}
          >
            <span className="p">
              #{arg.puesto}
              <span className="cap-en-linea">hoy</span>
            </span>
            <i style={{ background: 'var(--ink)' }} aria-hidden />
          </span>
          <span className="s-banda-marca s-banda-marca--fin">
            <span className="p" style={{ color: 'var(--ink-2)' }}>
              #{peor}
            </span>
            <i aria-hidden />
            <span className="cap">{anioPeor} · el peor</span>
          </span>
        </div>
      </div>

      <CardPie>
        {/* Los volúmenes viven acá y no sobre la banda: la banda es una escala
            de PUESTOS y meterle una magnitud en otra unidad encima la
            ensuciaría. Pero tienen que estar: el puesto sin el volumen no dice
            de qué tamaño es el salto. */}
        <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
          Hoy produce <b className="font-semibold">{formatInteger(Math.round(arg.valor))}</b>{' '}
          {unidad} y la proyección lo lleva a{' '}
          <b className="font-semibold">{formatInteger(proyectado.valor)}</b>. Tocó fondo en{' '}
          {anioPeor} en el puesto {peor} y desde entonces recuperó{' '}
          <b className="font-semibold">{peor - arg.puesto} puestos</b>; faltan{' '}
          <b className="font-semibold">{arg.puesto - proyectado.puesto}</b>.
        </span>
      </CardPie>
    </Card>
  )
}

/** El podio del mundo con Argentina clavada en su puesto real. El salto de
    numeración —del 12 al 21— se dibuja: sin marcarlo, la lista miente sobre
    quién está al lado de quién. */
export function PodioMundial({
  top,
  color,
}: {
  top: { rank: number; iso3: string; country: string; value: number; isArgentina?: boolean }[]
  color: string
}) {
  const max = Math.max(...top.map((t) => t.value))
  return (
    <>
      {top.map((t, i) => {
        const brecha = i > 0 ? t.rank - top[i - 1].rank - 1 : 0
        return (
          <div key={t.iso3}>
            {/* El corte va en ink-2 y no en ink-3: medido daba 2,56 en claro
                sobre el fondo hundido, o sea reprobado. El sistema reserva
                ink-3 para metadata pura —una fecha de corte, un número de
                puesto— y esto es una frase que hay que poder leer: dice cuánta
                lista se está salteando. En ink-2 mide 5,5 y 6,8. */}
            {brecha > 0 && (
              <div className="s-brecha">
                <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                  {brecha} {brecha === 1 ? 'puesto' : 'puestos'} entre medio
                </span>
              </div>
            )}
            {/* Argentina lleva el fondo de acento. Es la única fila de la lista
                que el lector vino a buscar, y semibold sola no alcanzaba para
                encontrarla entre trece filas. El tinte es el mismo del chip
                --info, o sea una superficie que el sistema ya usa. */}
            <div
              className="s-fila s-fila-hover"
              style={t.isArgentina ? { background: 'var(--accent-tint)' } : undefined}
            >
              <span
                className="s-mono w-5 shrink-0 text-[11px]"
                style={{ color: t.isArgentina ? 'var(--ink)' : 'var(--ink-3)' }}
              >
                {String(t.rank).padStart(2, '0')}
              </span>
              <span
                className={`s-cuerpo min-w-0 flex-1 truncate ${t.isArgentina ? 'font-semibold' : 'font-medium'}`}
              >
                {nombrePais(t.iso3, t.country)}
              </span>
              <span
                className="s-barra hidden w-20 shrink-0 sm:block"
                aria-hidden
                style={t.isArgentina ? { ['--barra-color' as string]: color } : undefined}
              >
                <i style={{ width: `${Math.max(3, (t.value / max) * 100)}%` }} />
              </span>
              {/* Sin la unidad en cada fila: la cabecera de la card ya la dice
                  y repetirla trece veces se comía el ancho de los nombres, que
                  quedaban en «Emi…» y «Kaz…». */}
              <span className="s-num w-16 shrink-0 text-right text-[13px] font-medium">
                {formatInteger(Math.round(t.value))}
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}

/** Los que más crecen. Es OTRO ranking y no el mismo ordenado distinto: en
    petróleo Argentina es 3.ª creciendo y 21.ª produciendo, y ese contraste es
    el contenido. */
export function MundoCrecimiento({
  lideres,
  puestoArg,
  color,
}: {
  lideres: { iso3: string; country: string; growthPct: number; isArgentina?: boolean }[]
  puestoArg: number
  color: string
}) {
  const max = Math.max(...lideres.map((l) => l.growthPct))
  return (
    <>
      {lideres.map((l) => (
        <div
          key={l.iso3}
          className="s-fila s-fila-hover"
          style={l.isArgentina ? { background: 'var(--accent-tint)' } : undefined}
        >
          <span
            className={`s-cuerpo min-w-0 flex-1 truncate ${l.isArgentina ? 'font-semibold' : 'font-medium'}`}
          >
            {nombrePais(l.iso3, l.country)}
          </span>
          {/* Sólo el puesto. El chip decía «3.º del mundo · 2020–2025» y el
              período ya está en la cabecera de la card; entre el chip largo, la
              barra y la cifra la fila se pasaba del ancho y la card —que tiene
              overflow oculto— le comía el nombre Y el porcentaje. La fila de
              Argentina era la única sin datos visibles, justo la que importa. */}
          {l.isArgentina && (
            <span className="s-chip s-chip--neutro s-chip--mini shrink-0">
              {puestoArg}.º del mundo
            </span>
          )}
          <span
            className="s-barra hidden w-20 shrink-0 sm:block"
            aria-hidden
            style={l.isArgentina ? { ['--barra-color' as string]: color } : undefined}
          >
            <i style={{ width: `${Math.max(3, (l.growthPct / max) * 100)}%` }} />
          </span>
          <span className="s-num w-14 shrink-0 text-right text-[13px] font-medium">
            +{Math.round(l.growthPct)}%
          </span>
        </div>
      ))}
    </>
  )
}
