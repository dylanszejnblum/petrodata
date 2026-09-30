'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/ui/badge'
import { Chip } from '@/ui/chip'
import { DataTable, type Column } from '@/ui/data-table'
import { EmptyState } from '@/ui/empty-state'
import { formatInteger } from '@/lib/format'

/* Patrón "tabla con filtros": Chips arriba, DataTable abajo, el vacío
   filtrado ofrece limpiar filtros en lugar de una tabla muda. */

type Proyecto = {
  id: string
  nombre: string
  operadora: string
  cuenca: 'Neuquina' | 'Golfo San Jorge' | 'Austral'
  pozos: number
}

const PROYECTOS: Proyecto[] = [
  { id: 'p1', nombre: 'Loma Campana', operadora: 'YPF', cuenca: 'Neuquina', pozos: 412 },
  { id: 'p2', nombre: 'Bajada del Palo Oeste', operadora: 'Vista Energy', cuenca: 'Neuquina', pozos: 128 },
  { id: 'p3', nombre: 'Cerro Dragón', operadora: 'Pan American Energy', cuenca: 'Golfo San Jorge', pozos: 96 },
  { id: 'p4', nombre: 'Aguada Pichana Este', operadora: 'TotalEnergies', cuenca: 'Neuquina', pozos: 74 },
  { id: 'p5', nombre: 'Campo Boleadoras', operadora: 'CGC', cuenca: 'Austral', pozos: 38 },
  { id: 'p6', nombre: 'El Trapial', operadora: 'Chevron', cuenca: 'Neuquina', pozos: 55 },
]

const CUENCAS = ['Neuquina', 'Golfo San Jorge', 'Austral'] as const

const COLUMNS: Column<Proyecto>[] = [
  { key: 'nombre', header: 'Proyecto', cell: (r) => <span className="font-medium text-body">{r.nombre}</span>, sort: (r) => r.nombre, priority: 1 },
  { key: 'operadora', header: 'Operadora', cell: (r) => r.operadora, sort: (r) => r.operadora, priority: 2 },
  { key: 'cuenca', header: 'Cuenca', cell: (r) => <Badge tone="neutral">{r.cuenca}</Badge>, priority: 3 },
  { key: 'pozos', header: 'Pozos', cell: (r) => formatInteger(r.pozos), sort: (r) => r.pozos, align: 'right', numeric: true, priority: 1 },
]

export function TablaFiltrosDemo() {
  const [cuencas, setCuencas] = useState<string[]>([])

  const toggle = (c: string) =>
    setCuencas((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const filas = useMemo(
    () => (cuencas.length === 0 ? PROYECTOS : PROYECTOS.filter((p) => cuencas.includes(p.cuenca))),
    [cuencas],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="type-label mr-1">Cuenca</span>
        {CUENCAS.map((c) => (
          <Chip key={c} selected={cuencas.includes(c)} onClick={() => toggle(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <DataTable<Proyecto>
        columns={COLUMNS}
        rows={filas}
        rowKey={(r) => r.id}
        defaultSort={{ key: 'pozos', dir: 'desc' }}
        caption="Proyectos filtrados por cuenca, ordenables por nombre, operadora y pozos"
        empty={
          <EmptyState
            kind="empty"
            title="Ningún proyecto en esas cuencas"
            detail="Probá quitando algún filtro de cuenca."
          />
        }
      />
    </div>
  )
}
