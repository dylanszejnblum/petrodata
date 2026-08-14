'use client'

import { useState } from 'react'
import { SegmentedControl } from '@/ui/segmented'

/* SegmentedControl funcional: 3 opciones, radiogroup con flechas. */

type Rango = 'dia' | 'semana' | 'mes'

const LABEL: Record<Rango, string> = { dia: 'último día', semana: 'última semana', mes: 'último mes' }

export function SegmentedDemo() {
  const [rango, setRango] = useState<Rango>('semana')
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl<Rango>
        value={rango}
        onChange={setRango}
        aria-label="Rango temporal"
        options={[
          { value: 'dia', label: 'Día' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mes' },
        ]}
      />
      <p aria-live="polite" className="text-[13px] text-secondary">
        Mostrando datos de {LABEL[rango]}.
      </p>
    </div>
  )
}
