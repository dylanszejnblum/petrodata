'use client'

import { LIMITE, useVotos } from './votos'
import { formatInteger } from '@/lib/format'

/* EL PANEL DEL VOTO — tu presupuesto y la actividad de la semana, como tres
   figuras en fila. Es la opción 2 de indice-voto-propuestas.html.

   Lee el MISMO store que la lista de la sección 02: al votar allá abajo, el
   crédito de acá arriba baja en el mismo frame.

   QUÉ ES REAL Y QUÉ NO. El presupuesto sale del storage del navegador y es tu
   voto de esta semana. Las otras dos figuras sólo puede darlas el servidor y
   acá son inventadas. Llevaban un chip «simulado» que Mariano pidió sacar; la
   aclaración no se pierde, baja al pie de la sección, que es donde el sistema
   pone lo que califica a la sección entera. Conviene que quede escrito: si el
   pie se recorta, estos dos números pasan a leerse como ciertos. */

/* Actividad simulada de la semana. Los números son coherentes entre sí: 1.284
   votos sobre 377 personas dan 3,4 por cabeza, que es lo esperable con un tope
   de 5 —casi nadie usa todos—, y los tres primeros suman 543, o sea el 42% de
   todos los votos, que es la concentración típica de cualquier ranking con
   voto abierto.

   LOS TRES MÁS VOTADOS NO SON LOS TRES PRIMEROS DEL ÍNDICE, y está hecho a
   propósito: por índice van Marín, Galuccio y Vila. Si el voto devolviera el
   mismo orden que el algoritmo, la columna no diría nada —sería el ranking
   contado dos veces— y el voto no tendría para qué existir. Que difieran es
   justamente lo que hace que valga la pena votar, y lo que le da a alguien un
   motivo para pedirle a los suyos que lo voten. */
const VOTOS_SEMANA = 1_284
const PERSONAS_SEMANA = 377
const MAS_VOTADOS = [
  { nombre: 'Galuccio', votos: 218 },
  { nombre: 'Simonato', votos: 174 },
  { nombre: 'Markous', votos: 151 },
]

export function PanelVoto({ total }: { total: number }) {
  const { usados, restantes } = useVotos()

  return (
    <div className="s-pvoto">
      {/* TU PRESUPUESTO. Es el único dato real del bloque y el único accionable,
          así que se lleva el 21 —.s-titular— y las otras dos van en 17. El
          sistema reserva el 21 para el título de página, uno por página; acá la
          página no tiene otro, y usarlo dos veces en la misma card, como estaba
          en la propuesta, sí habría sido de más. */}
      <div className="s-pvoto-col">
        <span className="s-micro flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
          <i
            aria-hidden
            className="block size-2 shrink-0 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
          Te quedan
        </span>
        <span className="mt-0.5 flex items-baseline gap-1.5">
          <b className="s-titular">{restantes}</b>
          <span className="s-micro" style={{ color: 'var(--ink-3)' }}>
            {restantes === 1 ? 'voto esta semana' : 'votos esta semana'}
          </span>
        </span>
        {/* Un punto por voto: cinco marcas se cuentan de un vistazo y un «3 de
            5» hay que leerlo. */}
        <span className="s-creditos mt-2" aria-hidden>
          {Array.from({ length: LIMITE }, (_, i) => (
            <i key={i} className={i < usados ? 'usado' : undefined} />
          ))}
        </span>
      </div>

      <div className="s-pvoto-col">
        <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>
          Van esta semana
        </span>
        <span className="mt-0.5 flex items-baseline gap-1.5">
          <b className="s-cifra">{formatInteger(VOTOS_SEMANA)}</b>
          <span className="s-micro" style={{ color: 'var(--ink-3)' }}>
            votos
          </span>
        </span>
        <span className="s-micro mt-2 block" style={{ color: 'var(--ink-2)' }}>
          de {formatInteger(PERSONAS_SEMANA)} personas
        </span>
      </div>

      {/* LA TERCERA MÉTRICA: los tres más votados de la semana (elección de
          Mariano). Es la única de las tres que nombra PERSONAS, y ahí está su
          valor: las otras dos miden el volumen de la participación y ésta dice
          a quién le fue bien. Es lo que se comparte y lo que le da a alguien un
          motivo para pedir votos.

          Van los apellidos y no el nombre completo: la columna mide unos 170px
          y «Horacio Daniel Marín» no entra sin cortarse. En una tabla de
          posiciones el apellido alcanza. */}
      <div className="s-pvoto-col">
        <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>
          Más votados
        </span>
        <span className="mt-1 block">
          {MAS_VOTADOS.map((m, i) => (
            <span key={m.nombre} className="s-mvotado">
              <b className="s-mono shrink-0 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
                {i + 1}
              </b>
              <span className="s-cuerpo min-w-0 flex-1 truncate font-medium">{m.nombre}</span>
              <span className="s-num shrink-0 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                {formatInteger(m.votos)}
              </span>
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
