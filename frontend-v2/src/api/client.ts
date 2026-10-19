import createClient from 'openapi-fetch'
import type { paths, components } from './types'

/* Keep v2 pointed at the same hosted PetroData service as v1 by default.
   Local development can still override this with NEXT_PUBLIC_API_BASE_URL. */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.petrodata.dylansz.com'

/* Del lado del servidor, la clave interna: todo lo que Next le pide a la API
   sale de una sola IP, y sin la clave compartía el límite de 120/min por IP con
   todos los visitantes (renders, revalidaciones, herramientas del chat). En el
   navegador `INTERNAL_API_KEY` no existe —no lleva NEXT_PUBLIC_— así que el
   header nunca sale de acá. */
const interna = typeof window === 'undefined' ? process.env.INTERNAL_API_KEY : undefined

export const api = createClient<paths>({
  baseUrl,
  headers: interna ? { 'x-internal-key': interna } : undefined,
})

export type ApiSchemas = components['schemas']
