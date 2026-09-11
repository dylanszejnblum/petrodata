'use client'

/* Motion único de Estrato (hereda el rol de uranium/anim.ts de producción).
   Regla: TODO respeta prefers-reduced-motion, sin excepción. */

import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, inView }
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Cuenta de from→to. SSR y reduced-motion muestran SIEMPRE el valor final
    (fix del "0" en el h1 de producción). */
export function useCountUp(to: number, opts?: { durationMs?: number; enabled?: boolean }) {
  const { durationMs = 700, enabled = true } = opts ?? {}
  const [value, setValue] = useState(to)
  const done = useRef(false)
  useEffect(() => {
    if (!enabled || done.current || prefersReducedMotion()) {
      setValue(to)
      return
    }
    done.current = true
    const from = to * 0.5
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setValue(from + (to - from) * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, durationMs, enabled])
  return value
}
