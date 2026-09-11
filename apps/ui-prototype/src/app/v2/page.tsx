import Link from 'next/link'
import {
  Seccion,
  Dato,
  FilaDato,
  FilaRanking,
  Card,
  CardBarra,
  CardHead,
  CardPie,
  Medidor,
  Tag,
  FLUIDO,
  Pie,
  FilaNoticia,
} from './_ui/kit'
import { Cifras } from './_ui/Cifras'
import { Serie } from './_ui/Serie'
import { SerieLinea } from './_ui/SerieLinea'
import { MiniMapa } from './_ui/MiniMapa'
import { WELLS } from '@/fixtures/wells'
import { VM } from '@/fixtures/indicadores'
import { Pulso } from './_ui/Pulso'
import { HEADLINE, PREV, NATIONAL_SERIES } from '@/fixtures/production'
import { SERIE } from '@/fixtures/inversiones'
import { TOP_OPERATORS } from '@/fixtures/operators'
import { CATEGORY_LABEL, NEWS } from '@/fixtures/news'
import { formatCompactAR, formatDecimal, formatInteger, formatMonth, formatPercent } from '@/lib/format'

/* PRODUCCIÓN — el inicio, rederivado.

   La decisión de fondo: acá la cifra del mes NO es un cartel. El sistema topea
   la tipografía en 21px y resuelve la jerarquía por peso y tinta, así que el
   BOE del mes es una lectura de 21px en peso 600 dentro de una card con
   anillo, no un número de 77px. Lo que lo hace el titular no es el tamaño: es
   estar primero, estar solo en su card y ser el único con la tinta plena.

   Las secciones van numeradas y separadas por línea punteada, sin margen
   entre ellas. Cada una tiene un título de una o dos palabras y una línea que
   dice qué muestra —el mecanismo— y no por qué conviene mirarla. */

