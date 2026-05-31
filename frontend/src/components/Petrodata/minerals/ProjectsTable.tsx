import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { ApiSchemas } from '@/api/client'
import { commodityColor } from './commodityColors'
import { formatGrade, formatResource, pickGrade, pickResource } from './projectMetrics'

type Project = ApiSchemas['ProjectListItemDto']

export async function ProjectsTable({ projects }: { projects: Project[] }) {
  const t = await getTranslations('projectsTable')

  if (projects.length === 0) {
    return (
      <div
        className="border border-nd-border bg-nd-surface px-5 py-10 text-center text-nd-text-disabled text-sm"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {t('noResults')}
      </div>
    )
  }

  const columns = {
    project: t('columns.project'),
    commodity: t('columns.commodity'),
    status: t('columns.status'),
    province: t('columns.province'),
    operator: t('columns.operator'),
    grade: t('columns.grade'),
    resource: t('columns.resource'),
  }

  return (
    <div className="border border-nd-border bg-nd-surface overflow-hidden">
      <div
        className="hidden lg:grid grid-cols-[1.8fr_0.9fr_0.9fr_0.9fr_1.1fr_0.9fr_1fr] gap-4 border-b border-nd-border bg-nd-surface-raised px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-nd-text-secondary"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        <span>{columns.project}</span>
        <span>{columns.commodity}</span>
        <span>{columns.status}</span>
        <span>{columns.province}</span>
        <span>{columns.operator}</span>
        <span>{columns.grade}</span>
        <span>{columns.resource}</span>
      </div>
      <ul className="divide-y divide-nd-border">
        {projects.map((p) => (
          <ProjectRow key={p.project_name} project={p} labels={columns} />
        ))}
      </ul>
    </div>
  )
}

type ColumnLabels = {
  project: string
  commodity: string
  status: string
  province: string
  operator: string
  grade: string
  resource: string
}

function ProjectRow({ project, labels }: { project: Project; labels: ColumnLabels }) {
  const { color } = commodityColor(project.primary_commodity)
  const highlights = project.commodity_highlights as Record<string, unknown> | null | undefined
  const grade = pickGrade(highlights, project.primary_commodity)
  const resource = pickResource(highlights, project.primary_commodity)
  return (
    <li>
      <Link
        href={`/minerals/projects/${encodeURIComponent(project.project_name)}`}
        className="grid grid-cols-1 lg:grid-cols-[1.8fr_0.9fr_0.9fr_0.9fr_1.1fr_0.9fr_1fr] gap-2 lg:gap-4 px-5 py-4 transition-colors hover:bg-nd-surface-raised"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <div className="min-w-0">
            <span
              className="block text-nd-text-display text-sm truncate"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
              title={project.project_name}
            >
              {project.project_name}
            </span>
            {project.deposit_type ? (
              <span
                className="block text-nd-text-disabled text-[11px] truncate"
                style={{ fontFamily: 'var(--font-space-mono)' }}
                title={String(project.deposit_type)}
              >
                {String(project.deposit_type)}
              </span>
            ) : null}
          </div>
        </div>
        <Cell label={labels.commodity}>{project.primary_commodity}</Cell>
        <Cell label={labels.status}>{nullable(project.status)}</Cell>
        <Cell label={labels.province}>{nullable(project.province)}</Cell>
        <Cell label={labels.operator}>{nullable(project.operator)}</Cell>
        <Cell label={labels.grade}>{formatGrade(grade)}</Cell>
        <Cell label={labels.resource}>{formatResource(resource)}</Cell>
      </Link>
    </li>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="lg:hidden text-nd-text-disabled text-[9px] uppercase tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-nd-text-secondary text-[12px] tabular-nums"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {children}
      </span>
    </div>
  )
}

function nullable(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}
