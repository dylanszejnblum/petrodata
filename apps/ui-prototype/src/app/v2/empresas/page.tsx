import { Seccion, Card, CardBarra, CardPie, Pie, recorte, FLUIDO } from '../_ui/kit'
import { LogoEmpresa } from '../_ui/LogoEmpresa'
import { PanelPozos, PanelPeso, PanelCeo } from '../_ui/PanelEmpresa'
import { Pila } from '../_ui/Pila'
import { ListaEmpresas, type FilaEmpresa, type GrupoFiltro } from '../_ui/ListaEmpresas'
import { COMPANIES, type Company } from '@/fixtures/companies'
import { WELLS } from '@/fixtures/wells'
import { formatDecimal, formatInteger } from '@/lib/format'

/* EMPRESAS — 52 registros.

   La sección va de lo general a lo particular y termina en la lista, no al
   revés: el dato de esta página no es que hay 52 empresas sino que tres
   explican el 56,8% y veintiuna el 0,0%. Una tabla de 52 filas iguales es
   justamente lo que esconde eso, así que la tabla llega tercera.

     01  las tres primeras → una card de contexto por cada una
     02  la lista           → la Filter Table (§13) con el buscador de la §15
     03  cómo se reparte    → la pila partida por empresa + los tres tramos

   El reparto va ÚLTIMO (pedido de Mariano, 2026-08-17). Es el cierre y no la
   introducción: después de ver las tres primeras y recorrer las 52, la pila
   dice qué forma tiene el conjunto que acabás de mirar.

   Las tres primeras van ADELANTE (pedido de Mariano, 2026-08-17). El orden es
   de lo concreto a lo general: quiénes son las que mueven la aguja, después
   cómo se reparte el resto y al final la lista entera.

   La 03 tuvo antes la Records Table (§12), que es la otra receta del catálogo
   para una tabla larga y la que más se parece a esto —su demo es, literalmente,
   una tabla de empresas—. Se cambió por la §13 (pedido de Mariano, 2026-08-17):
   la §12 trae selección con checkbox, y una casilla que se marca sin que haya
   ninguna acción que aplicarle es una promesa que la página no cumple. La §13
   no promete nada de más y encima trae la única animación estructural del
   sistema, el colapso de fila al filtrar. */

/* ── El mix de fluido ────────────────────────────────────────────────────
   No es un dato de la fuente: es la RELACIÓN entre las dos columnas que la
   página ya tenía y que sueltas no decían nada. Si una empresa pesa más en el
   valor en dólares que en la producción, lo que saca es petróleo, que vale
   mucho más por unidad de energía; si pesa menos, es gas.

   TotalEnergies es el caso que lo demuestra: 11,7% de la producción del país y
   0,9% del valor. Vista, al revés: 4,4% y 7,7%.

   Los cortes en 1,2 y 0,8 son míos, y por eso van dichos en el pie de la
   sección. Las 21 empresas que están en 0,0% en las dos columnas no tienen
   relación calculable y quedan SIN clasificar: no se les inventa una categoría
   para que la columna quede completa. */
const MIXTO = '#9a5cff' // el violeta de la paleta categórica medida

function mixDe(c: Company): { rot: string; color?: string; razon?: string } {
  if (c.pctNacional === 0) return { rot: 'sin dato' }
  const r = c.pctValor / c.pctNacional
  const razon = `×${formatDecimal(r, 2)}`
  if (r >= 1.2) return { rot: 'Petróleo', color: FLUIDO.petroleo, razon }
  if (r <= 0.8) return { rot: 'Gas', color: FLUIDO.gas, razon }
  return { rot: 'Mixto', color: MIXTO, razon }
}

/* La reseña de reemplazo, para las 45 empresas que no traen `blurb` en la
   fuente. Describe el mix con los números que ya están —cuánto pesa en volumen
   contra cuánto en valor— y no afirma nada sobre la empresa que el dato no
   sostenga. Es una sola función porque la usan las cards de la 01 y las fichas
   de la 03: dos textos distintos para el mismo hueco serían dos voces. */
