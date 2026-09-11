import { useEffect, useState } from 'react'

/**
 * Returns true only after the component has mounted on the client.
 *
 * Used to defer rendering Recharts' <ResponsiveContainer>, which cannot
 * measure its parent during SSR and otherwise logs noisy
 * "width(-1) and height(-1) of chart should be greater than 0" warnings.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
