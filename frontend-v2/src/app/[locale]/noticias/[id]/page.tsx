import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { Card, CardPie, FilaNoticia, Seccion, Tag, colorCategoria } from '../../_ui/kit'
import { Compartir } from '../../_ui/BloquesNota'
import { CATEGORY_LABEL } from '@/fixtures/news'
import { loadNewsDoc } from '@/lib/data/news'
import { formatDate } from '@/lib/format'
import { siteMetadata } from '@/lib/metadata'

/* LA NOTA — el cuerpo del artículo, rederivado.

   Lo que había en la ruta vieja: hero con foto, entradilla, caja de puntos
   clave, cinco párrafos con una cita en el medio, un rail derecho con video y
   un espacio publicitario, y tres relacionadas en cards con foto.

   Lo que cambia y por qué:

   · SE VA EL RAIL. No es una decisión de gusto: la columna de contenido del
     sistema mide 672 y el rail de la ruta vieja necesita 336 más el cuerpo en
     44rem, o sea unos 1.040. No entra. El video —cuando la nota lo trae— sube
     al cuerpo, que es donde ya iba en móvil.

   · SE VA EL ESPACIO PUBLICITARIO. Era un rectángulo gris de 336×280 con la
     palabra «publicidad». En un prototipo de sistema no mide nada: no hay
     ninguna decisión de diseño ahí que verificar.

   · SE VA LA CIFRA DESTACADA. La puse mostrando cuántas notas del mismo tema
     hay en la portada, para no inventar un número — y el resultado fue un
     bloque de cifra que hablaba del CORPUS y no de la noticia. En una cifra
     destacada el lector espera el número de la nota, y acá no hay ninguno
     marcado en el dato: el fixture trae título, resumen, fuente, fecha,
     categoría y minutos. Un bloque cuya función el lector no puede adivinar no
     cumple ninguna. Vuelve el día que el pipeline marque una cifra.

   · SE VA LA CITA DESTACADA. La elegía un buscador de oraciones que prefería
     la que tuviera un número, y con el cuerpo simulado eso daba relleno: en
     media docena de notas eligió «En los despachos de Shale24 y de las
     operadoras de la cuenca, la lectura es la misma» —el «número» es el 24 de
     la marca— o cayó al título. Una cita destacada existe para levantar UNA
     frase real de un artículo real; sin artículo real no levanta nada, y es
     decoración con forma de énfasis editorial. Vuelve el día que el pipeline
     traiga el cuerpo.

   · LAS RELACIONADAS PASAN DE CARDS A FILAS. Es la misma fila que el listado
     y el dashboard. Tres tratamientos para una noticia era el problema que ya
     se arregló en el listado; traer las cards de vuelta acá lo reabría.

   SIN CUERPO SIMULADO. Antes se generaban párrafos, una cita y puntos clave
   atribuidos a la fuente; en producción eso es inventar una nota con la firma
   de un medio real. Va el resumen, el texto completo sólo si el pipeline lo
   trae, y el link al original. */

type Params = Promise<{ id: string; locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale } = await params
  const doc = await loadNewsDoc(id)
  const title = doc?.item.title ?? 'Noticia'
  return {
    ...siteMetadata(locale, `/noticias/${id}`, doc?.item.summary || undefined, title),
    title,
  }
}

export const dynamic = 'force-dynamic'

export default async function V2Nota({ params }: { params: Params }) {
  const { id } = await params
  /* Doc real del backend (título, resumen, fuente, fecha, categoría, tiempo
     de lectura); si no está, fixture. */
  const doc = await loadNewsDoc(id)
  if (!doc) notFound()
  const { item, related } = doc

  const rot = CATEGORY_LABEL[item.category]
  const color = colorCategoria(item.category)
  const parrafos = (item.body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  /* Primero las del mismo tema/cluster (backend) o categoría (fixture), y
     después cualquier otra, para que siempre haya tres. */
  const mismasCat = related.filter((n) => n.id !== item.id && n.category === item.category)
  const resto = related.filter((n) => n.id !== item.id && n.category !== item.category)
  const relacionadas = [...mismasCat, ...resto].slice(0, 3)

  return (
    <>
      {/* La nota NO va numerada. La plantilla del sistema numera secciones
          porque una página es una lista de secciones; acá la página es UNA
          cosa y el número diría «01 de 1». Las relacionadas sí, porque ahí
          vuelve a haber una sección. */}
      <section className="s-seccion s-seccion--lectura">
        <div className="s-marco">
          <nav aria-label="Miga de pan" className="mb-3">
            <Link href="/noticias" className="s-pill">
              <span aria-hidden>←</span> Noticias
            </Link>
          </nav>

          <Card>
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch">
              {/* La misma placa de 161 que la destacada del listado: una nota
                  no cambia de identidad visual por estar abierta. */}
              <span
                className="s-placa s-placa--grande shrink-0 overflow-hidden"
                style={{ padding: 0 }}
                aria-hidden
              >
                <img
                  src={item.image ?? '/images/news/news-produccion-rig.jpg'}
                  alt=""
                  width={640}
                  height={640}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(1) contrast(0.9)',
                  }}
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="mb-1.5 flex items-center gap-2">
                  <Tag color={color}>{rot}</Tag>
                  <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
                    {item.date}
                  </span>
                </span>
                {/* 21/600, que es .s-titular: el sistema lo reserva para el
                    título de la página y el titular de una nota ES el título
                    de la página. Es el único 21 de todo v2. */}
                <h1 className="s-titular m-0">{item.title}</h1>
                <span
                  className="s-micro mt-auto flex flex-wrap items-center gap-1.5 pt-2"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {item.source}
                  {item.readingMin ? (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>·</span>
                      {item.readingMin} min de lectura
                    </>
                  ) : null}
                </span>
              </span>
            </div>
            {/* Compartir va en el pie de card y no sobre la foto como en la
                ruta vieja: allá el hero era una foto a sangre con velo oscuro y
                los círculos iban en blanco translúcido. Acá la cabecera es una
                card clara, así que los botones toman el anillo de botón del
                sistema y se apoyan junto al resto de los metadatos. */}
            <CardPie>
              <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                Compartir
              </span>
              <span className="ml-auto">
                <Compartir titulo={item.title} id={item.id} />
              </span>
            </CardPie>
          </Card>

          <div className="s-prosa mt-4">
            {item.summary && <p className="entrada">{item.summary}</p>}
            {parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="s-card mt-4">
            <div className="s-pie-card" style={{ borderTop: 0 }}>
              <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                {item.source} · {formatDate(item.date)}
              </span>
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="s-pill ml-auto"
                >
                  Leer en {item.source} <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {relacionadas.length > 0 && (
        <Seccion
          n="01"
          titulo="Relacionadas"
          desc={`Otras notas de ${rot.toLowerCase()}.`}
          ancho="lectura"
        >
          <Card>
            {relacionadas.map((n) => (
              <FilaNoticia
                key={n.id}
                id={n.id}
                href={`/noticias/${n.id}`}
                titulo={n.title}
                fuente={n.source}
                fecha={n.date}
                categoria={n.category}
                rotulo={CATEGORY_LABEL[n.category]}
                minutos={n.readingMin}
                imagen={n.image}
              />
            ))}
          </Card>
        </Seccion>
      )}
    </>
  )
}
