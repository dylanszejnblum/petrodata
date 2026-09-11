import {
  Seccion,
  Card,
  CardHead,
  CardPie,
  FilaDato,
  FilaRanking,
  Dato,
  Pie,
  Chip,
  FLUIDO,
  PALETA_TAGS,
} from '../_ui/kit'
import { SerieLinea } from '../_ui/SerieLinea'
import { SerieBarras } from '../_ui/SerieBarras'
import { MundoRanking, PodioMundial, MundoCrecimiento } from '../_ui/Mundo'
import { EscenarioBrent } from '../_ui/EscenarioBrent'
import { Gasoductos } from '../_ui/Gasoductos'
import {
  DAY_VALUE,
  BRENT,
  TESIS,
  RIGI,
  TRANSPORT,
  EXPORTS_SUMMARY,
  CONTRIBUTION,
  CONTRIBUTION_TOTALS,
} from '@/fixtures/indicadores'
import { SERIE, ACTIVIDAD, CRUCE, MUNDO, DAY_VALUE_INPUTS } from '@/fixtures/inversiones'
import { OIL_PRODUCERS } from '@/fixtures/operators'
import { formatCompactAR, formatDecimal, formatInteger, formatMonth } from '@/lib/format'

/* INDICADORES — la sección más larga de v2.

   REESCRITA (2026-08-21). Lo que había eran once listas seguidas, y comparada
   con la fuente —vacamuerta.io/indicadores— la lista de secciones estaba mal
   de tres formas distintas:

   · FALTABAN CUATRO, y son las mejores. Las tres series de tiempo —producción
     mensual, pozos nuevos por mes, agro contra energía desde 1992— y sobre
     todo «Argentina en el mundo», que es el único lugar donde la cifra deja de
     ser cuánto produce Vaca Muerta y pasa a ser qué puesto ocupa el país.
     Ninguna estaba, y por eso la página no tenía UN SOLO gráfico.

   · DOS ERAN INVENTADAS. «Breakeven por año» eran diez números fabricados en
     el fixture con `70 - i * 2.8` y el propio pie lo declaraba —«serie
     ilustrativa»—; ocupaba el lugar de una serie real. «Part. US$ menos part.
     BOE» era una sección entera para una resta entre dos columnas que la
     fuente ya trae juntas: ahora son dos columnas de la tabla de contribución,
     que es donde viven.

   · UNA ERA UNA COPIA. «Formación» repetía las cuatro primeras filas de «La
     tesis en seis datos», con el mismo tratamiento. En el sitio original una
     es un bloque hero y la otra una lista de detalle; acá las dos eran una
     lista y se leía como un bug.

   Los datos de las series NO son nuevos: ya estaban en fixtures/inversiones.ts
   —el scrape del RSC del sitio, 3.552 líneas— alimentando la ruta v1. También
   estaban ahí MUNDO y los YoY de la tesis, sin que nadie los usara.

   Los títulos salen de src/messages/es.json y no de las reglas de escritura
   del sistema, que pedían dos palabras. Son más largos a propósito: es la
   nomenclatura del producto y no se toca. */

/* Dos de los tres sectores exportadores son nuestros fluidos y llevan su color
   de siempre; minería toma otro de la paleta categórica. Con los tres pintados,
   el acento del líder sale de la lista: cuando la categoría significa algo, el
   color tiene que decir la categoría y no el puesto. */
const COLOR_SECTOR: Record<string, string> = {
  'Petróleo': FLUIDO.petroleo,
  'Gas': FLUIDO.gas,
  'Minería': PALETA_TAGS[2],
}

function CardPieSuelto({ gasKm, oilKm, totalKm }: { gasKm: number; oilKm: number; totalKm: number }) {
  return (
    <div className="s-card mt-3">
      <div className="s-pie-card" style={{ borderTop: 0 }}>
        <span className="s-pila w-24 shrink-0" aria-hidden>
          <span style={{ flex: gasKm }}>
            <i style={{ background: FLUIDO.gas }} />
          </span>
          <span style={{ flex: oilKm }}>
            <i style={{ background: FLUIDO.petroleo }} />
          </span>
        </span>
        <span className="s-micro min-w-0 flex-1" style={{ color: 'var(--ink-2)' }}>
          {formatInteger(gasKm)} km de gas y {formatInteger(oilKm)} de petróleo
        </span>
        <span className="s-num shrink-0 text-[13px] font-medium">{formatInteger(totalKm)} km</span>
      </div>
    </div>
  )
}

