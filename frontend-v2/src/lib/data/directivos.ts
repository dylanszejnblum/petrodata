/* Directivos — GET /api/v2/directivos.
   Reemplaza a fixtures/personas.ts: el índice, el orden, los contadores de
   votos y quién tiene cara los decide el backend. */

import { cache } from 'react'
import { api } from '@/api/client'
import type { PersonaFila } from '@/fixtures/personas'
import { str, withFallback } from './fallback'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.petrodata.dylansz.com'

/** Las rutas de foto llegan relativas a la API, no al sitio: se absolutizan acá. */
function absoluta(ruta: string | null | undefined): string | null {
  if (!ruta) return null
  return ruta.startsWith('http') ? ruta : `${BASE.replace(/\/$/, '')}${ruta}`
}

export type Directivos = {
  filas: PersonaFila[]
  /* Los dos contadores de la cabecera. Antes estaban escritos a mano en
     voto-reglas.ts con una advertencia en mayúsculas de que alguien iba a
     citarlos en un deck; ahora son el COUNT de la semana. Si son chicos, son
     chicos. */
  votos: number
  votantes: number
  limiteSemanal: number
  /** Hasta tres, por votos a favor de la semana. Es un COUNT, como los otros dos. */
  masVotados: { slug: string; nombre: string; votos: number }[]
}

const VACIO: Directivos = { filas: [], votos: 0, votantes: 0, limiteSemanal: 5, masVotados: [] }

/* cache(): la ficha compartible pide lo mismo para el metadata, la imagen y la
   página, y así sale un solo GET por render. */
export const loadDirectivos = cache(async (): Promise<Directivos> =>
  withFallback(
    'directivos',
    async () => {
      const { data, error } = await api.GET('/api/v2/directivos', {
        next: { revalidate: 300 },
      })
      const d = data?.data
      if (error || !d?.directivos?.length) return null
      return {
        filas: d.directivos.map(
          (x): PersonaFila => ({
            slug: x.company_slug,
            nombre: x.name,
            cargo: x.role,
            empresa: x.company_name,
            indice: x.index,
            /* Los nullable del spec llegan como `Record<string, never> | null`
               (cosa de openapi-typescript): str() los normaliza, igual que en
               el resto de los loaders. */
            enElCargoDesde: str(x.in_role_since) ?? undefined,
            bio: str(x.bio) ?? undefined,
            foto: absoluta(str(x.photo_url)),
            foto2x: absoluta(str(x.photo_url_2x)),
            movimiento: x.rank_change,
          }),
        ),
        votos: d.votacion.votes,
        votantes: d.votacion.voters,
        limiteSemanal: d.votacion.weekly_limit,
        masVotados: (d.votacion.top_voted ?? []).map((m) => ({
          slug: m.company_slug,
          nombre: m.name,
          votos: m.votes,
        })),
      }
    },
    /* Sin fallback a fixture, y a propósito: son personas con nombre y apellido
       y un puesto en un ranking. Publicar una foto vieja de quién dirige qué
       —con un índice que ya no se corresponde con la producción— es peor que no
       publicar la sección. La página muestra el aviso y no la lista. */
    () => VACIO,
  ),
)
