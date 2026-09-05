'use client'

import { useEffect, useState } from 'react'

/* ChartFrame — altura reservada (cero CLS), gate de hidratación para
   ResponsiveContainer, y accesibilidad (role=img + resumen). Colapsa el
   boilerplate repetido en los 10 charts de producción. */

export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

const HEIGHT = { sm: 'var(--chart-sm)', md: 'var(--chart-md)', lg: 'var(--chart-lg)' } as const

export function ChartFrame({
  title,
  summary,
  height = 'md',
  children,
}: {
  title: string
  summary?: string
  height?: keyof typeof HEIGHT
  children: React.ReactNode
}) {
  const mounted = useMounted()
  return (
    <figure role="img" aria-label={summary ? `${title}. ${summary}` : title} className="m-0 w-full">
      <div style={{ height: HEIGHT[height] }} className="w-full">
        {mounted && children}
      </div>
    </figure>
  )
}

/* Props tokenizadas para ejes/grid de Recharts (el AXIS de MacroChart, ahora público) */

export const AXIS_TICK = {
  fill: 'var(--text-tertiary)',
  fontSize: 11,
  fontFamily: 'var(--font-schibsted)',
} as const

export const GRID_PROPS = {
  stroke: 'var(--border-default)',
  strokeDasharray: '2 4',
  vertical: false,
} as const

export function ChartTooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border bg-surface px-3 py-2 text-[12px] shadow-[var(--elevation-overlay)]">
      {children}
    </div>
  )
}
