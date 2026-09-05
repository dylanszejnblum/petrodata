'use client'

import { useId, useState } from 'react'

/* Formulario del boletín del footer — port del FooterNewsletterForm real,
   con la accesibilidad que a producción le faltaba (label real, role=alert,
   role=status). El envío es simulado (mock). */

export function FooterNewsletterForm() {
  const id = useId()
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = String(new FormData(form).get('email') ?? '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error')
      return
    }
    setState('sending')
    await new Promise((r) => setTimeout(r, 600)) // latencia simulada
    setState('ok')
  }

  if (state === 'ok') {
    return (
      <p role="status" className="type-label !text-positive">
        [Suscripto]
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-stretch gap-2" noValidate>
      <label htmlFor={id} className="sr-only">
        Tu email
      </label>
      <input
        id={id}
        name="email"
        type="email"
        placeholder="tu@email.com"
        aria-invalid={state === 'error'}
        aria-describedby={state === 'error' ? `${id}-error` : undefined}
        onChange={() => state === 'error' && setState('idle')}
        className={[
          'min-h-9 w-[180px] rounded-[8px] border bg-white/5 px-3 text-[13px] text-on-dark placeholder:text-on-dark-3',
          state === 'error' ? 'border-negative' : 'border-white/15',
        ].join(' ')}
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="min-h-9 rounded-[8px] bg-on-dark px-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-inverse transition-opacity duration-150 hover:opacity-90 disabled:opacity-45"
      >
        Join
      </button>
      {state === 'error' && (
        <span id={`${id}-error`} role="alert" className="sr-only">
          Ingresá un email válido
        </span>
      )}
    </form>
  )
}
