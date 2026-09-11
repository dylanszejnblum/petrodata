'use client'

import { DataTable, type Column } from '@/ui/data-table'
import { formatDecimal, formatUSDCompact } from '@/lib/format'

/* Wrapper cliente: DataTable recibe funciones (cell/sort), que no cruzan la
   frontera server→client. Las filas sí son serializables y llegan por props. */

export type ProvinceExportRow = { name: string; exportsMUSD: number; expSharePct: number }

const COLUMNS: Column<ProvinceExportRow>[] = [
  {
    key: 'name',
    header: 'Provincia',
    cell: (r) => <span className="font-medium text-body">{r.name}</span>,
    sort: (r) => r.name,
    priority: 1,
  },
  {
    key: 'musd',
    header: 'Valor anual',
    cell: (r) => formatUSDCompact(r.exportsMUSD * 1e6),
    sort: (r) => r.exportsMUSD,
    align: 'right',
    numeric: true,
    priority: 1,
  },
  {
    key: 'share',
    header: '%',
    cell: (r) => `${formatDecimal(r.expSharePct, 1)}%`,
    sort: (r) => r.expSharePct,
    align: 'right',
    numeric: true,
    priority: 2,
  },
]

export function ProvinceExportsTable({ rows }: { rows: ProvinceExportRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(r) => r.name}
      defaultSort={{ key: 'musd', dir: 'desc' }}
      caption="Exportaciones por provincia"
    />
  )
}
