/* Estrategia de datos de frontend-v2:
   1. Cada loader pega al backend NestJS real (src/api/client.ts).
   2. Si el backend no responde o devuelve error, cae al fixture scrapeado
      (copia 1:1 de producción) para que la app siempre renderice con
      números publicables.
   Los loaders devuelven EXACTAMENTE las formas de los fixtures: los
   componentes Estrato quedan intocados y el simulador ?estado= sigue
   funcionando igual sobre el resultado. */

export async function withFallback<T>(
  label: string,
  live: () => Promise<T | null>,
  fallback: () => T,
): Promise<T> {
  try {
    /* Keep the shell responsive when the optional live API is offline or
       waking from sleep. Without a deadline, Node's fetch can hold the whole
       route open for minutes before the fixture fallback is reached. */
    const deadline = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500))
    const value = await Promise.race([live(), deadline])
    if (value == null || (Array.isArray(value) && value.length === 0)) {
      console.warn(`[data] ${label}: la API no devolvió datos, usando fixture`)
      return fallback()
    }
    return value
  } catch (err) {
    console.warn(`[data] ${label}: backend no disponible, usando fixture`, err)
    return fallback()
  }
}

/** Campos nullable en el spec (Record<string, never> | null) — normaliza a T | null. */
export function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
