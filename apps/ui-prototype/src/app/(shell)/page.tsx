import Link from 'next/link'
import { Surface } from '@/ui/surface'
import { Stat } from '@/ui/stat'
import { SectionLabel } from '@/ui/section-label'
import { Donut } from '@/ui/donut'
import { ProportionBarList } from '@/ui/proportion-list'
import { EmptyState } from '@/ui/empty-state'
import { formatCompact, formatInteger, formatMonth, formatPercent } from '@/lib/format'
import { HEADLINE, PREV } from '@/fixtures/production'
import { TOP_OPERATORS } from '@/fixtures/operators'
import { COMPANIES } from '@/fixtures/companies'
import { NEWS } from '@/fixtures/news'
import { applyEstado, readMock, type SearchParams } from '@/mock/state'
import { OperatorAreaChart } from './_home/OperatorChart'
import { MapPreview } from './_home/MapPreview'
import { MapBand } from './_home/MapBand'
import { NewsCardGrid } from './noticias/_components/NewsCard'

/* Mini card del hero: rótulo, valor y una nota al pie. Vive sobre la card
   oscura, así que va translúcida —no una superficie opaca más— para que el
   fondo de estratos se siga leyendo por detrás. Contraste: valor en blanco,
   rótulo en on-dark-2 y sólo la nota en on-dark-3, que ahí sí es metadata. */
function MiniDato({ label, valor, nota }: { label: string; valor: string; nota: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-[2px]">
      <dt className="type-label !text-on-dark-2">{label}</dt>
      <dd className="m-0 mt-1 flex items-baseline gap-1.5">
        <span className="type-kpi tnums truncate text-[15px] !text-white">{valor}</span>
        <span className="shrink-0 text-[10.5px] text-on-dark-3">{nota}</span>
      </dd>
    </div>
  )
}

