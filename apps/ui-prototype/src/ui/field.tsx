'use client'

import { useId } from 'react'

/* Field — input con label real, error accesible y estados.
   Fix del placeholder-como-etiqueta de producción (A10/A11). */

type FieldBase = {
  label: string
  hint?: string
  error?: string | null
}

export function TextField({
  label,
  hint,
  error,
  ...props
}: FieldBase & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-label-md !text-secondary">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          'min-h-[38px] rounded-[8px] border bg-surface px-3 text-[13.5px] text-body placeholder:text-tertiary',
          'disabled:opacity-45',
          error ? 'border-negative' : 'border-line-strong',
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <span id={`${id}-hint`} className="text-[11.5px] text-tertiary">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-[11.5px] text-negative">
          {error}
        </span>
      )}
    </div>
  )
}

export function SelectField({
  label,
  hint,
  error,
  children,
  ...props
}: FieldBase & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-label-md !text-secondary">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          'min-h-[38px] rounded-[8px] border bg-surface px-3 text-[13.5px] text-body disabled:opacity-45',
          error ? 'border-negative' : 'border-line-strong',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <span id={`${id}-hint`} className="text-[11.5px] text-tertiary">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-[11.5px] text-negative">
          {error}
        </span>
      )}
    </div>
  )
}
