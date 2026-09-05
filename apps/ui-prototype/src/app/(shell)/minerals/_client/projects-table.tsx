'use client'

import Link from 'next/link'
import { DataTable, type Column } from '@/ui/data-table'
import { Badge } from '@/ui/badge'
import { COMMODITY_LABEL, type MineralProject } from '@/fixtures/projects'
import { stageTone } from './stage-tone'

/* Tabla de proyectos mineros — wrapper cliente del DataTable de Estrato
   (las columnas llevan funciones y no cruzan el límite server/cliente).
   Columnas reales del catálogo: proyecto, commodity, estado, provincia,
   operador, ley y recurso. El capex vive en la ficha del proyecto. */

export function ProjectsTable({
  rows,
  caption,
  showCommodity = true,
}: {
  rows: MineralProject[]
  caption: string
  showCommodity?: boolean
}) {
  const columns: Column<MineralProject>[] = [
    {
      key: 'name',
      header: 'Proyecto',
      sort: (p) => p.name,
      cell: (p) => (
        <Link
          href={`/minerals/projects/${p.slug}`}
          className="font-medium text-primary underline decoration-line-strong underline-offset-2 hover:decoration-current"
        >
          {p.name}
        </Link>
      ),
      priority: 1,
    },
    ...(showCommodity
      ? [
          {
            key: 'commodity',
            header: 'Commodity',
            cell: (p) => <Badge tone="neutral">{COMMODITY_LABEL[p.commodity]}</Badge>,
            priority: 2,
          } satisfies Column<MineralProject>,
        ]
      : []),
    {
      key: 'stage',
      header: 'Estado',
      cell: (p) => <Badge tone={stageTone(p.stage)}>{p.stage}</Badge>,
      priority: 1,
    },
    {
      key: 'province',
      header: 'Provincia',
      sort: (p) => p.province,
      cell: (p) => p.province,
      priority: 2,
    },
    {
      key: 'operator',
      header: 'Operador',
      cell: (p) => <span className="block max-w-[16rem] truncate text-secondary">{p.operator}</span>,
      priority: 3,
    },
    {
      key: 'ley',
      header: 'Ley',
      align: 'right',
      numeric: true,
      cell: (p) => p.ley ?? '—',
      priority: 3,
    },
    {
      key: 'recurso',
      header: 'Recurso',
      align: 'right',
      numeric: true,
      cell: (p) => p.recurso ?? '—',
      priority: 2,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(p) => p.slug}
      defaultSort={{ key: 'name', dir: 'asc' }}
      caption={caption}
    />
  )
}
