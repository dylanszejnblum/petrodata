import type { Metadata } from 'next'
import { PageHero } from '@/ui/page-hero'
import { Surface } from '@/ui/surface'
import { Stat } from '@/ui/stat'
import { SectionLabel } from '@/ui/section-label'
import { EmptyState } from '@/ui/empty-state'
import { Donut } from '@/ui/donut'
import { formatDecimal, formatInteger } from '@/lib/format'
import { readMock, applyEstado, type SearchParams } from '@/mock/state'
import {
  URANIUM_STATS,
  URANIUM_PROJECTS,
  URANIUM_BY_STAGE,
  URANIUM_PRICE_SERIES,
} from '@/fixtures/projects'
import { UraniumPriceChart } from '../_client/uranium-price-chart'
import { UraniumProjectsTable } from '../_client/uranium-projects-table'

export const metadata: Metadata = {
  title: 'Uranio en Argentina',
  description:
    'Hub de uranio: precio spot real, los 21 proyectos argentinos y el estado del portfolio por etapa.',
}

/* Colores por etapa del donut (tokens del design system). */
const STAGE_COLOR: Record<string, string> = {
  'Exploración inicial': 'var(--data-gas)',
  Prospección: 'var(--text-tertiary)',
  'Exploración avanzada': 'var(--data-oil)',
  'Evaluación Económica Preliminar': 'var(--status-caution)',
  Factibilidad: 'var(--status-positive)',
}

export default async function UraniumPage({ searchParams }: { searchParams: SearchParams }) {
  const { estado } = await readMock(searchParams)
  const projects = applyEstado(estado, URANIUM_PROJECTS, 5)

  const segments = URANIUM_BY_STAGE.map((s) => ({
    value: s.count,
    color: STAGE_COLOR[s.stage] ?? 'var(--text-tertiary)',
    label: s.stage,
  }))

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Minería · Nuclear" title="Uranio en Argentina">
        El país tiene recursos identificados, dos plantas nucleares operativas y ningún proyecto de
        uranio en producción: todo el combustible se importa. Un repaso por el precio y el portfolio
        local.
      </PageHero>

      {/* Hero de precio — cifras reales */}
      <Surface variant="inverse">
        <dl className="m-0 flex min-w-0 flex-col gap-2">
          <dt className="type-label !text-on-dark-3">Precio spot U₃O₈</dt>
          <dd className="m-0 flex items-baseline gap-1.5">
            <span className="type-kpi text-[2.6rem] !text-on-dark md:text-[3rem]">
              {formatDecimal(URANIUM_STATS.priceUsdLb, 2)}
            </span>
            <span className="text-[11px] text-on-dark-3">US$/lb</span>
          </dd>
          <dd className="type-label tnums m-0 flex items-center justify-between gap-2 !text-on-dark-3">
            <span>SPOT · ABR 2026</span>
            <span className="!text-positive">▲ {formatDecimal(URANIUM_STATS.priceChangePct, 2)}%</span>
          </dd>
        </dl>
        <div className="tnums mt-5 flex flex-col gap-1 text-[13px] text-on-dark-3">
          <p className="m-0">
            Rango histórico: US$ {formatDecimal(URANIUM_STATS.rangeMin.value, 2)} (
            {URANIUM_STATS.rangeMin.when}) — US$ {formatDecimal(URANIUM_STATS.rangeMax.value, 2)} (
            {URANIUM_STATS.rangeMax.when})
          </p>
          <p className="m-0">
            Recursos identificados: {formatInteger(URANIUM_STATS.resourcesTU)} tU · Producción
            histórica: {formatInteger(URANIUM_STATS.historicTU)} tU
          </p>
        </div>
      </Surface>

      {/* Indicadores del portfolio */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Surface variant="flat">
          <Stat label="Proyectos" value={URANIUM_STATS.projects} format="integer" />
        </Surface>
        <Surface variant="flat">
          <Stat label="Provincias" value={URANIUM_STATS.provinces} format="integer" />
        </Surface>
        <Surface variant="flat">
          <Stat label="Empresas" value={URANIUM_STATS.companies} format="integer" />
        </Surface>
        <Surface variant="flat">
          <Stat label="Avanzados" value={URANIUM_STATS.advanced} format="integer" />
        </Surface>
        <Surface variant="flat">
          <Stat label="Recursos tU" value={URANIUM_STATS.resourcesTU} format="integer" />
        </Surface>
      </div>

      <section className="mt-12">
        <SectionLabel
          index="01"
          title="Precio histórico"
          note="Serie ilustrativa · la real: 436 puntos 1990–2026"
        />
        <Surface variant="flat" className="mt-5">
          <UraniumPriceChart series={URANIUM_PRICE_SERIES} />
        </Surface>
      </section>

      <section className="mt-12">
        <SectionLabel
          index="02"
          title="Proyectos"
          note={projects ? `${formatInteger(projects.length)} proyectos` : undefined}
        />
        <div className="mt-5">
          {projects === null ? (
            <EmptyState
              kind={estado === 'offline' ? 'offline' : 'error'}
              actionHref="/minerals/uranium"
              actionLabel="Reintentar"
            />
          ) : projects.length === 0 ? (
            <EmptyState kind="empty" detail="No hay proyectos de uranio cargados." />
          ) : (
            <UraniumProjectsTable rows={projects} caption="Proyectos de uranio en Argentina" />
          )}
        </div>
      </section>

      <section className="mt-12">
        <SectionLabel index="03" title="Estado del portfolio" />
        <Surface variant="flat" className="mt-5">
          <div className="flex flex-wrap items-center gap-8">
            <Donut
              segments={segments}
              center={formatInteger(URANIUM_STATS.projects)}
              centerLabel="proyectos"
              title="Proyectos de uranio por etapa"
            />
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {segments.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-[13px] text-secondary">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                  <span className="tnums text-tertiary">{formatInteger(s.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Surface>
      </section>
    </div>
  )
}
