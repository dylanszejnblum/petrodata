'use client'

import { DataTable, type Column } from '@/ui/data-table'

/* Tabla clave/valor de la ficha técnica (wrapper cliente del DataTable). */

export type FichaRow = { k: string; v: string }

const COLUMNS: Column<FichaRow>[] = [
  { key: 'k', header: 'Parámetro', cell: (r) => r.k, priority: 1 },
  {
    key: 'v',
    header: 'Valor',
    align: 'right',
    numeric: true,
    cell: (r) => <span className="text-secondary">{r.v}</span>,
    priority: 1,
  },
]

export function FichaTable({ rows, caption }: { rows: FichaRow[]; caption: string }) {
  return <DataTable columns={COLUMNS} rows={rows} rowKey={(r) => r.k} caption={caption} />
}
