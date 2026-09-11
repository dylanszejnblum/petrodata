'use client'

// Ranked operator list (top 8). Proportion bars grow from 0 (staggered) when
// scrolled into view; rows highlight on hover; the #1 rank is picked out in the
// accent colour. SSR/no-JS shows the final bar widths — reduced motion skips the
// grow entirely.

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, useInView } from '../_lib/anim'
import type { InvOperador } from '../_lib/types'

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
        /* bbl/d y % en la MISMA línea de base que el nombre (antes el %
           vivía en una 3ª columna centrada y quedaba desalineado —
           corrección de Mariano, 2026-08-08); la barra corre a todo el
           ancho debajo */
        return (
          <div
            key={op.slug}
            className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-3 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
          >
            <span
              className="text-[11px] tnums"
              style={{ color: leader ? 'var(--data-oil)' : 'var(--text-tertiary)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="truncate text-sm text-primary"
                  style={{ fontWeight: leader ? 600 : 400 }}
                >
                  {op.name}
                </span>
                <span className="shrink-0 text-[11px] tnums text-secondary">
                  {nf.format(Math.round(op.oilBblD))} bbl/d ·{' '}
                  <span
                    className="font-semibold"
                    style={{ color: leader ? 'var(--data-oil)' : 'var(--text-primary)' }}
                  >
                    {op.sharePct.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={pct}
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: 'var(--data-oil)',
                    opacity: leader ? 1 : 0.85,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
