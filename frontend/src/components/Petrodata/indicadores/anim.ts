'use client'

// Animation helpers for the indicadores (investment-thesis) page. Re-exports the
// reduced-motion-safe utilities from the uranium module so every entrance /
// counter animation honours prefers-reduced-motion and only touches compositor
// props (transform/opacity) or text content — matching UraniumStats.tsx.

export {
  animate,
  stagger,
  utils,
  prefersReducedMotion,
  useInView,
  animateCounter,
  fadeIn,
  staggerIn,
  popIn,
} from '../uranium/anim'
