import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
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
import type { WellFeature } from '@/fixtures/wells'
import { Pulso } from './_ui/Pulso'
import { loadHeadline, loadVM, loadTopOperators } from '@/lib/data/production'
import { loadWells } from '@/lib/data/wells'
import { loadNews } from '@/lib/data/news'
import { loadVmSerie } from '@/lib/data/inversiones'
import { CATEGORY_LABEL, type NewsItem } from '@/fixtures/news'
import { formatCompactAR, formatDecimal, formatInteger, formatMonth, formatPercent } from '@/lib/format'

/* PRODUCCIÓN — el inicio, rederivado.

   La decisión de fondo: acá la cifra del mes NO es un cartel. El sistema topea
   la tipografía en 21px y resuelve la jerarquía por peso y tinta, así que el
   BOE del mes es una lectura de 21px en peso 600 dentro de una card con
   anillo, no un número de 77px. Lo que lo hace el titular no es el tamaño: es
   estar primero, estar solo en su card y ser el único con la tinta plena.

   Las secciones van numeradas y separadas por línea punteada, sin margen
   entre ellas. Cada una tiene un título de una o dos palabras y una línea que
   dice qué muestra —el mecanismo— y no por qué conviene mirarla.

   DATOS: loaders de src/lib/data (API real con fallback a fixture). */

export const revalidate = 300

export default async function V2Inicio({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'v2.dashboard' })
  const [HEADLINE, VM, TOP_OPERATORS, NEWS, wells, SERIE] = await Promise.all([
    loadHeadline(),
    loadVM(),
    loadTopOperators(),
    loadNews(),
    loadWells(),
    loadVmSerie(locale),
  ])
  const WELLS: WellFeature[] = wells

  const periodo = formatMonth(`${HEADLINE.period}-01`)
  const ultimas = NEWS.slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  /* La serie de la sección 02 es la REAL de Vaca Muerta (loader del endpoint
     RSC del sitio, con fallback al scrape). Se corta en el último mes
     COMPLETO: el fixture trae un mes parcial al final y dibujarlo mostraba
     una caída del 22% que no existió. */
  const vmMeses = SERIE.points.filter((x) => !x.preliminary).slice(-12)
  /* La columna «Doce meses» de la tabla vive bajo el rótulo «En Vaca Muerta»:
     es la misma serie VM de la sección 02 y no la nacional, que cambiaría el
     alcance de la columna sin avisar. */
  const doceMeses = vmMeses.map((p) => ({
    period: p.period,
    oil: Math.round(p.oilBblD),
    gas: p.gasMm3D,
  }))
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
        titulo={t('s01t')}
        desc={t('s01d')}
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
                <th>{t('thFluido')}</th>
                <th className="text-right">{t('thVM')}</th>
                <th className="hidden text-right sm:table-cell">{t('thDoce')}</th>
                <th className="text-right">{t('thPais')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Tag color={FLUIDO.petroleo}>{t('petroleo')}</Tag>
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
                  <Tag color={FLUIDO.gas}>{t('gasNatural')}</Tag>
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
        titulo={t('s02t')}
        desc={t('s02d')}
      >
        <Card>
          <div className="p-3">
            <SerieLinea
              rango={`${mesesCortos[0]} – ${mesesCortos[mesesCortos.length - 1]}`}
              meses={mesesCortos}
              series={[
                {
                  nombre: t('petroleo'),
                  color: FLUIDO.petroleo,
                  unidad: 'bbl/d',
                  valores: vmMeses.map((p) => p.oilBblD),
                  textos: vmMeses.map((p) => formatInteger(Math.round(p.oilBblD))),
                },
                {
                  nombre: t('gasNatural'),
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
        titulo={t('s03t')}
        desc={t('s03d')}
      >
        <Card>
          <CardHead titulo={t('ranking')} nota="BOE" />
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
        titulo={t('s04t')}
        desc={t('s04d')}
      >
        <MiniMapa
          href="/mapa"
          wells={WELLS}
          pie={`${formatInteger(WELLS.length)} pozos de la muestra, de ${formatInteger(HEADLINE.catalogWells)} del catálogo`}
        />
        <div className="mt-3">
          <Cifras
            items={[
              {
                rotulo: t('rotCatalogo'),
                valor: formatInteger(HEADLINE.catalogWells),
                apoyo: `${formatInteger(HEADLINE.activeWells)} activos`,
              },
              {
                rotulo: t('rotMeses'),
                valor: String(SERIE.points.filter((x) => !x.preliminary).length),
                apoyo: `hasta ${cortePeriodo}`,
              },
              {
                rotulo: t('rotOperadoras'),
                valor: String(TOP_OPERATORS.length),
                apoyo: 'del ranking del mes',
              },
            ]}
          />
        </div>
      </Seccion>

      <Seccion
        n="05"
        titulo={t('s05t')}
        desc={t('s05d')}
      >
        <Card>
          {ultimas.map((n) => (
            <FilaNoticia
              key={n.id}
              id={n.id}
              href={`/noticias/${n.id}`}
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
          <Link href="/noticias" className="s-pill">
            {t('todas')} <span aria-hidden>→</span>
          </Link>
        </div>
      </Seccion>
    </>
  )
}
