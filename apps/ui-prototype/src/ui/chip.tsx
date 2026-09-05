'use client'

import type { ButtonHTMLAttributes } from 'react'

/* Chip de filtro. Target táctil >= 28px (cumple 2.5.8). */

export function Chip({
  selected = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        'inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors duration-150',
        selected
          ? 'border-primary bg-primary text-canvas'
          : 'border-line-strong bg-surface text-secondary hover:text-primary',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