function resenaDe(c: Company, mix: string): string {
  if (c.blurb) return c.blurb
  const vol = formatDecimal(c.pctNacional, 1)
  const val = formatDecimal(c.pctValor, 1)
  if (mix === 'Gas') return `El grueso de lo que produce es gas: pesa ${vol}% del volumen del país y ${val}% del valor.`
  if (mix === 'Petróleo') return `Producción volcada al petróleo: pesa ${vol}% del volumen del país y ${val}% del valor.`
  if (mix === 'Mixto') return 'Mezcla pareja de petróleo y gas: pesa casi lo mismo en volumen que en valor.'
  /* Las 21 que están en 0,0% en las dos columnas no tienen mix calculable, así
     que la frase se apoya en lo único que sí se sabe de ellas: sus pozos. */
  return `Opera ${formatInteger(c.proyectos)} pozos y no llega al 0,1% de la producción del país.`
}

/* Los tres tramos se nombran por su RANGO y no con un apodo. Antes decían «Con
   peso propio», «Con producción» y «Bajo el redondeo», y ninguno de los tres se
   entendía sin leer la nota de al lado: eran etiquetas inventadas para algo que
   ya tiene un nombre exacto —el corte de participación—. El rótulo ES el
   criterio, y la nota pasa a decir lo que el rango no dice. */
const TRAMOS = [
  {
    rot: '1% o más del país',
    nota: 'las que mueven la aguja',
    test: (c: Company) => c.pctNacional >= 1,
  },
  {
    rot: 'Entre 0,1% y 0,9%',
    nota: 'presencia real, peso chico',
    test: (c: Company) => c.pctNacional > 0 && c.pctNacional < 1,
  },
  {
    rot: 'Menos de 0,1%',
    nota: 'aparecen en 0,0% al redondear',
    test: (c: Company) => c.pctNacional === 0,
  },
]

