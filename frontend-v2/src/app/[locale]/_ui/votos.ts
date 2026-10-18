'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { api } from '@/api/client'
import { LIMITE } from './voto-reglas'
import { tokenTurnstile } from './turnstile'

/* EL VOTO — ahora contra el servidor.

   Antes esto era localStorage: una maqueta que probaba la mecánica y nada del
   control. El presupuesto se reseteaba borrando el storage, y el enunciado
   —«uno por semana»— sólo se sostenía si nadie miraba. Ahora el límite, el
   corte diario y la semana viven en /api/v2/directivos/voto, y acá queda lo
   que de verdad es del cliente: el estado optimista mientras vuelve el POST.

   LO QUE SIGUE SIENDO CIERTO Y ESTÁ DICHO AL PIE: el votante se identifica por
   IP, y una IP no es una persona. Una oficina o una operadora móvil son miles
   detrás de una sola, y cualquiera con VPN vota lo que quiera. Es la
   aproximación que se eligió publicar, no una identidad.

   EL VOTO NO SE EDITA. Lo hace cumplir un índice único en la base, no este
   módulo: si dos pestañas mandan el mismo voto, una recibe 409 y la lista
   queda igual. */

export { LIMITE } from './voto-reglas'

export type Voto = 1 | -1
/** Un voto ya emitido. `contado` = ya entró en el corte; si no, entra mañana. */
export type Emitido = { v: Voto; contado: boolean }
export type Estado = { votos: Record<string, Emitido>; restantes: number; usados: number }

const VACIO: Estado = { votos: {}, restantes: LIMITE, usados: 0 }

function aEstado(d: {
  used: number
  remaining: number
  votes: { company_slug: string; value: number; counted: boolean }[]
}): Estado {
  const votos: Record<string, Emitido> = {}
  for (const v of d.votes) votos[v.company_slug] = { v: v.value as Voto, contado: v.counted }
  return { votos, usados: d.used, restantes: d.remaining }
}

/* UN SOLO ESTADO PARA TODA LA PÁGINA. La lista y el chip de «votos
   disponibles» llamaban cada uno a useVotos() con su propio useState: votabas
   en la lista y el chip seguía diciendo 5 hasta recargar. Ahora es un store de
   módulo y los dos leen el mismo. */
type Store = { estado: Estado; listo: boolean }
let store: Store = { estado: VACIO, listo: false }
const SERVIDOR: Store = { estado: VACIO, listo: false }
const oyentes = new Set<() => void>()
const poner = (cambio: Partial<Store>) => {
  store = { ...store, ...cambio }
  oyentes.forEach((f) => f())
}
const suscribir = (f: () => void) => {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

/* `cache: 'no-store'`: el presupuesto es por IP y cambia con cada voto. El
   backend respondía con `public, max-age=60` y el navegador devolvía «te
   quedan 5» un minuto después de haber votado: los chevrones se encendían de
   nuevo y cada clic era un 409. Esto lo saltea aunque haya una copia vieja.

   Si el GET falla, la lista queda BLOQUEADA y no con cinco votos inventados:
   sin saber qué votó esta IP, cualquier clic es un voto que puede rebotar. */
let pedido: Promise<void> | null = null
function cargar(): Promise<void> {
  pedido ??= api
    .GET('/api/v2/directivos/voto', { cache: 'no-store' })
    .then(({ data }) => {
      if (data?.data) poner({ estado: aEstado(data.data), listo: true })
      else poner({ listo: false })
    })
    .catch(() => poner({ listo: false }))
    .finally(() => {
      pedido = null
    })
  return pedido
}

export function useVotos() {
  const { estado, listo } = useSyncExternalStore(suscribir, () => store, () => SERVIDOR)

  /* El presupuesto es POR IP y no se puede renderizar en el servidor: el HTML
     de la página está cacheado y compartido entre visitantes. Por eso se pide
     después de hidratar; varios componentes montando a la vez comparten un
     solo pedido. */
  useEffect(() => {
    if (!store.listo) cargar()
  }, [])

  const votar = useCallback(
    (slug: string, v: Voto) => {
      const { estado: e, listo: ok } = store
      if (!ok || e.votos[slug] || e.restantes <= 0) return
      /* Optimista: el voto se dibuja antes de que vuelva el POST. Si el
         servidor lo rechaza —409 por repetido o sin crédito, 403, 429, 503—
         el error no trae el presupuesto, así que se vuelve a pedir (sin
         caché) y pisa lo optimista. */
      poner({
        estado: {
          votos: { ...e.votos, [slug]: { v, contado: false } },
          usados: e.usados + 1,
          restantes: Math.max(0, e.restantes - 1),
        },
      })
      tokenTurnstile()
        .then((turnstile_token) =>
          api.POST('/api/v2/directivos/{slug}/voto', {
            params: { path: { slug } },
            body: { value: v, turnstile_token },
          }),
        )
        .then(({ data }) => {
          if (data?.data) poner({ estado: aEstado(data.data) })
          else return cargar()
        })
        .catch(() => cargar())
    },
    [],
  )

  return { votos: estado.votos, votar, usados: estado.usados, restantes: estado.restantes, listo }
}
