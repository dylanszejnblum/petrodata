import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/ui/page-hero'
import { SectionLabel } from '@/ui/section-label'
import { Surface } from '@/ui/surface'
import { Stat } from '@/ui/stat'
import { Badge } from '@/ui/badge'
import { EmptyState } from '@/ui/empty-state'
import { ProportionBarList } from '@/ui/proportion-list'
import { formatDecimal, formatInteger } from '@/lib/format'
import { readMock, applyEstado, type SearchParams } from '@/mock/state'
import {
  PROJECTS,
  COMMODITY_LABEL,
  COMMODITY_STATS,
  MINERALS_TOTALS,
  LIVE_PRICES,
  PROJECTS_BY_PROVINCE,
  type MineralCommodity,
} from '@/fixtures/projects'
import { MineralsMap } from './_client/minerals-map'
import { ProjectsTable } from './_client/projects-table'

export const metadata: Metadata = {
  title: 'Minería',
  description:
    'Proyectos mineros de Argentina: litio, cobre, oro, plata y uranio, con precios en vivo y catálogo real.',
}

export default async function MineralsPage({ searchParams }: { searchParams: SearchParams }) {
  const { estado } = await readMock(searchParams)
  const projects = applyEstado(estado, PROJECTS, 5)
  const commodities = Object.keys(COMMODITY_LABEL) as MineralCommodity[]

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Minería · Argentina" title="Proyectos mineros">
        Litio, cobre, oro, plata y uranio: el catálogo minero argentino con su estado, operador, ley
        y recurso, más los precios de mercado en vivo.
      </PageHero>

      {projects === null ? (
        <EmptyState kind={estado === 'offline' ? 'offline' : 'error'} actionHref="/minerals" actionLabel="Reintentar" />
      ) : projects.length === 0 ? (
        <EmptyState kind="empty" detail="No hay proyectos mineros cargados en este momento." />
      ) : (
        <>
          {/* Precios en vivo */}
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {LIVE_PRICES.map((p) => (
              <li key={p.name} className="min-w-0">
                <Surface variant="flat" className="flex h-full flex-col gap-2">
                  <p className="type-label m-0">{p.name}</p>
                  <p className="m-0 flex items-baseline gap-1.5">
                    <span className="tnums text-[1.35rem] font-medium text-body">
                      {p.value >= 1000 ? formatInteger(p.value) : formatDecimal(p.value, 2)}
                    </span>
                    <span className="text-[11px] text-tertiary">{p.unit}</span>
                  </p>
                  <Badge
                    tone={p.changePct >= 0 ? 'positive' : 'negative'}
                    className="tnums self-start"
                  >
                    {p.changePct >= 0 ? '+' : ''}
                    {formatDecimal(p.changePct, 2)}%
                  </Badge>
                </Surface>
              </li>
            ))}
          </ul>

          {/* Totales */}
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Surface variant="flat">
              <Stat label="Proyectos" value={MINERALS_TOTALS.projects} format="integer" />
            </Surface>
            <Surface variant="flat">
              <Stat label="Commodities" value={MINERALS_TOTALS.commodities} format="integer" />
            </Surface>
            <Surface variant="flat">
              <Stat label="En operación" value={MINERALS_TOTALS.inOperation} format="integer" />
            </Surface>
            <Surface variant="flat">
              <Stat label="Fuentes" value={MINERALS_TOTALS.sources} format="integer" />
            </Surface>
          </div>

          {/* Rollups por commodity */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {commodities.map((commodity) => {
              const s = COMMODITY_STATS[commodity]
              return (
                <Link key={commodity} href={`/minerals/${commodity}`} className="block rounded-[10px]">
                  <Surface variant="flat" interactive className="h-full">
                    <p className="type-label mb-3">{COMMODITY_LABEL[commodity]}</p>
                    <p className="type-kpi text-[1.9rem]">{formatInteger(s.projects)}</p>
                    <p className="mt-1 text-[13px] text-secondary">
                      {s.producing > 0
                        ? `${formatInteger(s.producing)} en producción`
                        : 'Sin producción activa'}
                    </p>
                    <p className="tnums mt-1 text-[13px] text-tertiary">Medido: {s.measured}</p>
                  </Surface>
                </Link>
              )
            })}
          </div>

          {/* Provincias principales */}
          <section className="mt-12">
            <SectionLabel
              index="01"
              title="Provincias principales"
              note={`${formatInteger(PROJECTS_BY_PROVINCE.length)} provincias`}
            />
            <Surface variant="flat" className="mt-5 max-w-[44rem]">
              <ProportionBarList
                items={PROJECTS_BY_PROVINCE.map((p) => ({
                  key: p.name,
                  label: p.name,
                  value: p.count,
                  display: formatInteger(p.count),
                }))}
              />
            </Surface>
          </section>

          <section className="mt-12">
            <SectionLabel index="02" title="Mapa de proyectos" note={`${formatInteger(projects.length)} proyectos`} />
            <div className="mt-5">
              <MineralsMap projects={projects} />
            </div>
            <p className="mt-2 text-[13px] text-tertiary">Posiciones aproximadas por provincia.</p>
          </section>

          <section className="mt-12">
            <SectionLabel index="03" title="Todos los proyectos" />
            <div className="mt-5">
              <ProjectsTable rows={projects} caption="Todos los proyectos mineros" />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
