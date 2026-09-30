'use client'

import { DataTable, type Column } from '@/ui/data-table'
import { Badge } from '@/ui/badge'
import { formatInteger } from '@/lib/format'
import type { UraniumProject } from '@/fixtures/projects'

/* Tabla del portfolio real de uranio — wrapper cliente del DataTable.
   El # es el orden del catálogo (estable ante el sort por columna). */

function uraniumStageTone(stage: string): 'positive' | 'caution' | 'neutral' {
  if (stage === 'Factibilidad') return 'positive'
  if (stage === 'Evaluación Económica Preliminar') return 'caution'
  return 'neutral'
}

type Row = UraniumProject & { rank: number }

export function UraniumProjectsTable({
  rows,
  caption,
}: {
  rows: UraniumProject[]
  caption: string
}) {
  const data: Row[] = rows.map((r, i) => ({ ...r, rank: i + 1 }))

  const columns: Column<Row>[] = [
    {
      key: 'rank',
      header: '#',
      numeric: true,
      cell: (r) => formatInteger(r.rank),
      priority: 3,
    },
    {
      key: 'name',
      header: 'Proyecto',
      sort: (r) => r.name,
      cell: (r) => <span className="font-medium text-primary">{r.name}</span>,
      priority: 1,
    },
    {
      key: 'province',
      header: 'Provincia',
      sort: (r) => r.province,
      cell: (r) => r.province,
      priority: 1,
    },
    {
      key: 'stage',
      header: 'Estado',
      cell: (r) => <Badge tone={uraniumStageTone(r.stage)}>{r.stage}</Badge>,
      priority: 1,
    },
    {
      key: 'company',
      header: 'Empresa',
      cell: (r) => <span className="block max-w-[16rem] truncate text-secondary">{r.company}</span>,
      priority: 2,
    },
    {
      key: 'origin',
      header: 'Origen',
      cell: (r) => r.origin,
      priority: 3,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={data}
      rowKey={(r) => `${r.rank}-${r.name}`}
      defaultSort={{ key: 'name', dir: 'asc' }}
      caption={caption}
    />
  )
}
