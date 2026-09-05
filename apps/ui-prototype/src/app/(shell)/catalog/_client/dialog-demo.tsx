'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import { Dialog } from '@/ui/dialog'

/* Demo de Dialog: el <dialog> nativo trae focus trap, Escape y
   restauración de foco sin JS extra. */

export function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Abrir diálogo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Exportar datos">
        <p className="text-[13px] text-secondary">
          Se van a exportar 412 registros de producción en formato CSV. Los filtros
          activos se aplican a la exportación.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Exportar
          </Button>
        </div>
      </Dialog>
    </>
  )
}