export default function V2Inicio() {
  const periodo = formatMonth(`${HEADLINE.period}-01`)
  const previo = formatMonth(`${PREV.period}-01`)
  const ultimas = NEWS.slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  /* La serie de la sección 02 pasa a ser la REAL de Vaca Muerta. NATIONAL_SERIES
     está generada con `HEADLINE.oil * (0.72 + 0.28 * t) + wiggle` —una rampa
     con ruido escalada para terminar en el valor del mes— y el pie lo declaraba
     como «serie ilustrativa». SERIE.points, en fixtures/inversiones.ts, son los
     valores mensuales que el sitio le pasa a su propio gráfico.
     No es un reemplazo uno a uno y conviene decirlo: la inventada decía ser
     NACIONAL —650.190 bbl/d, con VM en el 77,9%— y la real es de Vaca Muerta
     sola. No hay serie nacional en ningún lado, así que el título de la sección
     cambia con el dato en vez de dejar un rótulo que ya no aplica.
     Se corta en el último mes COMPLETO, como en indicadores: el fixture trae un
     mes parcial al final y dibujarlo mostraba una caída del 22% que no
     existió. */
  const vmMeses = SERIE.points.filter((x) => !x.preliminary).slice(-12)
  const doceMeses = NATIONAL_SERIES.slice(-12)
  /* La contracara de la card: Vaca Muerta pone el 27,7% de los pozos del país
     y saca el 69,3% del petróleo. En crudo, con el corte de abril: 155 bbl/d
     por pozo contra 26 del resto. Todo sale de cifras del sitio; lo único que
     hago es dividir. */
  const mesesCortos = vmMeses.map((p) => formatMonth(`${p.period}-01`))
  const pctPozosVM = (VM.wells / HEADLINE.activeWells) * 100
  const paisOil = VM.oilBbld / (VM.oilSharePct / 100)
  const rinde =
    VM.oilBbld / VM.wells / ((paisOil - VM.oilBbld) / (HEADLINE.activeWells - VM.wells))
  const minOil = Math.min(...doceMeses.map((p) => p.oil))
  const maxOil = Math.max(...doceMeses.map((p) => p.oil))
  const cortePeriodo = formatMonth(`${vmMeses[vmMeses.length - 1].period}-01`)

  return (
    <>
      <Seccion
        n="01"
        titulo="Vaca Muerta"
        desc="Petróleo y gas de la formación, y cuánto pesan en el total del país."
      >
        {/* La card como TABLA. Las dos escalas quedan separadas por columna
            —"En Vaca Muerta" y "Del total del país"— porque el problema de
            fondo era ése: bajo un título que dice «Vaca Muerta» convivían
            cifras de la formación con una del país sin avisar.

            Los 14.441 pozos que mostraba antes son NACIONALES: es la suma
            exacta de las once provincias del fixture, Jujuy y Formosa
            incluidas. Los de Vaca Muerta son 3.996. Esa fila salió de la tabla
            y sus dos números viven ahora en la conclusión, que es donde
            significan algo: solos no explicaban nada.

            Piezas: barra de card medida, tabla del sistema con su cabecera de
            12/500, tag categórico por fluido, chip, medidor de tres barras y
            —extensión nuestra— la serie y la barra de proporción. */}
        <Card>
          <CardBarra>
            <span className="s-titulo shrink-0">
              {formatInteger(HEADLINE.boeMonth)}{' '}
              <span className="text-[11px] font-normal" style={{ color: 'var(--ink-3)' }}>
                BOE
              </span>
            </span>
            <span className="s-chip s-chip--neutro s-chip--mini shrink-0">
              {formatPercent(HEADLINE.vmShare)} del BOE nacional
            </span>
            <span className="flex-1" />
            <span className="s-micro shrink-0" style={{ color: 'var(--ink-2)' }}>
              Vaca Muerta · {periodo}
            </span>
          </CardBarra>

          <table className="s-tabla">
            <thead>
              <tr>
                <th>Fluido</th>
                <th className="text-right">En Vaca Muerta</th>
                <th className="hidden text-right sm:table-cell">Doce meses</th>
                <th className="text-right">Del total del país</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Tag color={FLUIDO.petroleo}>Petróleo</Tag>
                </td>
                <td className="text-right">
                  {formatInteger(HEADLINE.oil)}{' '}
                  <span className="text-[11px] font-normal" style={{ color: 'var(--ink-3)' }}>
                    bbl/d
                  </span>
                </td>
                <td className="hidden text-right sm:table-cell">
                  {/* justify-end y no inline-flex: .s-serie es display:flex y le gana a
                      la utilidad, así que el text-right de la celda no la movía y las
                      barras quedaban pegadas a la izquierda mientras el resto de la
                      columna iba a la derecha. */}
                  <Serie
                    valores={doceMeses.map((p) => p.oil)}
                    textos={doceMeses.map(
                      (p) => `${formatMonth(`${p.period}-01`)} · ${formatInteger(p.oil)} bbl/d`,
                    )}
                    className="justify-end"
                  />
                </td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-2">
                    {/* la barra toma el color de SU fluido, el mismo del tag y
                        el mismo en toda la web */}
                    <span
                      className="s-barra hidden w-13 sm:block"
                      aria-hidden
                      style={{ ['--barra-color' as string]: FLUIDO.petroleo }}
                    >
                      <i style={{ width: `${VM.oilSharePct}%` }} />
                    </span>
                    <span className="w-11 text-right">{formatDecimal(VM.oilSharePct, 1)}%</span>
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <Tag color={FLUIDO.gas}>Gas natural</Tag>
                </td>
                <td className="text-right">
                  {formatDecimal(HEADLINE.gas, 1)}{' '}
                  <span className="text-[11px] font-normal" style={{ color: 'var(--ink-3)' }}>
                    MMm³/d
                  </span>
                </td>
                <td className="hidden text-right sm:table-cell">
                  <Serie
                    valores={doceMeses.map((p) => p.gas)}
                    textos={doceMeses.map(
                      (p) => `${formatMonth(`${p.period}-01`)} · ${formatDecimal(p.gas, 1)} MMm³/d`,
                    )}
                    className="justify-end"
                  />
                </td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="s-barra hidden w-13 sm:block"
                      aria-hidden
                      style={{ ['--barra-color' as string]: FLUIDO.gas }}
                    >
                      <i style={{ width: `${VM.gasSharePct}%` }} />
                    </span>
                    <span className="w-11 text-right">{formatDecimal(VM.gasSharePct, 1)}%</span>
                  </span>
                </td>
              </tr>
              {/* La conclusión es la última FILA y no un pie aparte. Los 3.996
                  pozos y los 14.441 del país viven acá, que es donde explican
                  algo: la fila suelta no decía nada. */}
              <tr className="s-cierre">
                <td colSpan={4}>
                  <span className="flex items-center gap-3">
                    <Medidor nivel={3} />
                    <span className="s-micro font-normal" style={{ color: 'var(--ink-2)' }}>
                      Con el <strong className="font-semibold">{formatDecimal(pctPozosVM, 1)}%</strong>{' '}
                      de los pozos aporta el{' '}
                      <strong className="font-semibold">{formatDecimal(VM.oilSharePct, 1)}%</strong> del
                      petróleo: un pozo rinde{' '}
                      <strong className="font-semibold">{formatDecimal(rinde, 1)}×</strong> uno del resto.
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </Seccion>

      <Seccion
        n="02"
        titulo="Producción de Vaca Muerta"
        desc="Doce meses de petróleo y gas, con el mes de corte al final."
      >
        <Card>
          <div className="p-3">
            <SerieLinea
              rango={`${mesesCortos[0]} – ${mesesCortos[mesesCortos.length - 1]}`}
              meses={mesesCortos}
              series={[
                {
                  nombre: 'Petróleo',
                  color: FLUIDO.petroleo,
                  unidad: 'bbl/d',
                  valores: vmMeses.map((p) => p.oilBblD),
                  textos: vmMeses.map((p) => formatInteger(Math.round(p.oilBblD))),
                },
                {
                  nombre: 'Gas natural',
                  color: FLUIDO.gas,
                  unidad: 'MMm³/d',
                  valores: vmMeses.map((p) => p.gasMm3D),
                  textos: vmMeses.map((p) => formatDecimal(p.gasMm3D, 1)),
                },
              ]}
            />
          </div>
        </Card>
        <Pie>
          Datos oficiales de Vaca Muerta, no una serie ilustrativa. Cada línea usa su propia
          escala: bbl/d y MMm³/d no son comparables entre sí. Corta en {cortePeriodo}, el último
          mes completo — el titular de arriba es del país entero y llega hasta {periodo}.
        </Pie>
      </Seccion>

      <Seccion
        n="03"
        titulo="Operadores principales"
        desc="Las cinco del mes, por BOE y con su peso relativo."
      >
        <Card>
          <CardHead titulo="Ranking del mes" nota="BOE" />
          {TOP_OPERATORS.map((op, i) => (
            <FilaRanking
              key={op.slug}
              n={i + 1}
              nombre={op.name}
              valor={formatCompactAR(op.boeMonth)}
              lider={i === 0}
              marca
              unidad="BOE"
              nota={formatPercent(op.boeMonth / HEADLINE.boeMonth)}
            />
          ))}
        </Card>
        <Pie>
          Las cinco suman exactamente el BOE del mes, así que los porcentajes cierran en 100.
        </Pie>
      </Seccion>

      <Seccion
        n="04"
        titulo="Mapa de actividad"
        desc="Dónde están los pozos, sobre el catálogo y las series que alimentan la página."
      >
        <MiniMapa
          href="/v2/mapa"
          pie={`${formatInteger(WELLS.length)} pozos de la muestra, de ${formatInteger(HEADLINE.catalogWells)} del catálogo`}
        />
        <div className="mt-3">
          <Cifras
            items={[
              {
                rotulo: 'Pozos en el catálogo',
                valor: formatInteger(HEADLINE.catalogWells),
                apoyo: `${formatInteger(HEADLINE.activeWells)} activos`,
              },
              {
                rotulo: 'Meses de serie',
                valor: String(NATIONAL_SERIES.length),
                apoyo: `hasta ${periodo}`,
              },
              {
                rotulo: 'Operadoras seguidas',
                valor: String(TOP_OPERATORS.length),
                apoyo: 'del ranking del mes',
              },
            ]}
          />
        </div>
      </Seccion>

      <Seccion
        n="05"
        titulo="Últimas noticias"
        desc="Con fecha, fuente y categoría."
      >
        <Card>
          {ultimas.map((n) => (
            <FilaNoticia
              key={n.id}
              id={n.id}
              href={`/v2/noticias/${n.id}`}
              titulo={n.title}
              fuente={n.source}
              fecha={n.date}
              categoria={n.category}
              rotulo={CATEGORY_LABEL[n.category]}
              imagen={n.image}
            />
          ))}
        </Card>
        <div className="mt-3">
          <Link href="/v2/noticias" className="s-pill">
            Todas las noticias <span aria-hidden>→</span>
          </Link>
        </div>
      </Seccion>
    </>
  )
}
