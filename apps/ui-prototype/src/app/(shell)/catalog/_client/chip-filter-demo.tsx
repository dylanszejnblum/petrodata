'use client'

import { useState } from 'react'
import { Chip } from '@/ui/chip'

/* Grupo de filtros funcional para el catálogo: toggle multi-selección. */

const RECURSOS = ['Petróleo', 'Gas', 'GNL', 'Arenas', 'Litio']

export function ChipFilterDemo() {
  const [activos, setActivos] = useState<string[]>(['Gas'])

  const toggle = (r: string) =>
    setActivos((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Filtrar por recurso" className="flex flex-wrap gap-2">
        {RECURSOS.map((r) => (
          <Chip key={r} selected={activos.includes(r)} onClick={() => toggle(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <p aria-live="polite" className="text-[13px] text-secondary">
        {activos.length === 0
          ? 'Sin filtros activos — la lista muestra todo.'
          : `Filtrando por: ${activos.join(', ')}`}
      </p>
    </div>
  )
}