/* DASHBOARD — gemelo del home de vacamuerta.io con sus datos reales
   (MAY 2026). El orden y las piezas siguen al sitio: hero con la cifra
   del mes → 4 KPIs → fila de tres paneles (share, operadoras, mapa de
   actividad) → banda del mapa → últimas noticias → fecha de corte.
   Las secciones van SIN numerar, como en producción. */

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { estado } = await readMock(searchParams)
  const noticias = applyEstado(estado, NEWS, 2)
  const ultimas = noticias
    ?.slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  const periodo = formatMonth(`${HEADLINE.period}-01`)
  const previo = formatMonth(`${PREV.period}-01`)

  /* La operadora que encabeza el mes y cuánto pesa. El ranking del sitio
     suma exactamente el BOE del mes, así que la participación sale de ahí
     y no de un supuesto. */
  const lider = TOP_OPERATORS[0]
  const liderShare = lider.boeMonth / HEADLINE.boeMonth

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      {/* Hero — la cifra del mes pasa a la card oscura de la familia
          (rounded-10 · marco negro de 4px · bg-inverse). Mismo contenido y
          mismo orden que el hero plano: lo único que cambia es el soporte.
          Es la pieza de más peso de la página y era la única que quedaba
          fuera de la familia, teniendo la banda del mapa y el footer dentro.

          Contraste: la cifra en blanco, y rótulo, sigla y bajada en
          on-dark-2 — nada en on-dark-3, que acá no hay metadata: todo se
          lee. La cabecera va con la firma de las cards oscuras: rombo,
          rótulo y filete. El rombo va neutro y no en oil, porque el rótulo
          nombra un período, no un fluido. */}
      <header className="relative mt-6 overflow-hidden rounded-[10px] border-4 border-black bg-inverse md:mt-8">
        {/* fondo de estratos: dos capas de roca que derivan muy lento y se
            apagan hacia la izquierda, así la cifra cae sobre negro limpio */}
        <span aria-hidden className="estratos" />

        <div className="relative grid gap-7 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end lg:gap-10">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2.5">
              <span aria-hidden className="size-2 shrink-0 rotate-45 bg-on-dark" />
              <span className="type-label-md whitespace-nowrap !tracking-[0.14em] !text-on-dark-2">
                Vaca Muerta · {periodo}
              </span>
              {/* el filete se esconde en pantallas chicas: a 320px quedaría un
                  muñón de dos dígitos de ancho, que se lee como error */}
              <span aria-hidden className="hidden h-px flex-1 bg-white/10 sm:block" />
            </div>
            <h1 className="type-display tnums m-0 flex flex-wrap items-baseline gap-x-3 text-[clamp(2.5rem,7vw,4.4rem)] !text-white">
              {formatInteger(HEADLINE.boeMonth)}
              <abbr
                title="Barriles equivalentes de petróleo"
                className="type-label-md cursor-help no-underline !tracking-[0.14em] !text-on-dark-2"
              >
                BOE
              </abbr>
            </h1>
            <p className="mt-4 max-w-[34rem] text-[13.5px] text-on-dark-2">
              Inteligencia en tiempo real para el petróleo y el gas de Argentina, actualizada
              mensualmente.
            </p>
          </div>

          {/* Mini cards: el contexto que la cifra sola no da —quién produce,
              cuánto se sigue— sin repetir los cuatro KPI de abajo. En fila
              hasta lg y apiladas cuando hay columna propia. */}
          <dl className="m-0 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <MiniDato
              label="Operadora líder"
              valor={lider.name.replace(/ S\.A\.?U?$/i, '')}
              nota={`${formatPercent(liderShare)} del BOE`}
            />
            <MiniDato
              label="Pozos en el catálogo"
              valor={formatInteger(HEADLINE.catalogWells)}
              nota="cuenca Neuquina"
            />
            <MiniDato
              label="Empresas seguidas"
              valor={formatInteger(COMPANIES.length)}
              nota="con ficha propia"
            />
          </dl>
        </div>
      </header>

      {/* KPIs del mes. Los glifos son los de vacamuerta.io, pero el color
          sigue la disciplina de Estrato: color de dato sólo cuando el ícono
          nombra un fluido —petróleo, gas—; el resto en neutro, porque BOE y
          pozos no son ni una cosa ni la otra. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface>
          <Stat
            label="Petróleo"
            value={HEADLINE.oil}
            unit="bbl/d"
            delta={HEADLINE.momOil}
            footnote={`vs. ${previo}`}
            icon="line"
            iconColor="var(--data-oil)"
            animate
          />
        </Surface>
        <Surface>
          <Stat
            label="Gas natural"
            value={HEADLINE.gas}
            format="compact"
            unit="MMm³/d"
            delta={HEADLINE.momGas}
            footnote={`vs. ${previo}`}
            icon="droplet"
            iconColor="var(--data-gas)"
            animate
          />
        </Surface>
        <Surface>
          <Stat
            label="Participación VM"
            value={HEADLINE.vmShare}
            format="percent"
            footnote="del BOE nacional"
            icon="bars"
            animate
          />
        </Surface>
        <Surface>
          <Stat
            label="Pozos activos"
            value={HEADLINE.activeWells}
            delta={HEADLINE.momWells}
            footnote={`vs. ${previo}`}
            icon="doc"
            animate
          />
        </Surface>
      </div>

      {/* Fila de tres paneles del mismo peso, como el dashboard real:
          participación · operadoras · actividad */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Surface className="flex flex-col">
          <p className="type-label">Participación de Vaca Muerta en el BOE</p>
          <div className="mt-4 flex flex-1 items-center justify-center">
            <Donut
              title={`Participación de Vaca Muerta en la producción nacional: ${formatPercent(HEADLINE.vmShare)}`}
              segments={[
                { value: HEADLINE.vmShare, color: 'var(--data-oil)', label: 'Vaca Muerta' },
                {
                  value: 1 - HEADLINE.vmShare,
                  color: 'var(--border-strong)',
                  label: 'Convencional',
                },
              ]}
              center={formatPercent(HEADLINE.vmShare)}
              centerLabel="VM"
            />
          </div>
          <ul className="m-0 mt-4 flex list-none flex-col gap-1.5 p-0">
            <li className="flex items-center gap-2 text-[11px] text-secondary">
              <span aria-hidden className="size-1.5 rounded-full bg-oil" />
              Vaca Muerta
              <span className="tnums ml-auto text-primary">{formatPercent(HEADLINE.vmShare)}</span>
            </li>
            <li className="flex items-center gap-2 text-[11px] text-secondary">
              <span aria-hidden className="size-1.5 rounded-full bg-line-strong" />
              Convencional
              <span className="tnums ml-auto text-primary">
                {formatPercent(1 - HEADLINE.vmShare)}
              </span>
            </li>
          </ul>
        </Surface>

        <Surface className="flex flex-col">
          <div className="flex items-baseline justify-between gap-3">
            <p className="type-label">Operadoras principales</p>
            <p className="type-label">BOE</p>
          </div>
          <div className="mt-4 flex-1">
            <ProportionBarList
              items={TOP_OPERATORS.map((op) => ({
                key: op.slug,
                label: op.name,
                value: op.boeMonth,
                display: formatCompact(op.boeMonth),
                color: op.color,
              }))}
            />
          </div>
          <Link
            href="/companies"
            className="type-label mt-4 block !text-primary hover:underline"
          >
            Ranking completo →
          </Link>
        </Surface>

        <MapPreview />
      </div>

      {/* Banda del mapa: la invitación a la herramienta */}
      <section className="mt-14">
        <SectionLabel title="El mapa" />
        <div className="mt-5">
          <MapBand />
        </div>
      </section>

      {/* Producción por operadora — el sitio lo tiene oculto pero
          restaurable; acá se conserva porque es el bloque más denso */}
      <section className="mt-14">
        <SectionLabel title="Producción por operadora" note="Top 5 · últimos 12 meses" />
        <Surface className="mt-5">
          <OperatorAreaChart />
        </Surface>
      </section>

      {/* Últimas noticias */}
      <section className="mt-14">
        <SectionLabel title="Últimas noticias" note="Todas las noticias →" noteHref="/noticias" />
        {ultimas == null ? (
          <div className="mt-5">
            <EmptyState kind={estado === 'offline' ? 'offline' : 'error'} />
          </div>
        ) : ultimas.length === 0 ? (
          <div className="mt-5">
            <EmptyState kind="empty" detail="Todavía no hay noticias cargadas." />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {ultimas.map((n) => (
              <NewsCardGrid key={n.id} item={n} />
            ))}
          </div>
        )}
      </section>

      {/* Fecha de corte de los datos */}
      <div className="mt-10 rounded-[10px] border bg-surface px-5 py-3">
        <span className="type-label">Datos hasta {periodo}</span>
      </div>
    </div>
  )
}