export default function V2Empresas() {
  const orden = COMPANIES.slice().sort(
    (a, b) => b.pctNacional - a.pctNacional || b.proyectos - a.proyectos,
  )
  const pozosTotal = COMPANIES.reduce((s, c) => s + c.proyectos, 0)
  const nacionalTotal = COMPANIES.reduce((s, c) => s + c.pctNacional, 0)
  const cotizan = COMPANIES.filter((c) => c.isPublic)
  const top3 = orden.slice(0, 3).reduce((s, c) => s + c.pctNacional, 0)
  const top10Pct = orden.slice(0, 10).reduce((s, c) => s + c.pctNacional, 0)

  /* La pila lleva un segmento por empresa CON producción. Las 21 en 0,0% no
     tienen ancho —a cero no se puede dibujar nada— y van juntas en un resto
     gris que sí se puede señalar, igual que el Estado Nacional en la lista de
     provincias. */
  /* Cuántos pozos de cada empresa hay en la MUESTRA que dibuja el mapa. No
     son sus 5.725: fixtures/wells.ts tiene 220 puntos sorteados por
     participación, con la proporción correcta pero no el conteo. El panel
     muestra el total real en su chip y la muestra queda en el title del
     enlace, que es donde no promete de más. */
  const pozosEnMapa = new Map<string, number>()
  for (const w of WELLS) {
    const k = w.properties.operator
    pozosEnMapa.set(k, (pozosEnMapa.get(k) ?? 0) + 1)
  }

  /* Escala común de las dos barras: el máximo de las seis cifras de las tres
     cards, no el 100%. Contra 100 las seis quedarían pegadas a cero y no se
     compararían entre sí, que es justamente lo que la pieza viene a mostrar. */
  const maxBarra = Math.max(
    ...orden.slice(0, 3).flatMap((c) => [c.pctNacional, c.pctValor]),
  )

  const conPeso = orden.filter((c) => c.pctNacional > 0)
  const enCero = COMPANIES.filter((c) => c.pctNacional === 0)
  const pozosEnCero = enCero.reduce((s, c) => s + c.proyectos, 0)

  const segmentos = [
    ...conPeso.map((c) => ({
      clave: c.slug,
      valor: c.pctNacional,
      texto: `${c.name} · ${formatDecimal(c.pctNacional, 1)}%`,
      color: mixDe(c).color,
    })),
    {
      clave: '__resto',
      /* Ancho arbitrario y declarado: su participación es cero, así que no hay
         proporción que respetar. 1 sobre 99 es lo mínimo para que se pueda
         señalar sin mentir sobre su tamaño. */
      valor: 1,
      texto: `${enCero.length} empresas en 0,0% · ${formatInteger(pozosEnCero)} pozos`,
    },
  ]

  const filas: FilaEmpresa[] = orden.map((c) => {
    const m = mixDe(c)
    const pctPozos = (c.proyectos / pozosTotal) * 100
    /* Mismo cálculo que en la sección 01: cuánto rinde cada pozo contra la
       media del país. Sin pozos no hay división posible y la fila lo omite en
       vez de mostrar un infinito. */
    const rinde = pctPozos > 0 && c.pctNacional > 0 ? c.pctNacional / pctPozos : null
    return {
      slug: c.slug,
      nombre: c.name,
      grupo: m.rot,
      cotiza: c.isPublic,
      nacional: `${formatDecimal(c.pctNacional, 1)}%`,
      nacional_n: c.pctNacional,
      mix: { rot: m.rot, color: m.color, razon: m.razon },
      pozos: formatInteger(c.proyectos),
      pozos_n: c.proyectos,
      resena: resenaDe(c, m.rot),
      valor: `${formatDecimal(c.pctValor, 1)}%`,
      pctPozos: `${formatDecimal(pctPozos, 1)}%`,
      rinde: rinde ? `×${formatDecimal(rinde, 1)}` : null,
      rindeNivel: rinde ? (rinde >= 2 ? 3 : rinde >= 1 ? 2 : 1) : 1,
      bolsa:
        c.isPublic && c.exchange && c.ticker
          ? {
              ticker: c.ticker,
              mercado: c.exchange,
              precio: formatDecimal(c.price ?? 0, 2),
              delta: c.change ?? 0,
            }
          : undefined,
    }
  })

  /* Los filtros llevan el recuento al lado, así la barra también es un
     resumen: se ve cuántas hay de cada fluido sin tocar nada. «Cotizan» cruza
     a los otros tres —una petrolera puede cotizar— y por eso va último y
     separado del punto de color, que ahí significa otra cosa. */
  const grupos: GrupoFiltro[] = [
    { id: 'todas', rot: 'Todas', n: COMPANIES.length },
    { id: 'Petróleo', rot: 'Petróleo', color: FLUIDO.petroleo, n: COMPANIES.filter((c) => mixDe(c).rot === 'Petróleo').length },
    { id: 'Gas', rot: 'Gas', color: FLUIDO.gas, n: COMPANIES.filter((c) => mixDe(c).rot === 'Gas').length },
    { id: 'Mixto', rot: 'Mixto', color: MIXTO, n: COMPANIES.filter((c) => mixDe(c).rot === 'Mixto').length },
    { id: 'sin dato', rot: 'Sin dato', n: enCero.length },
    { id: 'cotizan', rot: 'Cotizan', color: 'var(--green)', n: cotizan.length },
  ]

  return (
    <>
      <Seccion
        n="01"
        titulo="Las tres primeras"
        desc="Entre las tres explican más de la mitad de la producción del país."
      >
        {/* La composición es la de la fila de noticias del dashboard (pedido de
            Mariano, 2026-08-17): placa cuadrada a la izquierda, alineada arriba
            con el título, y todo el contenido en la columna de la derecha. Allá
            la placa es la miniatura de la nota; acá, el logo de la empresa.

            El puesto va a la derecha del renglón del nombre, que es donde la
            fila de noticias pone el tag de categoría. Así las dos piezas de la
            página que arrancan con una imagen de 56 se leen igual. */}
        <div className="flex flex-col gap-2">
          {orden.slice(0, 3).map((c, i) => {
            const m = mixDe(c)
            /* Cuánto rinde cada pozo comparado con la media del país: su
               participación en la producción dividida por su participación en
               los pozos. Es el dato que explica por qué TotalEnergies está
               segunda con 366 pozos mientras PAE, con 4.471, está tercera. */
            const pctPozos = (c.proyectos / pozosTotal) * 100
            const rinde = pctPozos > 0 ? c.pctNacional / pctPozos : null
            return (
              <Card key={c.slug} className="s-card--globo">
                {/* items-start y no items-center: la placa arranca a la altura
                    del nombre, como en la fila de noticias. Centrada, con tres
                    cards de alto distinto, quedaría a una altura distinta en
                    cada una. */}
                <div className="flex items-start gap-3 p-3">
                  {/* 120 y no 56: es el alto EXACTO de la columna de la
                      derecha —19,5 del nombre + 37,5 de la reseña recortada a
                      dos líneas + 8 de separación + 55 del bloque de figuras,
                      medido en las tres cards—. Con 56 quedaba un hueco de 64px
                      debajo de la placa y la card se leía desbalanceada.

                      La referencia de esto es la fila de noticias del
                      dashboard, donde la miniatura y el texto miden 56 y 60: la
                      imagen ocupa el alto de lo que acompaña. Acá lo que
                      acompaña mide el doble, así que la placa lo sigue.

                      Va clavado en px y no con align-self:stretch porque la
                      placa tiene que quedar CUADRADA: estirada al alto de la
                      columna con 56 de ancho, un lockup apaisado quedaría en una
                      ranura vertical, que es la peor caja posible para él.

                      El lado NO se pasa por prop: con `responsiva` lo define
                      .s-placa--grande en sistema.css, porque tiene que cambiar
                      en mobile y una media query no se escribe en un style
                      inline. Pasar `caja` acá no haría nada — un custom
                      property inline gana sobre la hoja, media query incluida,
                      y ese es justamente el bug que lo llevó a CSS. */}
                  <LogoEmpresa
                    nombre={c.name}
                    website={c.website}
                    logoUrl={c.logoUrl}
                    responsiva
                  />
                  <div className="min-w-0 flex-1">
                    <span className="s-cuerpo block truncate font-medium">{c.name}</span>
                    {/* Sin reseña en la fuente, la línea DESCRIBE el mix en vez
                        de repetir las figuras que están justo abajo. Se queda en
                        lo que dicen los números —cuánto pesa en volumen contra
                        cuánto en valor— y no afirma nada sobre la empresa que el
                        dato no sostenga. */}
                    <p className="s-desc m-0 mt-0.5" style={{ ...recorte(2, 18.75), marginTop: 2 }}>
                      {resenaDe(c, m.rot)}
                    </p>
                    {/* Dos paneles en vez de las tres cifras planas: el mapa
                        de sus pozos —que enlaza al mapa ya filtrado por la
                        empresa— y las dos participaciones a la misma escala.

                        La receta del panel es la mini card de la Insight Card
                        (§16), en su variante blanca: sobre la card, que también
                        es blanca, lo único que la separa es el anillo de 1px.

                        Se probaron tres paneles —el tercero era el reparto de
                        sus pozos por estado— y se cayó: la barra tricolor no se
                        podía descifrar sin una leyenda, y la leyenda no entraba
                        sin envolver a dos líneas. */}
                    <div className="mt-2.5 flex gap-2">
                      <PanelPozos
                        slug={c.slug}
                        nombre={c.name}
                        color={m.color ?? 'var(--ink-3)'}
                        total={formatInteger(c.proyectos)}
                        muestra={pozosEnMapa.get(c.slug) ?? 0}
                      />
                      <PanelPeso
                        produccion={`${formatDecimal(c.pctNacional, 1)}%`}
                        valor={`${formatDecimal(c.pctValor, 1)}%`}
                        produccionPct={(c.pctNacional / maxBarra) * 100}
                        valorPct={(c.pctValor / maxBarra) * 100}
                        color={m.color ?? 'var(--ink-3)'}
                      />
                      <PanelCeo slug={c.slug} />
                    </div>
                  </div>
                </div>
                <CardPie>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {/* El puesto va PRIMERO en el pie y no arriba, donde competía
                        con el nombre por el mismo renglón. Es la anotación menos
                        urgente de la card —que YPF es la primera ya lo dice
                        estar primera en la lista— y acá le entra el denominador,
                        que arriba no: «1.ª de 52» dice algo que «1.ª» sola no. */}
                    <span className="s-adj">
                      <b className="s-num">{i + 1}.ª</b> de {COMPANIES.length}
                    </span>
                    <span className="s-adj">
                      <i style={{ background: m.color ?? 'var(--ink-3)' }} />
                      {m.rot}
                    </span>
                    {rinde && (
                      <span className="s-adj" title="Participación en la producción dividida por participación en los pozos">
                        <b className="s-num">×{formatDecimal(rinde, 1)}</b> por pozo
                      </span>
                    )}
                    {c.isPublic && c.exchange && (
                      <span className="s-adj" title={`${c.ticker} en ${c.exchange}`}>
                        <i style={{ background: 'var(--green)' }} />
                        <b>{c.ticker}</b>
                        <span className="s-num">US$ {formatDecimal(c.price ?? 0, 2)}</span>
                        {c.change != null && (
                          <span
                            className={`s-delta ${c.change >= 0 ? 's-delta--sube' : 's-delta--baja'}`}
                          >
                            {c.change >= 0 ? '+' : '\u2212'}
                            {formatDecimal(Math.abs(c.change), 1)}%
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </CardPie>
              </Card>
            )
          })}
        </div>
        <Pie>
          «Por pozo» compara el rinde de cada una con la media del país: es su participación en
          la producción dividida por su participación en los pozos. Los mapas dibujan una muestra
          de {formatInteger(WELLS.length)} pozos de toda la cuenca, no los {formatInteger(pozosTotal)}{' '}
          del catálogo: la proporción entre empresas es la real, el conteo no. Cartografía de ©{' '}
          <a
            href="https://carto.com/about-carto/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit' }}
          >
            CARTO
          </a>{' '}
          sobre datos de ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit' }}
          >
            OpenStreetMap
          </a>
          . Retrato de Patrick Pouyanné por{' '}
          <a
            href="https://commons.wikimedia.org/wiki/User:Jbarande"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit' }}
          >
            Jérémy Barande
          </a>{' '}
          bajo{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/2.0/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit' }}
          >
            CC BY-SA 2.0
          </a>
          ; los otros dos son de notas de prensa y están puestos para la maqueta, no para
          publicar.
        </Pie>
      </Seccion>

      <Seccion n="02" titulo="La lista" desc="Las 52: filtrá, buscá y abrí cualquiera para ver su ficha.">
        <ListaEmpresas
          filas={filas}
          grupos={grupos}
          totalPct={`${formatDecimal(nacionalTotal, 1)}%`}
          totalPozos={formatInteger(pozosTotal)}
        />
        <Pie>
          «Mix» no es un dato de la fuente: es la relación entre el % de producción y el % del
          valor en dólares. Por encima de 1,2 pesa el petróleo y por debajo de 0,8 el gas. La
          suma de «Nacional» da {formatDecimal(nacionalTotal, 1)}% y no 100 porque los 52
          valores vienen redondeados a un decimal.
        </Pie>
      </Seccion>
      <Seccion
        n="03"
        titulo="Cómo se reparte"
        desc="Tres empresas explican más de la mitad de la producción del país."
      >
        <Card>
          <CardBarra>
            <span className="s-etq">Producción nacional por empresa</span>
            <span className="s-contador ml-auto">{COMPANIES.length}</span>
          </CardBarra>
          <div className="p-3">
            <Pila segmentos={segmentos} />
            <p className="s-micro m-0 mt-2" style={{ color: 'var(--ink-2)' }}>
              Cada segmento es una empresa y su ancho, su participación. El color es el fluido
              que predomina:{' '}
              <b style={{ color: `color-mix(in srgb, ${FLUIDO.petroleo} 55%, var(--ink))`, fontWeight: 500 }}>
                petróleo
              </b>
              ,{' '}
              <b style={{ color: `color-mix(in srgb, ${FLUIDO.gas} 55%, var(--ink))`, fontWeight: 500 }}>
                gas
              </b>{' '}
              o{' '}
              <b style={{ color: `color-mix(in srgb, ${MIXTO} 55%, var(--ink))`, fontWeight: 500 }}>
                mixto
              </b>
              .
            </p>
          </div>
          {TRAMOS.map((t, i) => {
            const g = COMPANIES.filter(t.test)
            const pct = g.reduce((s, c) => s + c.pctNacional, 0)
            const pozos = g.reduce((s, c) => s + c.proyectos, 0)
            /* La tinta baja tramo a tramo: ink-2, ink-3 y --line-strong. Es la
               escala de tinta del sistema usada como escala de peso, y dice el
               orden sin necesitar una leyenda. */
            const tinta = ['var(--ink-2)', 'var(--ink-3)', 'var(--line-strong)'][i]
            return (
              <div
                key={t.rot}
                className="s-fila s-fila-hover flex-wrap gap-y-1.5"
                style={i === 0 ? { borderTop: '1px solid var(--line)' } : undefined}
              >
                <span className="min-w-[140px] flex-[1_1_150px]">
                  <span className="s-cuerpo block font-medium">{t.rot}</span>
                  <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>
                    {t.nota}
                  </span>
                </span>

                {/* UNA MARCA POR EMPRESA, pegada a su número. Reemplaza al
                    medidor de tres barras, que decía «este tramo es el nivel 3
                    de 3» —una escala inventada que nadie podía leer— por algo
                    que se cuenta de un vistazo.

                    Las marcas van JUNTO a la cifra y no en una columna aparte:
                    sueltas quedaban flotando lejos del «11 empresas» que
                    describen, y de paso la fila no entraba en un renglón. */}
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className="flex flex-wrap items-center gap-[3px]"
                    style={{ width: 68 }}
                    aria-hidden
                  >
                    {g.map((c) => (
                      <i
                        key={c.slug}
                        className="block"
                        style={{ width: 5, height: 5, borderRadius: 1.5, background: tinta }}
                      />
                    ))}
                  </span>
                  <span className="flex w-[74px] shrink-0 items-baseline gap-1">
                    <b className="s-num text-[13px] font-medium">{g.length}</b>
                    <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                      empresas
                    </span>
                  </span>
                </span>

                {/* La barra hace visible lo que la cifra sola no: que el primer
                    tramo es casi todo el país y el tercero, nada. Va contra 100
                    y no contra el máximo de los tres, porque el número que la
                    acompaña dice «del país». */}
                <span className="flex w-[104px] shrink-0 items-center gap-2">
                  {/* El relleno va neutro en los tres y NO en la tinta del
                      tramo: la del tercero es la misma que la del riel, así que
                      su barra se volvía invisible justo donde hay que ver que
                      no llega a nada. El color lo llevan los cuadraditos. */}
                  <span className="s-barra flex-1" aria-hidden>
                    <i style={{ width: `${Math.max(1.5, pct)}%` }} />
                  </span>
                  <span className="s-num w-11 text-right text-[13px] font-medium">
                    {formatDecimal(pct, 1)}%
                  </span>
                </span>

                <span className="flex w-[84px] shrink-0 items-baseline justify-end gap-1">
                  <b className="s-num text-[13px] font-medium">{formatInteger(pozos)}</b>
                  <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                    pozos
                  </span>
                </span>
              </div>
            )
          })}
          <CardPie>
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              Las tres primeras explican{' '}
              <b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
                {formatDecimal(top3, 1)}%
              </b>
              ; las diez primeras,{' '}
              <b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
                {formatDecimal(top10Pct, 1)}%
              </b>
              .
            </span>
          </CardPie>
        </Card>
      </Seccion>

    </>
  )
}
