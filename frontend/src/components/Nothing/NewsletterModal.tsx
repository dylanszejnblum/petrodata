'use client'

import React, { useState, useEffect, useCallback, useRef, FormEvent } from 'react'

type ModalState = 'idle' | 'entering' | 'visible' | 'exiting' | 'success' | 'success-exiting'

const STORAGE_KEY = 'vacamuerta-newsletter-dismissed'
const SESSION_KEY = 'vacamuerta-newsletter-shown'
const SCROLL_THRESHOLD = 0.4
const TIME_DELAY = 12000
const DISMISS_COOLDOWN_DAYS = 14

export function NewsletterModal() {
  const [state, setState] = useState<ModalState>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const hasTriggered = useRef(false)

  const shouldShow = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (sessionStorage.getItem(SESSION_KEY)) return false

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (dismissed) {
        const elapsed = Date.now() - parseInt(dismissed, 10)
        if (elapsed < DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) return false
      }
    } catch {}

    return true
  }, [])

  const trigger = useCallback(() => {
    if (hasTriggered.current) return
    if (!shouldShow()) return
    hasTriggered.current = true
    setState('entering')
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {}
  }, [shouldShow])

  useEffect(() => {
    if (!shouldShow()) return

    const timer = setTimeout(() => {
      trigger()
    }, TIME_DELAY)

    const handleScroll = () => {
      const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrolled >= SCROLL_THRESHOLD) {
        trigger()
        window.removeEventListener('scroll', handleScroll)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [trigger, shouldShow])

  useEffect(() => {
    if (state === 'entering') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setState('visible')
        })
      })
    }
  }, [state])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch {}
    setState('exiting')
  }, [])

  const handleSuccessClose = useCallback(() => {
    setState('success-exiting')
  }, [])

  useEffect(() => {
    if (state === 'exiting' || state === 'success-exiting') {
      const timer = setTimeout(() => setState('idle'), 400)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email')
      return
    }

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter-modal' }),
      })

      if (res.ok) {
        setState('success')
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error')
    }
  }

  if (state === 'idle') return null

  const isVisible = state === 'visible' || state === 'success'
  const isExiting = state === 'exiting' || state === 'success-exiting'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
    >
      <style>{`
        @keyframes nd-modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes nd-modal-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes nd-modal-card-in {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes nd-modal-card-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
        }
        @keyframes nd-modal-dot-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes nd-modal-line-draw {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes nd-modal-success-check {
          from {
            stroke-dashoffset: 28;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes nd-modal-success-ring {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes nd-modal-fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nd-modal-backdrop-in {
          animation: nd-modal-backdrop-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nd-modal-backdrop-out {
          animation: nd-modal-backdrop-out 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nd-modal-card-in {
          animation: nd-modal-card-in 450ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nd-modal-card-out {
          animation: nd-modal-card-out 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nd-modal-dot {
          animation: nd-modal-dot-pulse 2s ease-in-out infinite;
        }
        .nd-modal-dot:nth-child(2) { animation-delay: 150ms; }
        .nd-modal-dot:nth-child(3) { animation-delay: 300ms; }
        .nd-modal-line-draw {
          animation: nd-modal-line-draw 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both;
        }
        .nd-modal-success-check {
          stroke-dasharray: 28;
          animation: nd-modal-success-check 400ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both;
        }
        .nd-modal-success-ring {
          stroke-dasharray: 100;
          animation: nd-modal-success-ring 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nd-modal-fade-up {
          animation: nd-modal-fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Backdrop */}
      <button
        className={`absolute inset-0 bg-black/60 ${
          isExiting ? 'nd-modal-backdrop-out' : 'nd-modal-backdrop-in'
        }`}
        onClick={state === 'success' ? handleSuccessClose : dismiss}
        aria-label="Close"
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md rounded-2xl border border-nd-border-visible bg-nd-surface overflow-hidden ${
          isExiting ? 'nd-modal-card-out' : 'nd-modal-card-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-nd-surface-raised overflow-hidden">
          <div
            className="h-full nd-modal-line-draw"
            style={{ backgroundColor: 'var(--nd-success)' }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={state === 'success' ? handleSuccessClose : dismiss}
          className="absolute top-4 right-4 text-nd-text-disabled hover:text-nd-text-display transition-colors p-1"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>

        {state === 'success' ? (
          /* ── Success state ── */
          <div className="px-8 pt-10 pb-8 text-center">
            {/* Checkmark */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle
                  cx="28"
                  cy="28"
                  r="16"
                  stroke="var(--nd-success)"
                  strokeWidth="1.5"
                  className="nd-modal-success-ring"
                  fill="none"
                />
                <path
                  d="M20 28l5 5 11-11"
                  stroke="var(--nd-success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nd-modal-success-check"
                  fill="none"
                />
              </svg>
            </div>

            <h3 className="mb-2 text-xl text-nd-text-display nd-modal-fade-up font-sans">
              You are on the list
            </h3>
            <p
              className="text-sm text-nd-text-secondary nd-modal-fade-up font-sans"
              style={{
                animationDelay: '100ms',
              }}
            >
              Expect Argentina resources briefings in your inbox soon.
            </p>

            {/* Decorative dots */}
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="nd-modal-dot block h-1 w-1 rounded-full"
                  style={{ backgroundColor: 'var(--nd-success)', animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="px-8 pt-10 pb-8">
            {/* Dot-matrix motif */}
            <div className="mb-6 flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="nd-modal-dot block h-[5px] w-[5px] rounded-full"
                  style={{
                    backgroundColor: 'var(--nd-text-display)',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>

            {/* Label */}
            <span className="mb-3 block text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary font-mono">
              NEWSLETTER
            </span>

            {/* Title */}
            <h2 className="mb-2 text-2xl leading-tight text-nd-text-display font-sans">
              Stay up to date with new research & stats
            </h2>

            {/* Description */}
            <p className="mb-6 text-sm leading-relaxed text-nd-text-secondary font-sans">
              Weekly briefings on Argentina’s oil, gas, minerals and rare-earths projects —
              production, reserves, operators. No noise.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="your@email.com"
                  className="w-full border-b border-nd-border-visible bg-transparent py-3 pr-4 text-sm text-nd-text-primary placeholder:text-nd-text-disabled focus:border-nd-text-display focus:outline-none transition-colors font-mono"
                  autoFocus={isVisible}
                  required
                />
              </div>

              {error && (
                <span
                  className="text-[11px] uppercase tracking-[0.06em] font-mono"
                  style={{ color: 'var(--nd-accent)' }}
                >
                  [ERROR: {error.toUpperCase()}]
                </span>
              )}

              <button
                type="submit"
                className="mt-1 w-full rounded-full border border-nd-border-visible bg-nd-text-display px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-nd-black transition-colors hover:bg-transparent hover:text-nd-text-display font-mono"
              >
                Subscribe
              </button>
            </form>

            {/* Footer */}
            <p className="mt-5 text-center text-[10px] text-nd-text-disabled font-mono">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
