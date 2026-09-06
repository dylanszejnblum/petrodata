/* Las reglas del voto que NO son de cliente.

   `LIMITE` vivía en votos.ts, que lleva 'use client' porque exporta el hook.
   Un valor exportado desde el borde de cliente llega al servidor como una
   referencia, no como el número: dentro de JSX React la resuelve y se ve el 5,
   pero en un template literal —`${LIMITE} votos`— el proxy se intercepta y lo
   que se renderiza es el texto del error:

     function() { throw new Error("Attempted to call LIMITE() from the server
     but LIMITE is on the client…") } votos por semana

   Y se renderiza SIN romper el build ni la consola, que es lo peligroso: salió
   impreso en la nota de la cabecera y sólo se vio mirando la página. Así que la
   constante baja a un módulo sin directiva, que las dos mitades pueden importar. */
export const LIMITE = 5

/* ── LO QUE YA NO VIVE ACÁ ───────────────────────────────────────────────

   VOTANTES_SEMANA = 377 y VOTOS_SEMANA = 1.284 eran números INVENTADOS, con
   una advertencia en mayúsculas de que el riesgo real era que alguien del
   equipo los tomara por una métrica y los pusiera en un deck o en una
   respuesta a un periodista. Ya no hacen falta: los dos vienen en
   `votacion.votes` y `votacion.voters` de /api/v2/directivos, que es un COUNT.

   PESO_VOTO = 3 tampoco: cuánto mueve un voto lo decide el servidor, y ahora
   es un presupuesto relativo —el más votado de la semana se lleva el máximo y
   el resto en proporción— en vez de una constante de puntos. Su propio
   comentario ya decía que con mil votantes tres puntos por voto rompe la
   escala; con el reparto relativo, diez votantes y diez mil dan el mismo rango.

   El LÍMITE de arriba se queda porque el texto de la interfaz lo cita —«te
   quedan N de 5»— y el servidor lo devuelve en `weekly_limit`. Si los dos
   dejaran de coincidir, manda el servidor: acá se rechaza el clic, allá se
   rechaza el voto. */

/* ── EL CORTE DIARIO ─────────────────────────────────────────────────────

   La lista NO se reordena al votar. Los votos se acumulan y el orden se
   recalcula una vez por día, a medianoche.

   Es una decisión de producto, no una limitación: reordenando en vivo, el que
   vota ve su propio clic mover la tabla y el ranking se lee como un juguete.
   Con corte diario hay una foto por día, y el que quiere saber si subió tiene
   que volver mañana.

   El costo es que hay que DECIR que el voto quedó registrado. Si votás y no
   pasa nada en pantalla, parece que se rompió: por eso la fila votada hoy
   muestra «entra mañana» y la cabecera tiene la cuenta regresiva. */
export const CORTE_HORA = 0

/** El día al que pertenece un voto, en ISO. Es la unidad del corte. */
export function dia(d: Date = new Date()): string {
  const x = new Date(d)
  x.setHours(x.getHours() - CORTE_HORA)
  return x.toISOString().slice(0, 10)
}

/** Cuándo se recalcula el orden. */
export function proximoCorte(desde: Date = new Date()): Date {
  const d = new Date(desde)
  d.setHours(CORTE_HORA, 0, 0, 0)
  if (d <= desde) d.setDate(d.getDate() + 1)
  return d
}
