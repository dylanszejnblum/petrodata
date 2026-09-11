'use client'

import { useEffect, useRef, useState } from 'react'
import { Icono, PATH } from './iconos'

/* AVISAR QUE UN DATO ESTÁ MAL.

   Reemplaza al renglón «Fuente» de la ficha. El link a la fuente era la prueba
   de que el cargo se verificó, pero dieciocho de los cuarenta y ocho no tienen
   —y de los que tienen, varios salen de registros de 2018—. Mostrarlo sólo en
   algunas filas marcaba justamente lo que Mariano pidió no marcar cuando se
   sacó el chip de «sin confirmar». El canal de corrección lo reemplaza y sirve
   para las cuarenta y ocho por igual.

   ES UN <dialog> NATIVO. Trae el foco atrapado, el cierre con Escape y el
   ::backdrop sin una línea de JS ni una librería, que es lo que pide la §7:
   movimiento en CSS y nada más.

   EL CORREO ES OBLIGATORIO (pedido de Mariano). No es una traba de formulario:
   un reporte de «el cargo de fulano está mal» sin forma de repreguntar no se
   puede verificar, y verificar es todo el trabajo de esta sección. Por eso el
   botón nace apagado y sólo se enciende con las dos cosas cargadas.

   LA VOZ, §8. Rótulos sustantivos y sin segunda persona, como todo el resto
   del sitio —El ranking, La lista, Operadores principales—. La primera versión
   de esta pieza tenía «Avisanos», «Contanos» y «Tu correo», y eran las únicas
   formas en segunda persona de todo v2.

   ⚠️ TODAVÍA NO SE ENVÍA A NINGUNA PARTE. Falta el destino: un endpoint o una
   casilla. Hasta que exista, el aviso se guarda en localStorage y nada sale
   del navegador —igual que el voto, y por la misma razón: se puede ver la
   interacción sin inventar un backend—. Con una dirección esto se resuelve en
   una línea, cambiando el `guardar` por un mailto o un fetch. Antes de
   publicar TIENE que estar conectado: un canal de correcciones que no llega a
   nadie es peor que no ofrecerlo. */

const CLAVE = 'v2-directivos-avisos'

