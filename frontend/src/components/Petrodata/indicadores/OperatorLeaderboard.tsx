'use client'

// Ranked operator list (top 8). Proportion bars grow from 0 (staggered) when
// scrolled into view; rows highlight on hover; the #1 rank is picked out in the
// accent colour. SSR/no-JS shows the final bar widths — reduced motion skips the
// grow entirely.

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, useInView } from './anim'
import type { InvOperador } from '@/api/inversiones'

export function OperatorLeaderboard({ operadores }: { operadores: InvOperador[] }) {
  const top = operadores.slice(0, 8)
  const maxShare = Math.max(...top.map((o) => o.sharePct), 1)
  const nf = new Intl.NumberFormat('es-AR')

  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!inView || !top.length || prefersReducedMotion()) return
    const anims = barRefs.current.map((el, i) => {
      if (!el) return undefined
      const target = Number(el.dataset.pct ?? '0')
      el.style.width = '0%'
      return animate(el, {
        width: `${target}%`,
        duration: 900,
        delay: i * 80,
        ease: 'outCubic',
      })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  if (!operadores.length) return null
  return (
    <div ref={ref} className="flex flex-col">
      {top.map((op, i) => {
        const pct = (op.sharePct / maxShare) * 100
        const leader = i === 0
        return (
          <div
            key={op.slug}
            className="group grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 border-b border-nd-border py-3 transition-colors duration-200 hover:bg-nd-surface-raised/60"
          >
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: leader ? 'var(--nd-accent)' : 'var(--nd-text-disabled)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="truncate font-sans text-sm text-nd-text-display"
                  style={{ fontWeight: leader ? 600 : 400 }}
                >
                  {op.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-nd-text-secondary">
                  {nf.format(Math.round(op.oilBblD))} bbl/d
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-nd-border">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={pct}
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    background: 'var(--nd-accent)',
                    opacity: leader ? 1 : 0.85,
                  }}
                />
              </div>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-nd-text-secondary">
              {op.sharePct.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
