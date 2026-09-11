/* Simulador de estados del mock. Cualquier pantalla acepta:
     ?estado=vacio | error | parcial | offline
     ?latencia=1500   (ms, se aplica en el server component)
   Sin parámetros → datos completos. */

export type MockEstado = 'ok' | 'vacio' | 'error' | 'parcial' | 'offline'

export type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function readMock(searchParams?: SearchParams): Promise<{
  estado: MockEstado
  latencia: number
}> {
  const sp = (await searchParams) ?? {}
  const raw = typeof sp.estado === 'string' ? sp.estado : 'ok'
  const estado: MockEstado = ['vacio', 'error', 'parcial', 'offline'].includes(raw)
    ? (raw as MockEstado)
    : 'ok'
  const latencia = Math.min(6000, Number(sp.latencia) || 0)
  if (latencia > 0) await new Promise((r) => setTimeout(r, latencia))
  return { estado, latencia }
}

/** Aplica el estado a un dataset: ok→todo · parcial→recorta · vacio→[] ·
    error/offline→null (la pantalla muestra su estado de error). */
export function applyEstado<T>(estado: MockEstado, data: T[], partialCount = 2): T[] | null {
  switch (estado) {
    case 'vacio':
      return []
    case 'parcial':
      return data.slice(0, partialCount)
    case 'error':
    case 'offline':
      return null
    default:
      return data
  }
}
