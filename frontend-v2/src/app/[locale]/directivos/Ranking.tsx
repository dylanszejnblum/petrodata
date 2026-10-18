import { Card, CardHead, CardPie, Seccion } from '../_ui/kit'
import { ListaPersonas } from '../_ui/ListaPersonas'
import { CabeceraVotos } from '../_ui/CabeceraVotos'
import { EstadoVoto } from '../_ui/EstadoVoto'
import { PATH } from '../_ui/iconos'
import { getTranslations } from 'next-intl/server'
import { loadDirectivos } from '@/lib/data/directivos'

/** El cuerpo de /directivos. Lo comparten la lista y la ficha compartible
    (/directivos/[slug]), que es la misma página con esa fila abierta. */
export async function Ranking({ locale, abierta }: { locale: string; abierta?: string }) {
  const t = await getTranslations({ locale, namespace: 'v2.directivos' })

  /* EL ÍNDICE Y EL ORDEN LOS DA EL BACKEND. La proyección que antes se hacía
     acá —para no serializar los componentes del índice y que no se despejaran
     los pesos— ahora es innecesaria: /api/v2/directivos manda el índice ya
     calculado y nunca sus tres partes. Los pesos no salen del servidor.

     QUIÉN TIENE CARA SIGUE RESOLVIÉNDOSE DEL LADO DEL SERVIDOR, que era lo
     importante: `photo_url` llega en null en dieciséis de las cuarenta y ocho
     y esa fila no pide ninguna imagen. Antes lo resolvía un existsSync contra
     public/images/ceos; ahora lo sabe el backend, que es el único que ve el
     bucket. Lo que evita es lo mismo de siempre: que la fila pida un archivo
     que no está y quede el ícono de imagen rota, porque el 404 puede llegar
     ANTES de que React hidrate y ahí el `onError` todavía no existe. */
  const { filas, votos, votantes, masVotados } = await loadDirectivos()

  /* SIN DATOS NO SE PUBLICA LA LISTA. Son personas con nombre y apellido en un
     ranking: si la API no responde, un fixture viejo diría quién dirige qué con
     un índice que ya no se corresponde con la producción. Es la única sección
     donde el fallback es peor que el hueco. */
  if (!filas.length) {
    return (
      <Seccion n="01" titulo={t('s01t')} desc={t('s01d')}>
        <Card>
          <CardPie>
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              {t('sinDatos')}
            </span>
          </CardPie>
        </Card>
      </Seccion>
    )
  }

  return (
    <>
      <Seccion n="01" titulo={t('s01t')} desc={t('s01d')}>
        <Card>
          <CardHead
            titulo={t('cardRanking')}
            /* `lista`: tres líneas que decrecen. Es la forma de una tabla de
               posiciones y se entiende sin leyenda. `ordenar` parecía el
               candidato pero su geometría termina en un «+» —es el control de
               agregar un criterio de orden— y acá no hay nada que agregar.
               Los dos estaban en el catálogo sin usar, así que ninguno le pisa
               el significado a otro ícono de la web. */
            icono={PATH.lista}
            /* Las cifras cuelgan del rótulo y los chips ocupan la nota
               (pedido de Mariano, 2026-09-02). El rótulo dice qué es la card y
               el renglón de abajo dice de qué tamaño: «El ranking» y, debajo,
               cuánta gente lo votó. Los dos chips son estado —el presupuesto
               de quien mira y el reloj del corte— y cierran contra el borde
               derecho, que es donde el sistema pone lo que no se lee de
               corrido. */
            sub={<CabeceraVotos votos={votos} personas={votantes} />}
            /* Los dos números son el COUNT de la semana que devuelve
               /api/v2/directivos. Antes estaban escritos a mano —377 y 1.284—
               con una advertencia de que alguien iba a citarlos en un deck. */
            nota={<EstadoVoto />}
          />
          {/* LOS MÁS VOTADOS, con el conteo real de la semana. Es lo que se
              comparte —a quién le está yendo bien— y por eso nombra personas.
              Sin votos a favor no hay renglón: «nadie» no es un dato. */}
          {masVotados.length > 0 && (
            <div
              className="s-micro flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-2)' }}
            >
              <span>{t('masVotados')}</span>
              {masVotados.map((m, i) => (
                <span key={m.slug} className="flex items-baseline gap-1.5">
                  <b className="s-mono text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
                    {i + 1}
                  </b>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>
                    {m.nombre}
                  </span>
                  <span className="s-mono">{m.votos.toLocaleString(locale === 'en' ? 'en-US' : 'es-AR')}</span>
                </span>
              ))}
            </div>
          )}
          <ListaPersonas personas={filas} abierta={abierta} />
          <CardPie>
            {/* La ponderación NO se publica (pedido de Mariano, 2026-09-01: «el
                algo del ranking tiene que ser secreto, se puede explicar por
                arriba que es lo que se tiene en cuenta»). Acá van los tres
                insumos por su nombre y nada más: ni los pesos ni cómo se
                combinan.

                Queda una sola frase de las que había en los pies, y es la que
                no conviene perder: que el número es de la EMPRESA. Es un
                ranking de personas con nombre y apellido calculado con cifras
                que no son de ellas, y decirlo cuesta un renglón. */}
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              {t.rich('pie', { b: (c) => <b className="font-semibold">{c}</b> })}
            </span>
          </CardPie>
        </Card>
      </Seccion>
    </>
  )
}
