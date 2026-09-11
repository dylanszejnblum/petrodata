'use client'

// Centralised anime.js v4 helpers. Components call these instead of touching
// anime.js directly, so the (v4-specific) API stays in one place and every
// animation respects `prefers-reduced-motion` and only touches compositor props
// (transform/opacity) or text content.

import { animate } from 'animejs'
import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fires once when `ref` first scrolls into view. Returns whether it has been
 * seen yet — drive entrance animations off this.
 */
export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.25, ...options },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return { ref, inView }
}

/**
 * Tick a numeric counter from 0 → `to`, writing formatted text into `el`.
 * Honours reduced motion (jumps straight to the final value).
 */
export function animateCounter(
  el: HTMLElement,
  to: number,
  opts: { duration?: number; delay?: number; format: (v: number) => string },
) {
  const { duration = 2000, delay = 0, format } = opts
  if (prefersReducedMotion() || to === 0) {
    el.textContent = format(to)
    return
  }
  const state = { v: 0 }
  el.textContent = format(0)
  return animate(state, {
    v: to,
    duration,
    delay,
    ease: 'outExpo',
    onUpdate: () => {
      el.textContent = format(state.v)
    },
  })
}

export { animate }
