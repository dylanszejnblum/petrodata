'use client'

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { LIMITE } from './voto-reglas'

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

export function useVotos() {
  const [estado, setEstado] = useState<Estado>(VACIO)
  /* Hasta que vuelve el primer GET no se sabe qué votó esta IP, y con el
     presupuesto en 5 los chevrones nacen habilitados: un clic en ese hueco
     manda un voto que el servidor puede rechazar. Se bloquean hasta saber. */
  const [listo, setListo] = useState(false)

  /* El presupuesto es POR IP y no se puede renderizar en el servidor: el HTML
     de la página está cacheado y compartido entre visitantes. Por eso va en un
     efecto, después de hidratar, y el primer render sale sin votos — igual que
     antes salía sin lo que hubiera en localStorage. */
  useEffect(() => {
    let vivo = true
    api
      .GET('/api/v2/directivos/voto', {})
      .then(({ data, error }) => {
        if (!vivo || error || !data?.data) return
        setEstado(aEstado(data.data))
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setListo(true)
      })
    return () => {
      vivo = false
    }
  }, [])

  const votar = useCallback(
    (slug: string, v: Voto) => {
      if (!listo || estado.votos[slug] || estado.restantes <= 0) return
      /* Optimista: el voto se dibuja antes de que vuelva el POST. Si el
         servidor lo rechaza —409 por repetido o sin crédito— la respuesta trae
         el presupuesto real y lo pisa. */
      setEstado((e) => ({
        votos: { ...e.votos, [slug]: { v, contado: false } },
        usados: e.usados + 1,
        restantes: Math.max(0, e.restantes - 1),
      }))
      api
        .POST('/api/v2/directivos/{slug}/voto', {
          params: { path: { slug } },
          body: { value: v },
        })
        .then(({ data }) => {
          if (data?.data) setEstado(aEstado(data.data))
        })
        .catch(() => {})
    },
    [listo, estado.votos, estado.restantes],
  )

  return { votos: estado.votos, votar, usados: estado.usados, restantes: estado.restantes, listo }
}
