'use client'

import { useEffect } from 'react'

/** Applies the shared entrance class after hydration so server markup stays stable. */
export function PageMotion() {
  useEffect(() => {
    const root = document.querySelector('.s-contenido')
    if (!root) return
    root.classList.add('s-motion-ready')
  }, [])
  return null
}
