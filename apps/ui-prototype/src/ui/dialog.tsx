'use client'

import { useCallback, useEffect, useRef } from 'react'

/* Dialog sobre <dialog> nativo: focus trap, Escape y restauración de foco
   gratis del navegador — lo que a los 3 modales de producción les falta. */

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const onBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === ref.current) onClose()
    },
    [onClose],
  )

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={onBackdrop}
      aria-label={title}
      className="m-auto w-[min(92vw,26rem)] rounded-[10px] border bg-surface p-0 text-body backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="type-h2 !text-[1rem]">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid size-8 place-items-center rounded-[8px] text-secondary hover:bg-raised hover:text-primary"
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  )
}
