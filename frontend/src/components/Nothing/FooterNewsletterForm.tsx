'use client'

import React, { useState, FormEvent } from 'react'

export function FooterNewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage('ENTER A VALID EMAIL')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })

      if (res.ok) {
        setStatus('success')
        setMessage('SUBSCRIBED')
        setEmail('')
      } else {
        setStatus('error')
        setMessage('TRY AGAIN')
      }
    } catch {
      setStatus('error')
      setMessage('NETWORK ERROR')
    }
  }

  if (status === 'success') {
    return (
      <span
        className="text-[11px] uppercase tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-success)' }}
      >
        [SUBSCRIBED]
      </span>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status === 'error') setStatus('idle')
        }}
        placeholder="your@email.com"
        className="border-b border-nd-border-visible bg-transparent py-2 pr-3 text-[11px] text-nd-text-primary placeholder:text-nd-text-disabled focus:border-nd-text-display focus:outline-none transition-colors w-40"
        style={{ fontFamily: 'var(--font-space-mono)' }}
        required
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="ml-2 rounded-full border border-nd-border-visible bg-nd-text-display px-4 py-2 text-[10px] uppercase tracking-[0.06em] text-nd-black transition-colors hover:bg-transparent hover:text-nd-text-display disabled:opacity-40"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {status === 'loading' ? '...' : 'JOIN'}
      </button>
      {status === 'error' && (
        <span
          className="ml-2 self-center text-[9px] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-accent)' }}
        >
          {message}
        </span>
      )}
    </form>
  )
}
