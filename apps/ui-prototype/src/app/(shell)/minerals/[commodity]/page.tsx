import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHero } from '@/ui/page-hero'
import { Stat } from '@/ui/stat'
import { Surface } from '@/ui/surface'
import { EmptyState } from '@/ui/empty-state'
import { ButtonLink } from '@/ui/button'
import { SectionLabel } from '@/ui/section-label'
import { readMock, applyEstado, type SearchParams } from '@/mock/state'
import {
  PROJECTS,
  COMMODITY_LABEL,
  COMMODITY_STATS,
  type MineralCommodity,
} from '@/fixtures/projects'
import { ProjectsTable } from '../_client/projects-table'

/* Los slugs de commodity son las keys reales de COMMODITY_LABEL, en inglés
   (/minerals/lithium, /minerals/copper, …): mismo contrato que el sitio real,
   sin alias es→en. */

type Params = Promise<{ commodity: string }>

function isCommodity(value: string): value is MineralCommodity {
  return value in COMMODITY_LABEL
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { commodity } = await params
  if (!isCommodity(commodity)) return { title: 'Minería' }
  return {
    title: `${COMMODITY_LABEL[commodity]} · Minería`,
    description: `Proyectos de ${COMMODITY_LABEL[commodity].toLowerCase()} en Argentina: estado, operador, ley y recurso.`,
  }
}

export default async function CommodityPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { commodity } = await params
  if (!isCommodity(commodity)) notFound()

  const { estado } = await readMock(searchParams)
  const projects = applyEstado(
    estado,
    PROJECTS.filter((p) => p.commodity === commodity),
    5,
  )
  const stats = COMMODITY_STATS[commodity]

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero
        eyebrow="Minería · Commodity"
        title={COMMODITY_LABEL[commodity]}
        right={
          commodity === 'uranium' ? (
            <ButtonLink href="/minerals/uranium" variant="outline" size="sm">
              Ver hub de uranio
            </ButtonLink>
          ) : undefined
        }
      >
        Proyectos de {COMMODITY_LABEL[commodity].toLowerCase()} en Argentina, con estado, operador,
        ley y recurso del catálogo real.
      </PageHero>

      {projects === null ? (
        <EmptyState
          kind={estado === 'offline' ? 'offline' : 'error'}
          actionHref={`/minerals/${commodity}`}
          actionLabel="Reintentar"
        />
      ) : projects.length === 0 ? (
        <EmptyState
          kind="empty"
          detail={`No hay proyectos de ${COMMODITY_LABEL[commodity].toLowerCase()} cargados.`}
          actionHref="/minerals"
          actionLabel="Volver a minería"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Surface variant="flat">
              <Stat label="Proyectos" value={stats.projects} format="integer" />
            </Surface>
            <Surface variant="flat">
              <Stat label="En producción" value={stats.producing} format="integer" />
            </Surface>
            <Surface variant="flat" className="col-span-2 md:col-span-1">
              <p className="type-label mb-2">Recurso medido</p>
              <p className="type-kpi tnums m-0 break-words text-[1.6rem] md:text-[1.9rem]">
                {stats.measured}
              </p>
            </Surface>
          </div>

          <section className="mt-12">
            <SectionLabel index="01" title="Proyectos" />
            <div className="mt-5">
              <ProjectsTable
                rows={projects}
                caption={`Proyectos de ${COMMODITY_LABEL[commodity]}`}
                showCommodity={false}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
