import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHero } from '@/ui/page-hero'
import { Badge } from '@/ui/badge'
import { Surface } from '@/ui/surface'
import { SectionLabel } from '@/ui/section-label'
import { formatDecimal, formatUSDCompact } from '@/lib/format'
import { PROJECTS, COMMODITY_LABEL, type MineralProject } from '@/fixtures/projects'
import { ProjectMiniMap } from '../../_client/project-mini-map'
import { FichaTable, type FichaRow } from '../../_client/ficha-table'
import { stageTone } from '../../_client/stage-tone'

type Params = Promise<{ name: string }>

/* Ficha con los pares reales del catálogo (estado, provincia, operador,
   ley, recurso, capex) — solo los campos disponibles, nada inventado. */
function fichaTecnica(p: MineralProject): FichaRow[] {
  const rows: FichaRow[] = [
    { k: 'Estado', v: p.stage },
    { k: 'Provincia', v: p.province },
    { k: 'Operador', v: p.operator },
  ]
  if (p.ley) rows.push({ k: 'Ley', v: p.ley })
  if (p.recurso) rows.push({ k: 'Recurso', v: p.recurso })
  if (p.capexMUSD != null) rows.push({ k: 'Capex', v: formatUSDCompact(p.capexMUSD * 1_000_000) })
  return rows
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { name } = await params
  const project = PROJECTS.find((p) => p.slug === name)
  if (!project) return { title: 'Proyecto minero' }
  return {
    title: `${project.name} · Minería`,
    description: `Ficha del proyecto ${project.name} (${COMMODITY_LABEL[project.commodity]}, ${project.province}).`,
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { name } = await params
  const project = PROJECTS.find((p) => p.slug === decodeURIComponent(name))
  if (!project) notFound()

  const tiles: { label: string; value: string; unit?: string }[] = [
    {
      label: 'Capex',
      value: project.capexMUSD != null ? formatUSDCompact(project.capexMUSD * 1_000_000) : '—',
    },
    { label: 'Ley', value: project.ley ?? '—' },
    { label: 'Recurso', value: project.recurso ?? '—' },
    { label: 'Operador', value: project.operator },
  ]

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero
        eyebrow="Minería · Proyecto"
        title={project.name}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{COMMODITY_LABEL[project.commodity]}</Badge>
            <Badge tone={stageTone(project.stage)}>{project.stage}</Badge>
            <Badge tone="neutral">{project.province}</Badge>
          </div>
        }
      >
        Operado por {project.operator} en la provincia de {project.province}. Ficha del catálogo
        minero real.
      </PageHero>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <Surface key={t.label} variant="flat">
            <p className="type-label mb-2">{t.label}</p>
            <p className="m-0 flex items-baseline gap-1.5">
              <span className="type-kpi break-words text-[1.6rem]">{t.value}</span>
              {t.unit && <span className="text-[11px] text-tertiary">{t.unit}</span>}
            </p>
          </Surface>
        ))}
      </div>

      <section className="mt-12">
        <SectionLabel
          index="01"
          title="Ubicación"
          note={`${formatDecimal(project.lat, 2)}°, ${formatDecimal(project.lng, 2)}°`}
        />
        <div className="mt-5">
          <ProjectMiniMap
            name={project.name}
            lng={project.lng}
            lat={project.lat}
            commodity={project.commodity}
          />
        </div>
        <p className="mt-2 text-[13px] text-tertiary">Posición aproximada por provincia.</p>
      </section>

      <section className="mt-12">
        <SectionLabel index="02" title="Ficha técnica" note="Catálogo real" />
        <div className="mt-5">
          <FichaTable rows={fichaTecnica(project)} caption={`Ficha técnica de ${project.name}`} />
        </div>
      </section>
    </div>
  )
}
