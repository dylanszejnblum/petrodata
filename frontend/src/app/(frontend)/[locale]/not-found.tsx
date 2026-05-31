import { Link } from '@/i18n/navigation'
import React from 'react'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'

export default function NotFound() {
  return (
    <>
      <NothingHeader />
      <main className="flex-1">
        <section className="container flex min-h-[60vh] flex-col items-center justify-center py-20">
          <div className="mb-6 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 rounded-full bg-nd-accent"
                style={{ opacity: 1 - i * 0.3 }}
              />
            ))}
          </div>

          <span
            className="mb-4 block text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            [404]
          </span>

          <h1
            className="mb-3 text-center text-5xl leading-none text-nd-text-display md:text-7xl"
            style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
          >
            Not found
          </h1>

          <p
            className="mb-8 max-w-sm text-center text-sm leading-6 text-nd-text-secondary"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            This page does not exist or has been moved.
          </p>

          <Link
            href="/"
            className="rounded-full border border-nd-border-visible px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-nd-text-primary transition-colors hover:border-nd-text-display hover:text-nd-text-display"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            Back to home
          </Link>
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
