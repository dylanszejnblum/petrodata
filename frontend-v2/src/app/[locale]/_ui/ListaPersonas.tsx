'use client'

import { useMemo, useState } from 'react'
import { Icono } from './iconos'
import { LIMITE, useVotos } from './votos'
import type { Persona } from '@/fixtures/personas'
import { formatDecimal } from '@/lib/format'

/* LA LISTA DE PERSONALIDADES — el índice, y el voto por fila.

   El voto acá es una MAQUETA. En producción tiene que vivir en el servidor: el
   enunciado es «un voto por semana por IP», y eso no se puede sostener desde el
   navegador —quien vota puede borrar el storage y volver a votar—. Se guarda en
   localStorage para poder ver la interacción, y la card lo dice.

   Y conviene dejar escrito lo que una IP no resuelve, porque es la parte que se
   descubre tarde: una oficina, una universidad o una operadora móvil son miles
   de personas detrás de UNA IP, así que el límite semanal bloquea a todos menos
   al primero; y cualquiera con una VPN vota las veces que quiera. Sirve como
   fricción, no como control. Si el ranking va a significar algo, el voto
   necesita una cuenta.

   La semana arranca el lunes, que es lo que dice la cabecera. El identificador
   de semana se calcula del lado del cliente y con eso se descartan los votos
   viejos: sin eso, «se renueva cada lunes» sería una frase y no un
   comportamiento. */

