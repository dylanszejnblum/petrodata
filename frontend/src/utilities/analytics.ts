import { sendGAEvent } from '@next/third-parties/google'

/** Flat bag of event parameters. null/undefined/'' values are dropped. */
type EventParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    // Microsoft Clarity, injected by the script in the root layout.
    clarity?: (...args: unknown[]) => void
  }
}

/**
 * Fire one product event to every analytics sink we run (GA4 + Microsoft
 * Clarity), so there's a single event vocabulary instead of two SDK calls
 * sprinkled per component.
 *
 * Call it from user-action handlers (onClick / onChange / submit) — never from
 * render or a mount effect, or you'll log phantom events.
 *
 * Safe to call anywhere: if a sink isn't loaded (local dev without IDs, or
 * before the script hydrates) that sink is skipped.
 */
export function track(name: string, params: EventParams = {}): void {
  const clean: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }

  // GA4 — event + params become custom dimensions you can break down by.
  sendGAEvent('event', name, clean)

  // Clarity — a named smart event (for funnels) plus each param as a session
  // tag, so you can filter recordings/heatmaps by them.
  const clarity = typeof window !== 'undefined' ? window.clarity : undefined
  if (typeof clarity === 'function') {
    clarity('event', name)
    for (const [k, v] of Object.entries(clean)) clarity('set', k, String(v))
  }
}
