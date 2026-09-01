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
    const value = await live()
    if (value == null || (Array.isArray(value) && value.length === 0)) {
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
