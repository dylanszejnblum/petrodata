import type { ReactNode } from 'react'

/**
 * Large highlighted block used to remark something important inside a news body
 * (an editorial pull-quote). Rendered as an accented blockquote.
 */
export function NewsHighlight({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <blockquote className="my-8 border-l-2 border-nd-accent pl-5 sm:pl-6">
      {label ? (
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-accent">
          {label}
        </span>
      ) : null}
      <p className="text-balance text-xl leading-snug text-nd-text-display font-display sm:text-2xl">
        {children}
      </p>
    </blockquote>
  )
}
