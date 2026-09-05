'use client'

import { Badge } from '@/ui/badge'
import { DataTable, type Column } from '@/ui/data-table'
import { EmptyState } from '@/ui/empty-state'
import { formatInteger } from '@/lib/format'

/* Demos de DataTable. Las columnas llevan funciones (cell/sort), por eso
   viven en un wrapper cliente y no se pasan desde un server component. */

type Pozo = {
  id: string
  pozo: string
  operadora: string
  cuenca: string
  produccion: number
  estado: 'activo' | 'pausado'
}

const POZOS: Pozo[] = [
  { id: 'lc-101', pozo: 'LCam-101(h)', operadora: 'YPF', cuenca: 'Neuquina', produccion: 812, estado: 'activo' },
  { id: 'fp-207', pozo: 'FPet-207(h)', operadora: 'Vista Energy', cuenca: 'Neuquina', produccion: 640, estado: 'activo' },
  {
    id: 'ag-014',
    pozo: 'AgSur-014(h)',
    operadora: 'Compañía General de Combustibles y Servicios Petroleros del Sur S.A.',
    cuenca: 'Golfo San Jorge',
    produccion: 128,
    estado: 'pausado',
  },
  { id: 'bh-330', pozo: 'BHil-330(h)', operadora: 'Pan American Energy', cuenca: 'Neuquina', produccion: 455, estado: 'activo' },
  { id: 'cs-052', pozo: 'CSec-052(v)', operadora: 'Pluspetrol', cuenca: 'Cuyana', produccion: 96, estado: 'pausado' },
]

const COLUMNS: Column<Pozo>[] = [
  {
    key: 'pozo',
    header: 'Pozo',
    cell: (r) => <span className="font-medium text-body">{r.pozo}</span>,
    sort: (r) => r.pozo,
    priority: 1,
  },
  {
    key: 'operadora',
    header: 'Operadora',
    /* caso extremo: nombre larguísimo, truncado con title como alternativa */
    cell: (r) => (
      <span className="block max-w-[11rem] truncate" title={r.operadora}>
        {r.operadora}
      </span>
    ),
    sort: (r) => r.operadora,
    priority: 2,
  },
  { key: 'cuenca', header: 'Cuenca', cell: (r) => r.cuenca, priority: 3 },
  {
    key: 'produccion',
    header: 'Producción (m³/d)',
    cell: (r) => formatInteger(r.produccion),
    sort: (r) => r.produccion,
    align: 'right',
    numeric: true,
    priority: 1,
  },
  {
    key: 'estado',
    header: 'Estado',
    cell: (r) => <Badge tone={r.estado === 'activo' ? 'positive' : 'caution'}>{r.estado}</Badge>,
    priority: 2,
  },
]

export function DataTableDemo() {
  return (
    <DataTable<Pozo>
      columns={COLUMNS}
      rows={POZOS}
      rowKey={(r) => r.id}
      defaultSort={{ key: 'produccion', dir: 'desc' }}
      caption="Pozos de demostración, ordenables por pozo, operadora y producción"
    />
  )
}

export function DataTableVaciaDemo() {
  return (
    <DataTable<Pozo>
      columns={COLUMNS}
      rows={[]}
      rowKey={(r) => r.id}
      caption="Tabla sin filas: muestra el EmptyState pasado en la prop empty"
      empty={
        <EmptyState
          kind="empty"
          title="Sin pozos para estos filtros"
          detail="Con rows vacío, DataTable renderiza la prop empty (o un EmptyState por defecto)."
        />
      }
    />
  )
}
