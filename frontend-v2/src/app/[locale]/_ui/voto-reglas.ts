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

/* ── EL CONTADOR PÚBLICO ─────────────────────────────────────────────────

   ESTOS DOS NÚMEROS SON INVENTADOS. No salen de ningún backend, de ninguna
   analítica y de ningún conteo: están escritos a mano acá. Decisión de
   producto de Mariano (2026-09-01), tomada sabiendo lo que son, para que el
   ranking no arranque mostrando cifras chicas.

   Queda dicho en mayúsculas porque el riesgo real es de acá a tres meses: que
   alguien del equipo —o vos mismo— tome este 377 por una métrica y lo ponga en
   un deck, en una propuesta de sponsoreo o en una respuesta a un periodista.
   Ahí deja de ser una decisión de lanzamiento y pasa a ser un número falso en
   un documento comercial.

   Cuando exista el conteo de verdad, esto se borra y se reemplaza por la
   lectura del servidor. No hay nada más que migrar: es una constante. */
export const VOTANTES_SEMANA = 377
export const VOTOS_SEMANA = 1284

/* ── CUÁNTO MUEVE UN VOTO ────────────────────────────────────────────────

   Hasta acá el voto no tocaba el número: se guardaba y no pasaba nada. Ahora
   suma o resta puntos y la lista se reordena sola.

   Tres puntos por voto. El índice va de 4,2 a 96,4, pero cuarenta de las
   cuarenta y ocho personas están entre 7 y 20: ahí tres puntos son varios
   puestos y el ranking se mueve de verdad. Arriba casi no hace nada, y eso
   está bien — que cinco votos bajen al primero sería peor que no moverse.

   En producción esto se calcula en el servidor y el peso tiene que escalar con
   el volumen: con mil votantes, tres puntos por voto rompe la escala. Acá es
   una constante porque el que vota es uno solo. */
export const PESO_VOTO = 3

/** El índice con el voto de esta semana ya aplicado. */
export function conVoto(indice: number, voto?: 1 | -1): number {
  return voto === undefined ? indice : indice + voto * PESO_VOTO
}

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
