'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useInView, prefersReducedMotion } from '@/lib/motion'
import { CompanyLogo } from '../_client/company-logo'

/* Fila de ranking — receta de la sección 06 de Indicadores, que es la
   referencia de composición para toda lista del sistema: rank numerado
   "01".., logo de la empresa, nombre truncado con el líder en el color
   del dato y en negrita, el valor en la MISMA línea de base que el
   nombre (nunca en una columna aparte centrada), y barra redondeada a
   todo el ancho que crece al entrar en viewport. */

export function RankedRow({
  rank,
  name,
  website,
  logoUrl,
  right,
  sub,
  pct,
  color = 'var(--data-oil)',
  leader = false,
  index = 0,
}: {
  rank: number
  name: string
  /** dominio de la empresa → favicon de Google */
  website?: string
  /** ícono resuelto del sitio, tiene prioridad sobre el favicon */
  logoUrl?: string
  /** valor + % en la línea de base del nombre */
  right: ReactNode
  /** metadata opcional bajo el nombre (cotización, provincia…) */
  sub?: ReactNode
  /** ancho de la barra en % (0-100), ya normalizado contra el máximo */
  pct: number
  color?: string
  leader?: boolean
  index?: number
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  const barRef = useRef<HTMLDivElement>(null)

  /* El ancho final se renderiza en el markup y la animación va 0 → final
     (mismo patrón que TransportInfra en Indicadores): si el JS no corre,
     si el usuario pide menos movimiento o si la pestaña está en segundo
     plano —donde el navegador no dispara IntersectionObserver—, la barra
     igual se ve con su valor real en vez de quedar vacía. */
  useEffect(() => {
    const el = barRef.current
    if (!el || !inView || prefersReducedMotion()) return
    el.style.width = '0%'
    requestAnimationFrame(() => {
      el.style.transition = `width 800ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms`
      el.style.width = `${pct}%`
    })
  }, [inView, pct, index])

  return (
    <div
      ref={ref}
      className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
    >
      <span
        className="text-[11px] tnums"
        style={{ color: leader ? color : 'var(--text-tertiary)' }}
      >
        {String(rank).padStart(2, '0')}
      </span>
      {/* logo + contenido, misma composición que el listado completo:
          la barra arranca a la derecha del logo, no debajo */}
      <div className="flex min-w-0 items-start gap-3">
        <CompanyLogo name={name} website={website} logoUrl={logoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="truncate text-sm text-primary"
              style={{ fontWeight: leader ? 600 : 400 }}
            >
              {name}
            </span>
            <span className="shrink-0 text-[11px] tnums text-secondary">{right}</span>
          </div>
          {sub}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              ref={barRef}
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: color, opacity: leader ? 1 : 0.85 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