/** Suficiente para descartar un tipeo, sin pretender validar que exista. */
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function AvisoDato({ nombre, empresa }: { nombre: string; empresa: string }) {
  const [abierto, setAbierto] = useState(false)
  const [correo, setCorreo] = useState('')
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  /* showModal() y no el atributo `open`: es lo único que activa el backdrop y
     el foco atrapado. Por eso el estado abre el diálogo con un efecto en vez
     de renderizarlo condicionalmente. */
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  const valido = CORREO_OK.test(correo.trim()) && texto.trim().length > 0

  function cerrar() {
    setAbierto(false)
    /* Se limpia al cerrar, no al enviar: si el envío falla y el diálogo sigue
       abierto, lo escrito tiene que seguir ahí. */
    setTimeout(() => {
      setEnviado(false)
      setCorreo('')
      setTexto('')
    }, 200)
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return
    try {
      const previos = JSON.parse(localStorage.getItem(CLAVE) || '[]')
      previos.push({
        persona: nombre,
        empresa,
        correo: correo.trim(),
        texto: texto.trim(),
        cuando: new Date().toISOString(),
      })
      localStorage.setItem(CLAVE, JSON.stringify(previos))
    } catch {
      /* storage bloqueado: el aviso se pierde, y hoy se perdería igual */
    }
    setEnviado(true)
  }

  return (
    <>
      {/* NO ES UN PILL. .s-pill se usa tres veces en v2 y las tres son
          navegación —«Ver todas las noticias», «Volver»—; la §6.3 lo define
          como «el llamado a la acción más fuerte del sistema», y reportar un
          dato no lo es. Encima mide 28 de alto dentro de un renglón de 27.

          Es la gramática de acción en línea que el sitio ya usa —.s-micro en
          --accent-ink, como «Leer →» en noticias y «Ver el mapa →» en el
          minimapa— sin la flecha, que ahí significa «vas a otra pantalla» y acá
          no se va a ninguna. El acento es para enlaces, §3.

          El ícono a 11 con trazo 2,2: la tabla de la §1.3 compensa el trazo en
          las cajas chicas para que no se adelgace a menos de un píxel. */}
      <button
        type="button"
        className="s-accion"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto(true)
        }}
      >
        <Icono d={PATH.info} size={11} grosor={2.2} />
        Reportar
      </button>

      <dialog
        ref={ref}
        className="s-modal"
        onClose={cerrar}
        /* El clic en el backdrop cae en el propio <dialog>, no en su
           contenido: comparando el objetivo se cierra sin envolver todo en una
           capa extra. Y se corta la propagación para que no llegue a la fila,
           que abre y cierra la ficha. */
        onClick={(e) => {
          e.stopPropagation()
          if (e.target === ref.current) cerrar()
        }}
      >
        <form onSubmit={enviar}>
          <div className="s-barra-card">
            {/* Ícono + rótulo, la misma ranura que CardHead: si una card lleva
                ícono en la cabecera, todas tienen que poder. 14 con trazo 2,
                que es lo que usa CardHead. */}
            <span className="s-titulo flex items-center gap-1.5">
              <Icono
                d={enviado ? PATH.tilde : PATH.info}
                size={14}
                grosor={2}
                className="shrink-0"
                style={{ color: enviado ? 'var(--green)' : 'var(--ink-3)' }}
              />
              {enviado ? 'Reporte enviado' : 'Reportar dato'}
            </span>
            <button type="button" className="s-modal-x" onClick={cerrar} aria-label="Cerrar">
              <Icono d={PATH.cerrar} size={14} grosor={2} />
            </button>
          </div>

          {enviado ? (
            <p className="s-modal-desc s-cuerpo" style={{ color: 'var(--ink-2)' }}>
              Reporte sobre <b style={{ color: 'var(--ink)' }}>{nombre}</b> registrado.
              Respuesta a <span className="s-mono">{correo.trim()}</span>.
            </p>
          ) : (
            <>
              {/* §8.2: la descripción explica el MECANISMO y no le habla al
                  lector. Se lleva adentro para qué sirve el correo, que antes
                  era un renglón de ayuda aparte debajo del campo. */}
              <p className="s-modal-desc s-desc">
                Corrección sobre el cargo, el nombre o la foto de{' '}
                <b style={{ color: 'var(--ink)' }}>{nombre}</b>, de {empresa}
                {empresa.endsWith('.') ? '' : '.'} El correo queda para responder el reporte.
              </p>

              {/* Cada campo es una FILA con su rótulo a la izquierda: la misma
                  gramática de .s-ficha-fila, que es la ficha desde donde se abre
                  este diálogo. Sin cajas, sin etiquetas flotando arriba y sin
                  aire entre bloques: lo que separa es el filete. */}
              <label className="s-fcampo">
                <span className="rot">Correo</span>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  required
                />
              </label>

              {/* El detalle usa la misma fila; lo único que cambia es que el
                  control crece. Alineado arriba para que el rótulo quede a la
                  altura del primer renglón y no centrado contra tres. */}
              <label className="s-fcampo" style={{ alignItems: 'flex-start' }}>
                <span className="rot">Detalle</span>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  placeholder="Dejó el cargo en marzo. El actual es…"
                  required
                />
              </label>
            </>
          )}

          <div className="s-pie-card s-modal-pie">
            {/* El que confirma tiene CUERPO —.s-boton: fondo --field y anillo,
                radio 8 por su altura de 28— y el que sale es texto. Como texto
                los dos, medían 5,5 de contraste cada uno: misma presencia y
                ninguna jerarquía. No es el pill: ése va a radio 999 y la §6.3
                lo reserva para navegar. */}
            {enviado ? (
              <button type="button" className="s-boton ml-auto" onClick={cerrar}>
                Cerrar
              </button>
            ) : (
              <>
                <button type="button" className="s-modal-cancel" onClick={cerrar}>
                  Cancelar
                </button>
                {/* Apagado hasta que haya correo Y detalle. Pierde el acento y
                    baja a ink-2: se lee inactivo sin volverse ilegible, que es
                    lo que pasaba con opacidad —2,41 de contraste—. El title
                    dice qué falta, porque un control que no responde y no
                    explica por qué se lee como roto. */}
                <button
                  type="submit"
                  className="s-boton"
                  disabled={!valido}
                  title={valido ? undefined : 'Correo y detalle requeridos'}
                >
                  Enviar
                </button>
              </>
            )}
          </div>
        </form>
      </dialog>
    </>
  )
}