export default function V2Indicadores() {
  /* El PBI contra el que se compara el 3,5% estaba en el fixture y la sección
     no lo mostraba. Sin él, «3,5% del PBI» es un número sin denominador. */
  const pbiBusd = DAY_VALUE_INPUTS.gdpUsd / 1e9
  const pbiVeces = DAY_VALUE_INPUTS.gdpUsd / DAY_VALUE_INPUTS.grossValueUsd

  /* El volumen que hay DETRÁS de los 22,3 B, y lo que Vaca Muerta puso en la
     misma ventana. Los dos salen del fixture y la comparación es una división:
     no hay nada estimado. Ver el pie de la sección 02 para por qué importa. */
  const bbldValor = DAY_VALUE_INPUTS.oilBbl / 365
  const ventanaVM = SERIE.points.filter(
    (x) => x.period >= '2025-06' && x.period <= '2026-05',
  )
  const bbldVM = ventanaVM.reduce((a, x) => a + x.oilBblD, 0) / ventanaVM.length

  const maxKm = Math.max(...TRANSPORT.gasByOperator.map((o) => o.km))
  const maxRigi = Math.max(...RIGI.projects.map((p) => p.busd))

  /* Las tres listas de ranking se ORDENAN acá y no se toman en el orden del
     fixture. Venían con el badge 01–08 sobre listas que no estaban ordenadas
     por la cifra que muestran: VISTA aparecía 5.ª con 79.922 bbl/d, arriba de
     una 2.ª con 52.967, y en exportaciones minería iba 03 con 5,4 B sobre un
     02 de 3,2 B. El badge promete un orden; si el orden no está, el badge
     miente. */
  const productores = OIL_PRODUCERS.slice().sort((a, b) => b.bbld - a.bbld)
  const maxBbl = productores[0].bbld
  const sectores = EXPORTS_SUMMARY.sectors.slice().sort((a, b) => b.busd - a.busd)
  const maxExp = sectores[0].busd

  /* Las dos series se cortan en el último mes COMPLETO. El fixture trae un mes
     parcial al final —el scrape corrió a mitad de mayo— y dibujarlo hacía que
     la producción cerrara en 482.106 bbl/d contra los 620.249 que la sección
     01 declara como dato del mes de corte: la misma página se contradecía a sí
     misma, y encima con una caída del 22% que nunca existió. Un mes al que le
     faltan días no es un dato bajo, es un dato incompleto. */
  const prod = SERIE.points.filter((p) => !p.preliminary)
  const mesesProd = prod.map((p) => formatMonth(`${p.period}-01`))
  const act = ACTIVIDAD.points.filter((p) => !p.preliminary)
  const mesesAct = act.map((p) => formatMonth(`${p.period}-01`))

  const cruce = CRUCE.points
  const anios = cruce.map((p) => p.period)
  const ultimo = cruce[cruce.length - 1]
  /* Cuánto de la brecha se cerró: en 1992 el agro exportaba 7,7 veces lo que
     la energía y hoy exporta 4,7. Es la lectura de la serie y no un dato de la
     fuente, así que se calcula y se declara. */
  const brechaHoy = ultimo.agroUsd / ultimo.energiaUsd
  const brechaIni = cruce[0].agroUsd / cruce[0].energiaUsd

  const rankOil = MUNDO.rankings.find((r) => r.product === 'oil')!
  const rankGas = MUNDO.rankings.find((r) => r.product === 'gas')!
  const crecOil = MUNDO.fastestGrowing.find((g) => g.product === 'oil')!
  const crecGas = MUNDO.fastestGrowing.find((g) => g.product === 'gas')!
  const COLOR_RANK: Record<string, string> = { oil: FLUIDO.petroleo, gas: FLUIDO.gas }

  return (
    <>
      <Seccion
        n="01"
        titulo="La tesis en seis datos"
        desc="Seis cifras con su variación interanual y su mes de corte."
      >
        <Card>
          {TESIS.map((t) => {
            /* El tono sale del dato y no está clavado. Estaba pintando
               s-delta--sube siempre que hubiera yoy, sin mirar el signo: hoy
               los cuatro son positivos y no se veía, pero un negativo salía
               verde.

               El fixture guarda el yoy como texto ya formateado —«+38,7%»— así
               que hay que leerlo: coma decimal, y los dos menos posibles, el
               guion y el U+2212 que usa el sistema.

               La banda plana existe porque en una tesis de crecimiento el cero
               NO es neutro. «+0,4%» pintado de verde dice «esto sube» cuando lo
               que dice el dato es «esto se detuvo», y el verde y el rojo sin
               nada en el medio obligan a que un +0,1% y un +38,7% se lean
               igual. Cinco puntos es el corte: abajo de eso la variación entra
               en el ruido de un dato mensual. */
            const num = t.yoy
              ? parseFloat(t.yoy.replace('\u2212', '-').replace(',', '.').replace('%', ''))
              : null
            const tono = num === null ? null : num >= 5 ? 'ok' : num <= -5 ? 'bad' : 'warn'
            /* En móvil el rótulo se lleva su propio renglón y el badge, la
               cifra y el corte bajan al siguiente. Con las cuatro columnas en
               una sola línea, a 375 al rótulo le quedaban 51px y «Producción de
               petróleo VM» se partía en cuatro renglones: filas de 185px de
               alto contra las 42 del resto de v2. Los tres de abajo suman 228px
               y entran holgados en los 287 de la card. */
            return (
              <div key={t.label} className="s-fila s-fila-hover flex-wrap gap-y-1">
                <span className="s-etq min-w-0 flex-1 basis-full sm:basis-auto">{t.label}</span>
                {/* El interanual estaba en el fixture desde el principio y la
                    página lo tiraba. Es la mitad del contenido: «620.249 bbl/d»
                    dice el tamaño, «+38,7%» dice que es una tesis.

                    Va en badge y a la IZQUIERDA de la cifra (pedido de Mariano,
                    2026-08-21). El badge lleva el «YoY» adentro: suelto, el
                    porcentaje no decía contra qué compara y el pie tenía que
                    explicarlo para las seis filas de golpe —mal, además: no
                    todas comparan lo mismo—.

                    El badge entero toma el tono —verde, rojo o ámbar— y no
                    sólo la cifra (pedido de Mariano). Vale dejar anotado que
                    esto se aparta de la referencia, donde el delta es texto
                    pelado sin fondo: acá el badge ES el pedido, y con el tinte
                    puesto el «YoY» tiene que ir del mismo tono, porque un chip
                    de dos colores se lee como dos cosas.

                    Ancho reservado aunque la fila no tenga delta —dos de las
                    seis no lo traen— para que la columna del corte no se mueva. */}
                <span className="flex shrink-0 justify-end sm:w-[78px]">
                  {t.yoy && (
                    <span className={`s-chip s-chip--${tono} s-chip--mini`}>
                      <b className="s-num font-medium">{t.yoy}</b>
                      YoY
                    </span>
                  )}
                </span>
                {/* Ancho fijo al más largo —«620.249 bbl/d», medido en 88px— y
                    alineado a la derecha. Sin fijarlo, la cifra tomaba su ancho
                    natural, el badge quedaba pegado a ella y la columna de
                    badges salía con 47px de dentera entre la fila más corta y
                    la más larga. Los valores no se mueven: ya estaban alineados
                    por el borde derecho. */}
                <span className="s-num min-w-0 flex-1 shrink-0 text-right text-[13px] font-medium sm:w-[92px] sm:flex-none">
                  {t.value}
                </span>
                <span className="s-mono shrink-0 text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
                  {t.asOf}
                </span>
              </div>
            )
          })}
        </Card>
        <Pie>
          La columna de la derecha es el mes de corte de cada dato, no todos coinciden. El YoY no
          compara lo mismo en todas: en producción es abril contra abril —620.249 contra 447.187
          bbl/d— y en las dos anuales es el año calendario contra el anterior. Las dos
          participaciones no traen variación en la fuente.
        </Pie>
      </Seccion>

      {/* Los tres números NO son tres datos: son uno dicho tres veces. 61,0 ×
          365 = 22,3, y 22,3 sobre el PBI de 2024 da 3,5%. Tres cards iguales
          decían «tres hechos independientes», y encima el «3,5% del PBI»
          flotaba sin el PBI en ningún lado de la página.

          Ahora el PBI ES el riel y la producción es la astilla adentro. Un
          porcentaje sin su denominador a la vista no se puede dimensionar: el
          «3,5%» pedía saber 3,5% de cuánto, y ese número estaba en el fixture
          sin usar. */}
      <Seccion
        n="02"
        titulo="Valor de un día de Vaca Muerta"
        desc="Lo que produce un día, contra el PBI del país."
      >
        <Card>
          <CardHead titulo="Valor bruto de producción" nota="últimos 12 meses" />
          <div className="p-3">
            <div className="mb-3 flex items-baseline gap-2.5">
              <b className="s-cifra">{formatDecimal(DAY_VALUE.perDayMUSD, 1)}</b>
              <span className="s-micro" style={{ color: 'var(--ink-3)' }}>
                MUSD por día
              </span>
              <span className="s-chip s-chip--neutro s-chip--mini ml-auto">
                {formatDecimal(DAY_VALUE.perYearBUSD, 1)} BUSD al año
              </span>
            </div>
            {/* La astilla mide 3,49% de verdad y no lleva el piso de 3px que
                llevan las demás barras del sistema: acá el tamaño ES el dato. */}
            <span className="s-riel" aria-hidden>
              <i style={{ width: `${(DAY_VALUE_INPUTS.grossValueUsd / DAY_VALUE_INPUTS.gdpUsd) * 100}%` }} />
            </span>
            <div className="s-riel-ejes">
              <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                {formatDecimal(DAY_VALUE.perYearBUSD, 1)} B de producción
              </span>
              <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                {formatDecimal(pbiBusd, 1)} B · PBI {DAY_VALUE.pbiYear}
              </span>
            </div>
          </div>
          <CardPie>
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              <b className="font-semibold">{formatDecimal(DAY_VALUE.pbiPct, 1)}% del PBI</b>: uno de
              cada <b className="font-semibold">{Math.round(pbiVeces)} pesos</b> de la economía
              argentina.
            </span>
          </CardPie>
        </Card>
        {/* El título es el del producto y no se toca, pero la cifra que hay
            debajo no es de Vaca Muerta y eso sí hay que decirlo. */}
        <Pie>
          El título viene así de la fuente, pero el volumen detrás de estos{' '}
          {formatDecimal(DAY_VALUE.perYearBUSD, 1)} BUSD son{' '}
          <b className="font-semibold">{formatInteger(Math.round(bbldValor))} bbl/d</b>, que es
          escala nacional: en la misma ventana Vaca Muerta promedió{' '}
          {formatInteger(Math.round(bbldVM))} —el {formatDecimal((bbldVM / bbldValor) * 100, 0)}%—
          y su mejor mes llegó a {formatInteger(Math.round(Math.max(...ventanaVM.map((x) => x.oilBblD))))}.
          O sea que la cifra es de la producción del país, no la de la cuenca.
        </Pie>
      </Seccion>

      {/* ── Las tres series ────────────────────────────────────────────────
          Van juntas y en este orden porque cuentan una sola cosa en tres
          escalas: cuánto sale hoy, a qué ritmo se sigue perforando, y qué
          lugar ocupa eso en las exportaciones del país desde 1992. */}
      <Seccion
        n="03"
        titulo="Producción de petróleo en Vaca Muerta"
        desc="Cuarenta meses de petróleo y gas."
      >
        <Card>
          <div className="p-3">
            <SerieLinea
              rango={`${mesesProd[0]} – ${mesesProd[mesesProd.length - 1]}`}
              meses={mesesProd}
              series={[
                {
                  nombre: 'Petróleo',
                  color: FLUIDO.petroleo,
                  unidad: 'bbl/d',
                  valores: prod.map((p) => p.oilBblD),
                  textos: prod.map((p) => formatInteger(Math.round(p.oilBblD))),
                },
                {
                  nombre: 'Gas natural',
                  color: FLUIDO.gas,
                  unidad: 'MMm³/d',
                  valores: prod.map((p) => p.gasMm3D),
                  textos: prod.map((p) => formatDecimal(p.gasMm3D, 1)),
                },
              ]}
            />
          </div>
        </Card>
        <Pie>
          Datos oficiales, no una serie ilustrativa. Cada línea usa su propia escala: bbl/d y
          MMm³/d no son comparables entre sí. La serie corta en el último mes completo.
        </Pie>
      </Seccion>

      <Seccion
        n="04"
        titulo="Actividad: pozos nuevos por mes"
        desc="El ritmo de perforación que sostiene la curva anterior."
      >
        <Card>
          <div className="p-3">
            <SerieBarras
              valores={act.map((p) => p.nuevosPozos)}
              rotulos={mesesAct}
              textos={act.map((p) => formatInteger(p.nuevosPozos))}
              rango={`${mesesAct[0]} – ${mesesAct[mesesAct.length - 1]}`}
              unidad="pozos"
            />
          </div>
        </Card>
        <Pie>
          Columnas y no línea: son pozos contados, y entre un mes y el siguiente no hay nada
          en el medio. Se comparan desde cero y la serie corta en el último mes completo.{' '}
          {ACTIVIDAD.source.label}.
        </Pie>
      </Seccion>

      {/* El sitio real trae acá un ESCENARIO: un control que mueve el precio
          del Brent y recalcula el valor de la producción y el margen. El
          prototipo lo había aplanado a cuatro filas fijas, que es justamente
          perder lo único interactivo de la sección.

          El control no es un deslizador de riel porque la referencia no tiene
          ninguno: son los rótulos arrastrables de la Fine-tune Card (§19). Ver
          .s-escenario en sistema.css. */}
      <Seccion
        n="05"
        titulo="Margen sobre el breakeven"
        desc="Movés el Brent y se recalcula lo que vale la producción."
      >
        <Card>
          <CardHead titulo="Escenario de precio" nota="US$/bbl" />
          <EscenarioBrent
            inicial={BRENT.value}
            hoy={BRENT.value}
            promedio={BRENT.avg12m}
            breakeven={BRENT.breakeven}
            descuento={DAY_VALUE_INPUTS.oilDiscountUsd}
            barriles={DAY_VALUE_INPUTS.oilBbl}
          />
        </Card>
        <Pie>
          La cuenta es la del sitio y sale entera del fixture: el volumen de doce meses
          —{formatInteger(Math.round(DAY_VALUE_INPUTS.oilBbl))} barriles, que son{' '}
          {formatInteger(Math.round(bbldValor))} bbl/d de producción nacional, no de la cuenca—
          por el precio menos los {formatInteger(DAY_VALUE_INPUTS.oilDiscountUsd)} US$/bbl de
          descuento por calidad.
          Valúa <b className="font-semibold">sólo el petróleo</b>: no incluye el gas y no
          descuenta costos ni impuestos. El Brent de partida es el del {BRENT.asOf}.
        </Pie>
      </Seccion>

      <Seccion
        n="06"
        titulo="Exportaciones: agro vs energía"
        desc="Treinta y cuatro años de dólares, en la misma escala."
      >
        <Card>
          <div className="p-3">
            <SerieLinea
              rango={`${anios[0]} – ${anios[anios.length - 1]}`}
              meses={anios}
              escala="comun"
              series={[
                /* En BUSD y no en dólares crudos: formateado como
                   «52.616 US$» se leía como cincuenta y dos mil dólares, y son
                   cincuenta y dos mil millones. BUSD además es la unidad que ya
                   usan las secciones 02, 07 y 09 de esta misma página. */
                {
                  nombre: 'Agro',
                  color: PALETA_TAGS[1],
                  unidad: 'BUSD',
                  valores: cruce.map((p) => p.agroUsd),
                  textos: cruce.map((p) => formatDecimal(p.agroUsd / 1e9, 1)),
                },
                {
                  nombre: 'Energía',
                  color: FLUIDO.petroleo,
                  unidad: 'BUSD',
                  valores: cruce.map((p) => p.energiaUsd),
                  textos: cruce.map((p) => formatDecimal(p.energiaUsd / 1e9, 1)),
                },
              ]}
            />
          </div>
          <CardPie>
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              En {anios[0]} el agro exportaba{' '}
              <b className="font-semibold">{formatDecimal(brechaIni, 1)}×</b> lo que la energía;
              en {anios[anios.length - 1]},{' '}
              <b className="font-semibold">{formatDecimal(brechaHoy, 1)}×</b>.
            </span>
          </CardPie>
        </Card>
        <Pie>
          Las dos líneas comparten escala y arrancan en cero: son los mismos dólares y lo que se
          mira es la distancia entre ellas. {CRUCE.source.label}.
        </Pie>
      </Seccion>

      <Seccion
        n="07"
        titulo="Exportaciones de energía"
        desc="Miles de millones de dólares por sector, y su reparto."
      >
        <Card>
          <CardHead titulo="Por sector" nota={`${formatDecimal(EXPORTS_SUMMARY.totalBUSD, 1)} BUSD`} />
          {sectores.map((s, i) => (
            <FilaRanking
              key={s.name}
              n={i + 1}
              nombre={s.name}
              valor={`${formatDecimal(s.busd, 1)} B`}
              pct={s.busd / maxExp}
              lider={i === 0}
              nota={`${formatDecimal(s.sharePct, 1)}% del total`}
              color={COLOR_SECTOR[s.name] ?? undefined}
            />
          ))}
        </Card>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tono="info">Corte 2026-05</Chip>
          <Chip tono="neutro">Secretaría de Energía</Chip>
        </div>
      </Seccion>

      <Seccion
        n="08"
        titulo="Operadores principales"
        desc="Barriles por día de los mayores productores del país."
      >
        <Card>
          <CardHead titulo="Productores de petróleo" nota="bbl/d" />
          {productores.map((p, i) => (
            <FilaRanking
              key={p.name}
              n={i + 1}
              nombre={p.name}
              valor={formatInteger(p.bbld)}
              pct={p.bbld / maxBbl}
              lider={i === 0}
              /* La nota decía «X% del total nacional» y ese rótulo lo puse yo.
                 La fuente muestra ese porcentaje SIN rótulo, y no es el share
                 de bbl/d —VISTA con 79.922 sobre el total implícito da 9,6% y
                 no 7,4— ni la participación en BOE de la tabla de contribución,
                 que para VISTA es 4,4%. Es un tercer número que la fuente no
                 explica, así que se muestra sin afirmar qué mide. */
              nota={`${formatDecimal(p.sharePct, 1)}%`}
            />
          ))}
        </Card>
        <Pie>
          Ordenado por barriles por día, que es la cifra que muestra. El porcentaje viene de la
          fuente sin rótulo y no coincide con el share de bbl/d ni con la participación en BOE:
          se publica como está, sin atribuirle un significado.
        </Pie>
      </Seccion>

      <Seccion
        n="09"
        titulo="Contribución económica"
        desc="Participación, valor bruto, regalías y exportaciones por operadora."
      >
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Card>
            <div className="px-3 py-3">
              <Dato
                rotulo="Valor bruto"
                valor={formatDecimal(CONTRIBUTION_TOTALS.valorBrutoBUSD, 1)}
                unidad="BUSD"
                nota="anualizado"
              />
            </div>
          </Card>
          <Card>
            <div className="px-3 py-3">
              <Dato
                rotulo="Regalías"
                valor={formatDecimal(CONTRIBUTION_TOTALS.regaliasBUSD, 2)}
                unidad="BUSD"
                nota="12% legal"
              />
            </div>
          </Card>
          <Card>
            <div className="px-3 py-3">
              <Dato
                rotulo="Exportaciones"
                valor={formatInteger(CONTRIBUTION_TOTALS.exportacionesBUSD)}
                unidad="BUSD"
                nota="últimos 12 meses"
              />
            </div>
          </Card>
        </div>
        <Card>
          <CardHead titulo="Por operadora" nota="MUSD" />
          <div className="overflow-x-auto">
            <table className="s-tabla">
              <thead>
                {/* Sin columna de puesto. Con la participación adentro la
                    tabla llegaba a 586px en un contenedor de 584 y seguía
                    perdiendo la última columna por dos píxeles. De las seis
                    columnas, la del puesto es la única que no trae un dato:
                    la tabla ya está ordenada por Valor y ese orden ES el
                    ranking. */}
                <tr>
                  <th>Operadora</th>
                  {/* La participación vuelve a la tabla, y en UNA columna con
                      la flecha en el medio. Eran una sección entera —«Part. US$
                      menos part. BOE»— para mostrar la resta entre estos dos
                      números; con la flecha, el movimiento se ve sin calcularlo
                      y sin una sección extra.

                      Una columna y no dos: a dos, la tabla medía 639px en un
                      contenedor de 584 y la columna «Exportado» quedaba fuera
                      de la card. Como el contenedor tiene scroll horizontal no
                      desbordaba nada, y por eso simplemente desaparecía una
                      columna entera sin que se notara. */}
                  <th className="w-24 text-right">BOE → US$</th>
                  <th className="w-20 text-right">Valor</th>
                  <th className="w-20 text-right">Regalías</th>
                  <th className="w-20 text-right">Exportado</th>
                </tr>
              </thead>
              <tbody>
                {CONTRIBUTION.map((c) => (
                  <tr key={c.operator}>
                    <td className="truncate">{c.operator}</td>
                    {/* En ink-2 y no en la tinta plena: son el contexto de la
                        fila, y las tres cifras de dinero son el contenido. */}
                    <td
                      className="s-num text-right whitespace-nowrap"
                      style={{ color: 'var(--ink-2)', fontWeight: 400 }}
                    >
                      {formatDecimal(c.partBoePct, 1)} → {formatDecimal(c.partUsdPct, 1)}
                    </td>
                    <td className="text-right">{formatCompactAR(c.valorMUSD)}</td>
                    <td className="text-right">{formatCompactAR(c.regaliasMUSD)}</td>
                    <td className="text-right">{formatCompactAR(c.expoMUSD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Pie>
          La columna «BOE → US$» son dos participaciones en porcentaje: cuánto pesa la
          operadora en producción y cuánto en valor. Cuando la segunda supera a la primera
          captura más valor del que le correspondería por volumen — YPF va del{' '}
          {formatDecimal(CONTRIBUTION[0].partBoePct, 1)}% al{' '}
          {formatDecimal(CONTRIBUTION[0].partUsdPct, 1)}%. Las exportaciones se atribuyen pro
          rata por participación en BOE: son estimaciones, no cifras contables de cada empresa.
        </Pie>
      </Seccion>

      {/* ── Argentina en el mundo ──────────────────────────────────────────
          La sección que faltaba entera. Es la única de la página que cambia la
          unidad de medida de la pregunta: de «cuánto» a «qué puesto». */}
      <Seccion
        n="10"
        titulo="Argentina en el mundo"
        desc="Qué puesto ocupa el país, y a dónde lo lleva la proyección."
      >
        <div className="flex flex-col gap-3">
          {[rankOil, rankGas].map((r) => (
            <MundoRanking
              key={r.product}
              rot={r.label}
              unidad={r.unit === 'TBPD' ? 'mil bbl/d' : 'BCF/año'}
              anio={r.year}
              paises={r.countries}
              historia={r.history ?? []}
              arg={{ puesto: r.argentina!.rank, valor: r.argentina!.value }}
              proyectado={{
                anio: r.projected.year,
                puesto: r.projected.rank,
                valor: r.projected.value,
              }}
              color={COLOR_RANK[r.product]}
            />
          ))}
        </div>
        <Pie>
          {MUNDO.source.label}. El puesto proyectado no es una medición: sale de extender la
          producción de Vaca Muerta a {rankOil.projected.year} sobre el ranking de hoy.
        </Pie>
      </Seccion>

      <Seccion
        n="11"
        titulo="El podio del mundo"
        desc="Los primeros doce de cada fluido, y dónde cae Argentina."
      >
        {/* Una columna y no dos. A dos, cada card medía 330px y entre el
            puesto, la barra y la cifra al nombre le quedaban 130: «Emiratos
            Árabes Unidos» salía «Emi…» y hasta «United States» se cortaba. Un
            ranking cuyos nombres no se leen no es un ranking. */}
        <div className="flex flex-col gap-3">
          {[rankOil, rankGas].map((r) => (
            <Card key={r.product}>
              <CardHead
                titulo={r.label}
                nota={r.unit === 'TBPD' ? 'mil bbl/d' : 'BCF/año'}
              />
              <PodioMundial top={r.top} color={COLOR_RANK[r.product]} />
            </Card>
          ))}
        </div>
        <Pie>
          La lista salta del puesto doce al de Argentina: el corte marca cuántos países quedan
          en el medio, porque sin marcarlo la lista mentiría sobre quién está al lado de quién.
        </Pie>
      </Seccion>

      <Seccion
        n="12"
        titulo="Los que más crecen"
        desc="Otro ranking, y dice lo contrario que el de volumen."
      >
        {/* Apiladas, por lo mismo que el podio: a dos columnas «Emiratos
            Árabes Unidos» no entra. */}
        <div className="flex flex-col gap-3">
          {[crecOil, crecGas].map((g) => (
            <Card key={g.product}>
              <CardHead titulo={g.label} nota={`${g.sinceYear}–${g.toYear}`} />
              <MundoCrecimiento
                lideres={g.leaders}
                puestoArg={g.argentinaRank ?? 0}
                color={COLOR_RANK[g.product]}
              />
            </Card>
          ))}
        </div>
        <Pie>
          En petróleo Argentina es {crecOil.argentinaRank}.ª del mundo creciendo y{' '}
          {rankOil.argentina!.rank}.ª produciendo; en gas crece al{' '}
          {Math.round(crecGas.leaders.find((l) => l.isArgentina)?.growthPct ?? 0)}% y queda{' '}
          {crecGas.argentinaRank}.ª. El contraste entre los dos fluidos es el contenido.
        </Pie>
      </Seccion>

      {/* Las filas pasan a ser GASODUCTOS y no operadores, y cada una abre el
          mapa con su traza. La geometría estaba desde el principio y se tiraba:
          frontend/scripts/build-pipelines.py bajaba este mismo shapefile de
          ENARGAS —de ahí salen los km de acá— y lo declaraba en su encabezado,
          «geometry is read for measurement and then discarded». */}
      <Seccion
        n="13"
        titulo="Infraestructura de transporte"
        desc="La red troncal de gas, gasoducto por gasoducto."
      >
        <Card>
          <CardHead titulo="Red de gas" nota={`${formatInteger(TRANSPORT.gasKm)} km`} />
          <Gasoductos />
        </Card>
        {/* El reparto de la red pasa de frase a pila: son dos magnitudes que se
            comparan, y compararlas es más rápido mirando que leyendo. Va en el
            pie de card medido —fondo --inset y filete arriba— y con los colores
            de los dos fluidos. */}
        <CardPieSuelto
          gasKm={TRANSPORT.gasKm}
          oilKm={TRANSPORT.oilKm}
          totalKm={TRANSPORT.totalKm}
        />
        <Pie>
          Trazas oficiales de ENARGAS, simplificadas a 110 m para el mapa; los kilómetros se
          miden sobre la traza sin simplificar. La lista corta en los doce sistemas más largos
          —el 93% de la red— y los otros catorce van juntos en la última fila. Los oleoductos
          entran en el total pero no en el mapa: la fuente de ductos de petróleo es otra.
          Mapa © CARTO, © OpenStreetMap.
        </Pie>
      </Seccion>

      <Seccion
        n="14"
        titulo="Proyectos RIGI"
        desc="Aprobados bajo el régimen, por monto comprometido."
      >
        <Card>
          <CardHead titulo="Proyectos RIGI" nota={`${formatDecimal(RIGI.totalBUSD, 1)} BUSD`} />
          {RIGI.projects.map((p, i) => (
            <FilaRanking
              key={p.name}
              n={i + 1}
              /* El nombre corto. Los cuatro se cortaban a la mitad —«GNL
                 Argentina …», «Gasoducto San Matías (Sout…»— porque el
                 paréntesis repetía el sponsor, que ya va en el badge de al
                 lado. Sin el paréntesis entran enteros. */
              nombre={p.name.replace(/\s*\(.*$/, '')}
              valor={`${formatDecimal(p.busd, 1)} B`}
              pct={p.busd / maxRigi}
              lider={i === 0}
              /* Sólo el operador en el badge. Con la provincia pegada —«Pan
                 American Energy / Golar LNG · Río Negro»— el badge no se
                 encogía y empujaba al nombre a cortarse, hasta a 1440. Las
                 provincias bajan al pie: son dos y se dicen en una línea. */
              nota={p.sponsor.split(' · ')[0]}
            />
          ))}
        </Card>
        <Pie>
          Tres de los cuatro están en Río Negro; la ampliación del Perito Moreno, en Neuquén.
          El monto es inversión comprometida al aprobarse, no ejecutada.
        </Pie>
      </Seccion>
    </>
  )
}
