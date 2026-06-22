'use client'

import React, { useState, FormEvent } from 'react'
import { api } from '@/api/client'

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
      const { response } = await api.POST('/api/v1/newsletter', {
        body: { email, source: 'footer' },
      })

      if (response.ok) {
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
        className="text-[11px] uppercase tracking-[0.08em] font-mono"
        style={{ color: 'var(--nd-success)' }}
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
        className="border-b border-nd-border-visible bg-transparent py-2 pr-3 text-[11px] text-nd-text-primary placeholder:text-nd-text-disabled focus:border-nd-text-display focus:outline-none transition-colors w-40 font-mono"
        required
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="ml-2 rounded-full border border-nd-border-visible bg-nd-text-display px-4 py-2 text-[10px] uppercase tracking-[0.06em] text-nd-black transition-colors hover:bg-transparent hover:text-nd-text-display disabled:opacity-40 font-mono"
      >
        {status === 'loading' ? '...' : 'JOIN'}
      </button>
      {status === 'error' && (
        <span
          className="ml-2 self-center text-[9px] uppercase font-mono"
          style={{ color: 'var(--nd-accent)' }}
        >
          {message}
        </span>
      )}
    </form>
  )
}
