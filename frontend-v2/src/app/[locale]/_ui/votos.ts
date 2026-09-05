'use client'

import { useCallback, useSyncExternalStore } from 'react'

import { dia, LIMITE } from './voto-reglas'

/* EL VOTO — un store chico, compartido por la lista y el panel de la sección 01.

   Las dos piezas viven en secciones distintas de la página y tienen que ver lo
   mismo: si votás en la lista, el presupuesto del panel baja en el mismo
   frame. Con estado local en cada una, una se enteraba y la otra no.

   Es `useSyncExternalStore` y no un contexto porque el dato de verdad vive
   AFUERA de React —en localStorage— y ése es exactamente el caso que este hook
   resuelve: una fuente externa que muta, con suscripción y con una lectura
   distinta para el servidor.

   Todo esto es una MAQUETA. El enunciado —un presupuesto semanal por usuario—
   sólo se sostiene del lado del servidor: acá el que vota puede borrar el
   storage y volver a empezar. Lo que la maqueta prueba es la mecánica y la
   composición, no el control. */

/* La clave cambió con el nombre de la sección. Se pierden los votos que
   hubiera guardados, que son de una maqueta. */
const CLAVE = 'v2-directivos-votos'

/* El límite vive en voto-reglas.ts y no acá: un valor exportado desde un
   módulo 'use client' no sobrevive a un template literal del lado del servidor.
   Se re-exporta para que quien ya lo importaba de acá siga andando.

   Cinco sobre 48 personas, y el número importa: con votos ilimitados el ranking
   lo gana el que más aguante tiene apretando, y el voto deja de decir «esta
   persona me parece la mejor» para decir «alguien insistió». Escaso, cada voto
   es una elección —hay que dejar a 43 afuera— y de paso encarece muchísimo
   inflarlo desde una sola mano. */
export { LIMITE } from './voto-reglas'

export type Voto = 1 | -1

/* Cada voto guarda su dirección y el DÍA en que se emitió. El día es lo que
   permite el corte: la lista se ordena sólo con los votos de días anteriores y
   los de hoy quedan pendientes hasta medianoche. Antes se guardaba nada más que
   la dirección, así que no había forma de saber cuáles ya estaban adentro. */
export type Emitido = { v: Voto; d: string }
export type Estado = { semana: string; votos: Record<string, Emitido> }

/** Lunes de la semana en curso, en ISO. Es la clave con la que caducan los
    votos: al cambiar de lunes el objeto guardado deja de coincidir y se
    descarta entero, presupuesto incluido. */
export function semana(): string {
  const d = new Date()
  const dia = (d.getDay() + 6) % 7 // lunes = 0
  d.setDate(d.getDate() - dia)
  return d.toISOString().slice(0, 10)
}

const VACIO: Estado = { semana: '', votos: {} }

/* La instantánea se cachea. useSyncExternalStore compara por identidad y
   parsear el JSON en cada lectura devolvería un objeto nuevo cada vez: React
   lo vería siempre como un cambio y entraría en un bucle de renders. */
let cache: Estado = VACIO
let crudo: string | null = null

function leer(): Estado {
  let s: string | null = null
  try {
    s = localStorage.getItem(CLAVE)
  } catch {
    /* storage bloqueado: se trabaja en memoria y nada persiste */
  }
  if (s !== crudo) {
    crudo = s
    try {
      const d = JSON.parse(s || '{}') as Estado
      /* Se descarta lo guardado con la forma vieja —el valor era el número del
         voto y no un objeto—: sin el día no se puede saber si el voto ya entró
         en el corte, y adivinarlo sería peor que perder cinco votos de una
         maqueta. */
      const sano =
        d.votos && Object.values(d.votos).every((x) => x && typeof x === 'object' && 'd' in x)
      cache = d.semana === semana() && sano ? { semana: d.semana, votos: d.votos } : VACIO
    } catch {
      cache = VACIO
    }
  }
  return cache
}

const oyentes = new Set<() => void>()
function avisar() {
  for (const f of oyentes) f()
}

/** En el servidor no hay storage, así que la lectura es el vacío. Es lo que
    hace que el HTML servido y el primer render del cliente coincidan; el voto
    guardado aparece recién en el efecto de suscripción. */
const vacioServidor = () => VACIO

export function useVotos() {
  const estado = useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      /* Otra pestaña del mismo navegador también vota: `storage` avisa. Sin
         esto, dos pestañas abiertas muestran presupuestos distintos. */
      const alStorage = (e: StorageEvent) => {
        if (e.key === CLAVE) avisar()
      }
      window.addEventListener('storage', alStorage)
      return () => {
        oyentes.delete(f)
        window.removeEventListener('storage', alStorage)
      }
    },
    leer,
    vacioServidor,
  )

  const usados = Object.keys(estado.votos).length
  const restantes = Math.max(0, LIMITE - usados)

  /* EL VOTO NO SE EDITA (pedido de Mariano). Una vez emitido no se saca ni se
     da vuelta hasta el lunes.

     Es lo correcto para lo que el voto tiene que significar —un voto que se
     puede deshacer y rehacer es un voto que se puede tantear, y el conteo deja
     de ser una foto de opiniones para ser una de últimas intenciones— pero
     tiene un costo que conviene tener presente: un clic equivocado se paga
     hasta el lunes. Si eso molesta, la salida no es volver a hacerlo editable
     sino pedir confirmación antes del primer voto de cada fila. */
  const votar = useCallback((slug: string, v: Voto) => {
    const act = leer()
    if (act.votos[slug]) return
    const sig = { ...act.votos }
    if (Object.keys(sig).length >= LIMITE) return
    sig[slug] = { v, d: dia() }
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ semana: semana(), votos: sig }))
    } catch {
      /* sin storage el voto vale para esta sesión y nada más */
    }
    crudo = null // fuerza la relectura en la próxima instantánea
    avisar()
  }, [])

  return { votos: estado.votos, votar, usados, restantes }
}
