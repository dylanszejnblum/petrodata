'use client'

import { useEffect, useState } from 'react'
import { Icono, PATH } from './iconos'
import { LIMITE, proximoCorte } from './voto-reglas'
import { useVotos } from './votos'

/* LOS DOS CHIPS DE ESTADO, en la segunda línea de la cabecera (pedido de
   Mariano, 2026-09-02).

   Son la misma pieza dos veces y por eso comparten renglón: .s-chip--mini con
   ícono y una cifra en mono. El del corte ya estaba armado así y era el que se
   veía bien; el del presupuesto lo copia en vez de inventar una segunda forma
   de decir lo mismo.

   SIN RIEL (pedido de Mariano, 2026-09-02). Los dos lo tenían y en los dos
   sobraba: la cifra que va al lado ya dice lo mismo con más precisión —«4» y
   «13 h 37 min»— y una barra de 28px que repite un número exacto es adorno.

   VAN APILADOS Y A LA DERECHA, ocupando la nota de la card (pedido de Mariano,
   2026-09-02). Los dos son estado —cuánto te queda y cuánto falta para el
   corte— y ninguno se lee de corrido, así que cierran contra el borde en vez de
   competir con el rótulo.

   Uno debajo del otro y no en fila: apilados, los dos terminan en el mismo eje
   derecho y se leen como una columna de estado. En fila, el ancho del primero
   corría al segundo cada vez que el número cambiaba de dígito.

   EL CHEVRÓN DEL PRESUPUESTO es el mismo path que el botón de votar a favor de
   cada fila. Un ícono que ya significa «voto» en esta pantalla dice de qué son
   los que quedan sin tener que rotularlo dos veces.

   POR QUÉ NO VAN EN LA NOTA. La nota de la card describe la CARD —cuántos
   votaron, cuánta gente— y estos dos describen el estado del voto: uno es de
   quien mira y el otro es del reloj. Colgados del rótulo dicen de qué hablan.

   El presupuesto sale del storage: en el servidor son cinco y el gastado
   aparece al hidratar. `useVotos` tiene su snapshot de servidor para que el
   HTML servido y el primer render coincidan. */
export function EstadoVoto() {
  const { restantes } = useVotos()
  const [corte, setCorte] = useState<string | null>(null)

  useEffect(() => {
    const tic = () => {
      const falta = Math.max(0, proximoCorte().getTime() - Date.now())
      const h = Math.floor(falta / 3_600_000)
      const m = Math.floor((falta % 3_600_000) / 60_000)
      setCorte(h > 0 ? `${h} h ${m} min` : `${m} min`)
    }
    tic()
    const id = setInterval(tic, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span
        className="s-chip s-chip--neutro s-chip--mini"
        title={`${restantes} de ${LIMITE} votos. Se renuevan el lunes.`}
      >
        <Icono d="M18 15l-6-6-6 6" size={11} grosor={2.2} />
        Votos disponibles{' '}
        {/* tabular-nums aunque sea un dígito: al bajar de 5 a 4 el ancho no
            cambia y el chip de al lado no se corre. */}
        <span className="s-mono">{restantes}</span>
      </span>

      {/* El chip del corte aparece recién con el reloj del cliente: en el
          servidor no hay hora del visitante y pintarlo haría que el primer
          render no coincida con el HTML servido. */}
      {corte && (
        <span
          className="s-chip s-chip--neutro s-chip--mini"
          title="El orden del ranking se recalcula una vez por día"
        >
          <Icono d={PATH.reloj} size={11} grosor={2.2} />
          {/* Sin estas dos palabras el chip es un reloj y una hora: nadie sabe
              qué pasa dentro de 13 horas. */}
          se actualiza en <span className="s-mono">{corte}</span>
        </span>
      )}
    </span>
  )
}