export function ListaPersonas({ personas }: { personas: Persona[] }) {
  const { votos, votar, restantes } = useVotos()

  /* POSICIÓN CON EMPATES. Numerar 30, 31, 32… cuando dieciséis personas tienen
     el mismo 7,3 afirma un orden que el dato no tiene, y en un ranking donde
     cada uno se busca a sí mismo ese es el peor error posible: nadie acepta
     estar 44.º empatado con el 30.º. Se usa la numeración de competencia —los
     empatados comparten puesto y el siguiente salta— que es la convención de
     cualquier tabla deportiva. */
  const puestos = useMemo(() => {
    const m: Record<string, number> = {}
    let ultimo = 0
    personas.forEach((p, i) => {
      if (i === 0 || p.indice !== personas[i - 1].indice) ultimo = i + 1
      m[p.slug] = ultimo
    })
    return m
  }, [personas])

  const sinCredito = `Ya usaste tus ${LIMITE} votos de esta semana`
  const yaVoto = 'Ya votaste a esta persona; el voto no se edita hasta el lunes'

  return (
    <>
      {/* Los rótulos de columna. Sin ellos el número y los chevrones no se
          sabe qué son — el badge podía leerse como un precio o un porcentaje.
          Los anchos repiten los de la fila para que caigan a plomo. */}
      {/* La cabecera usa la MISMA grilla que la fila —.s-persona y .s-pcab
          comparten grid-template-columns— así que las columnas caen a plomo
          sin que nadie sincronice anchos a mano. Antes eran dos flex y la
          cabecera reservaba 100px para un voto que medía 98. */}
      <div className="s-pcab hidden sm:grid">
        <span />
        {/* «Persona» arranca en la FOTO y no en el nombre: la columna que
            rotula empieza ahí. Ocupando sólo la del nombre, el rótulo quedaba
            60px corrido a la derecha del bloque que describe. */}
        <span style={{ gridColumn: '2 / 4' }}>Persona</span>
        <span className="text-right">Puntos</span>
        <span className="text-center">Votación semanal</span>
      </div>
      {personas.map((p, i) => {
        const mio = votos[p.slug]
        const votado = mio !== undefined
        const agotado = !votado && restantes === 0
        const empata =
          (i > 0 && personas[i - 1].indice === p.indice) ||
          (i < personas.length - 1 && personas[i + 1].indice === p.indice)
        return (
          <div key={p.slug} className="s-persona">
            <span
              className="s-mono text-[11px]"
              style={{ color: 'var(--ink-3)' }}
              /* El «=» delante marca el empate. Es la notación de las tablas
                 de posiciones y ocupa un carácter, así que la columna no
                 cambia de ancho entre una fila y la siguiente. */
              title={empata ? 'Empatado en este puesto' : undefined}
            >
              {empata ? '=' : '\u00a0'}
              {String(puestos[p.slug]).padStart(2, '0')}
            </span>

            {/* La cara es un ancla de identidad, no una foto: 32px, que es lo
                que deja la fila en la altura del resto de las listas del sitio.
                Cuando no hay imagen cae al monograma, que es la misma pieza que
                usa la lista de empresas. */}
            <Cara slug={p.slug} nombre={p.nombre} />

            {/* Tres renglones —nombre, cargo, empresa— y no dos: 19,5 + 17,25
                + 17,25 llenan el alto de la foto de 60. En dos, la foto quedaba
                23px más alta que la columna que acompaña. */}
            <span className="flex min-w-0 flex-col justify-center">
              <span className="s-cuerpo flex items-center gap-1.5 font-medium">
                <span className="truncate">{p.nombre}</span>
                {/* El cargo sin confirmar se marca. Es más honesto que
                    esconderlo y que publicarlo como si estuviera verificado. */}
                {!p.confirmado && (
                  <span
                    className="s-chip s-chip--neutro s-chip--mini shrink-0"
                    title="El cargo lo sugiere una sola fuente y no está verificado"
                  >
                    sin confirmar
                  </span>
                )}
              </span>
              <span className="s-micro block truncate" style={{ color: 'var(--ink-2)' }}>
                {p.cargo || '—'}
              </span>
              {/* La empresa en ink-2 y no en ink-3: medido daba 2,72 en claro.
                  ink-3 es para metadata que nadie necesita leer —un número de
                  sección, una unidad— y qué empresa dirige esta persona es el
                  dato que sostiene toda la fila. Queda del mismo tono que el
                  cargo, que es correcto: los dos son el contexto del nombre. */}
              <span className="s-micro block truncate" style={{ color: 'var(--ink-2)' }}>
                {p.empresa}
              </span>
            </span>

            <span className="s-pcontrol">
            <span className="s-idx">{formatDecimal(p.indice, 1)}</span>

            {/* Sin el conteo (pedido de Mariano): quedan los dos chevrones. Lo
                único que se pierde es el número; el estado del voto propio se
                sigue viendo, porque el botón elegido queda con su tinte. */}
            <span className="s-voto">
              <span className="par">
                {/* Dos motivos para apagar un botón, y los dos se dicen en el
                    title: ya votaste a esta persona —el voto no se edita— o te
                    quedaste sin crédito. Dejarlos vivos y que el clic no haga
                    nada es peor: parece que se rompió. El elegido queda
                    apagado pero con su tinte, así se sigue viendo qué votaste. */}
                <button
                  type="button"
                  className="arriba"
                  aria-pressed={mio === 1}
                  aria-label={`Votar a favor de ${p.nombre}`}
                  disabled={votado || agotado}
                  title={votado ? yaVoto : agotado ? sinCredito : undefined}
                  onClick={() => votar(p.slug, 1)}
                >
                  <Icono d="M18 15l-6-6-6 6" size={13} grosor={2.4} />
                </button>
                <button
                  type="button"
                  className="abajo"
                  aria-pressed={mio === -1}
                  aria-label={`Votar en contra de ${p.nombre}`}
                  disabled={votado || agotado}
                  title={votado ? yaVoto : agotado ? sinCredito : undefined}
                  onClick={() => votar(p.slug, -1)}
                >
                  <Icono d="M6 9l6 6 6-6" size={13} grosor={2.4} />
                </button>
              </span>
            </span>
            </span>
          </div>
        )
      })}
    </>
  )
}

/** La cara, con caída al monograma. El `onError` es la caída de verdad: el
    archivo puede no estar —las imágenes no se versionan— y una cara rota es
    peor que dos iniciales. */
function Cara({ slug, nombre }: { slug: string; nombre: string }) {
  const [rota, setRota] = useState(false)
  const ini = nombre
    .split(' ')
    .filter(Boolean)
    .map((x) => x[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join('')
    .toUpperCase()

  if (rota) return <span className="s-cara s-cara--mono">{ini}</span>
  return (
    <img
      className="s-cara"
      src={`/images/ceos/${slug}.jpg`}
      alt=""
      width={200}
      height={200}
      loading="lazy"
      decoding="async"
      onError={() => setRota(true)}
    />
  )
}
