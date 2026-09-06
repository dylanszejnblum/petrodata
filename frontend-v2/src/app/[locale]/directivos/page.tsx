import { Card, CardHead, CardPie, Seccion } from '../_ui/kit'
import { ListaPersonas } from '../_ui/ListaPersonas'
import { CabeceraVotos } from '../_ui/CabeceraVotos'
import { EstadoVoto } from '../_ui/EstadoVoto'
import { PATH } from '../_ui/iconos'
import { getTranslations } from 'next-intl/server'
import { loadDirectivos } from '@/lib/data/directivos'

/* DIRECTIVOS — quién dirige la cuenca, ordenado por un índice.

   La sección sale de CEOS/, el pipeline que busca y confirma al CEO actual de
   las 50 primeras empresas del sitio. Cruzan 48 con el ranking de COMPANIES.

   LA DECISIÓN DE FONDO, y conviene que esté escrita porque condiciona todo lo
   demás: no hay ninguna métrica de la PERSONA en el dato. El pipeline trae
   nombre, cargo y fuente. Así que el índice es de la EMPRESA, atribuido a quien
   la dirige, y la página lo dice en el pie de la card. Cualquier otra lectura
   sería inventarle a una persona real un número que nadie midió.

   LA PONDERACIÓN NO SE PUBLICA (pedido de Mariano, 2026-09-01). El pie nombra
   los tres insumos y nada más. Que eso sea cierto no depende de la prosa sino
   de qué se serializa: ver `PersonaFila` en fixtures/personas.ts.

   LA CARD 01 —la que explicaba el índice y mostraba el presupuesto de votos—
   ESTÁ SACADA (pedido de Mariano, 2026-09-01: «por ahora saquemos esta card,
   dejemos solo la lista»). PanelVoto.tsx y su CSS quedan en el repo sin
   importar desde ningún lado, porque «por ahora» no es «nunca» y volver a
   colgarlo es una línea.

   Lo que se pierde con la card y hay que tener presente: el contador de votos
   restantes ya no se ve en ninguna parte. La mecánica sigue funcionando —los
   chevrones se deshabilitan solos al quinto voto y el title dice por qué— pero
   el que llega al límite se entera recién cuando un botón deja de responder.
   La regla queda dicha en la nota de la cabecera, que es estática.

   Una cosa que queda pendiente de decisión y no de código:

   · LAS CARAS ESTÁN GENERADAS CON IA. Salen de CEOS/data/headshots/, que las
     produce con Higgsfield desde una foto real y el prompt «Recreate this exact
     person as a professional corporate executive cover portrait». Son
     fotorrealistas, sin marca de agua, de personas con nombre y apellido. Están
     en public/images/ceos para poder ver la maqueta —se versionan desde el
     2026-09-01, ver el .gitignore de esa carpeta—. La lista cae al monograma
     sola si el archivo no está, así que publicar sin resolver la foto ya
     funciona.

   EL VOTO YA NO ES UNA MAQUETA: vive en /api/v2/directivos/:slug/voto, con el
   presupuesto semanal y el corte diario del lado del servidor. Lo que sigue
   siendo cierto es la advertencia del pie: una IP no es una persona —una
   oficina o una operadora móvil son miles detrás de una sola— y cualquiera con
   VPN vota lo que quiera. */

/* Las otras seis páginas con datos declaran su revalidate acá; ésta no lo hacía
   y el `next: { revalidate: 300 }` del fetch no alcanza para levantar la ruta:
   salía del build como estática pura —la tabla de `next build` la listaba sin
   ventana— y el ranking y los contadores de votos quedaban congelados en el
   momento del deploy. Votar seguía escribiendo en la base; lo que no cambiaba
   era la página. */
export const revalidate = 300

export default async function V2Directivos({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
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
  const { filas, votos, votantes } = await loadDirectivos()

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
          <ListaPersonas personas={filas} />
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
              <b className="font-semibold">Puntos</b> combina lo que maneja cada uno —cuánto
              produce su empresa, cuánto saca por pozo, cuánto vale lo que produce— con los
              votos. El orden se recalcula una vez por día: tu voto de hoy entra en el próximo
              corte, y la flecha al lado del puesto dice cuántos lugares se movió cada uno.
            </span>
          </CardPie>
        </Card>
      </Seccion>
    </>
  )
}
