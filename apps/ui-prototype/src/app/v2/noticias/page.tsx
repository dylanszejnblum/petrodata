import Link from 'next/link'
import { Card, FilaNoticia, Pie, Seccion, Tag, colorCategoria, recorte } from '../_ui/kit'
import { ListaNoticias, type FilaNota } from '../_ui/ListaNoticias'
import { CATEGORY_LABEL, FILTER_CATEGORIES, NEWS, TOTAL_DOCS } from '@/fixtures/news'
import { formatInteger } from '@/lib/format'

/* NOTICIAS — el caso donde más se aparta de lo que teníamos.

   Estrato usa cards con foto en grilla; este sistema resuelve las listas con
   filas densas y trata la imagen como accesorio. Acá la foto se queda pero
   como miniatura de 56 —el ancla visual de la fila— y sólo la destacada la
   muestra grande.

   REESCRITA (2026-08-21). Lo que había era una lista plana de veinte filas
   más una sección de conteos que no hacía nada. Cuatro cosas:

   · Las categorías salían EN CRUDO: «financiamiento», «exportacion», «rigi»,
     en minúscula y sin acentos. CATEGORY_LABEL vive en este mismo fixture, lo
     usa toda la ruta v1, y en v2 no se usaba en ningún lado. Es el mismo
     patrón que los YoY de la tesis y el ranking mundial.

   · «20 notas» mentía por omisión. TOTAL_DOCS = 790 también estaba en el
     fixture: el corpus real son 790 documentos y acá hay una portada de veinte.
     Ahora lo dice.

   · No había forma de filtrar ni de buscar, con la Filter Table ya construida
     dos secciones más allá, en empresas. Y FILTER_CATEGORIES —la declaración
     del fixture de cuáles son filtrables— tampoco se usaba.

   · No había destacada, con `featured: true` marcado en el fixture. */

export default function V2Noticias() {
  const orden = NEWS.slice().sort((a, b) => b.date.localeCompare(a.date))
  const destacada = orden.find((n) => n.featured) ?? orden[0]
  /* Las cuatro que acompañan a la destacada, y después TODAS en la lista de
     abajo, incluida la destacada: la lista es el índice completo del período,
     no «lo que sobró». */
  const acompanan = orden.filter((n) => n.id !== destacada.id).slice(0, 4)

  const filas: FilaNota[] = orden.map((n) => ({
    id: n.id,
    titulo: n.title,
    resumen: n.summary,
    fuente: n.source,
    fecha: n.date,
    cat: n.category,
    rot: CATEGORY_LABEL[n.category],
    minutos: n.readingMin,
    imagen: n.image,
  }))
  const pills = FILTER_CATEGORIES.map((c) => ({ id: c, rot: CATEGORY_LABEL[c] }))

  const desde = orden[orden.length - 1].date
  const hasta = orden[0].date

  return (
    <>
      {/* Sin bajada: «Destacadas» ya dice qué son estas cinco, y la que
          había —«La nota destacada del período, y las cuatro que le
          siguen»— era el título contado de nuevo. */}
      <Seccion n="01" titulo="Destacadas">
        <Card>
          <Link
            href={`/v2/noticias/${destacada.id}`}
            className="flex items-stretch gap-3 p-3 no-underline"
            style={{ color: 'inherit' }}
          >
            {/* 161 de lado, la misma placa que la card de empresa. La foto de
                la destacada es lo único grande de la página: en las filas es
                una miniatura de 56 porque ahí sólo ancla, y acá tiene que
                sostener el peso de ser la primera. En 375 baja a 88, como la
                placa. */}
            <span
              className="s-placa s-placa--grande shrink-0 overflow-hidden"
              /* padding inline y no p-0: la clase de Tailwind y .s-placa tienen
                 la misma especificidad y quién gana depende del orden del CSS
                 compilado. La placa lleva 12px para respirar alrededor de un
                 logo; una foto tiene que llegar al borde. */
              style={{ padding: 0 }}
              aria-hidden
            >
              <img
                src={destacada.image ?? `/images/news/news-produccion-rig.jpg`}
                alt=""
                width={640}
                height={640}
                /* Ancho y alto INLINE: `.s-placa > img` fija width:auto,
                   height:auto y object-fit:contain —está pensada para un logo,
                   que no se estira— y esa regla le gana a las clases w-full /
                   h-full por especificidad. Con las clases, la foto salía
                   apaisada de 325×220 en una placa cuadrada de 161. */
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
                <Tag color={colorCategoria(destacada.category)}>
                  {CATEGORY_LABEL[destacada.category]}
                </Tag>
                <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
                  {destacada.date}
                </span>
              </span>
              <span className="s-titulo" style={recorte(2, 19.5)}>
                {destacada.title}
              </span>
              <span className="s-desc mt-1" style={recorte(3, 18.75)}>
                {destacada.summary}
              </span>
              {/* mt-auto: la fuente se apoya en el pie de la placa, así el
                  bloque de texto ocupa el alto de la imagen. Es lo mismo que
                  hace la card de empresa. */}
              <span
                className="s-micro mt-auto flex items-center gap-1.5 pt-2"
                style={{ color: 'var(--ink-2)' }}
              >
                {destacada.source}
                {destacada.readingMin ? (
                  <>
                    <span style={{ color: 'var(--ink-3)' }}>·</span>
                    {destacada.readingMin} min
                  </>
                ) : null}
                <span className="ml-auto" style={{ color: 'var(--accent-ink)' }}>
                  Leer <span aria-hidden>→</span>
                </span>
              </span>
            </span>
          </Link>
        </Card>

        <Card className="mt-3">
          {/* Las cuatro que siguen usan la MISMA fila que la lista de abajo y
              con su foto (pedido de Mariano, 2026-08-21). Antes iban peladas
              —tag, título y fecha— con el argumento de que eran el contexto de
              la destacada; el costo era que la página tenía tres tratamientos
              distintos para una noticia. Ahora son dos: la destacada y la
              fila. Sin resumen, así la foto queda en 60 y no compite con los
              161 de la destacada. */}
          {acompanan.map((n) => (
            <FilaNoticia
              key={n.id}
              id={n.id}
              href={`/v2/noticias/${n.id}`}
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

      <Seccion
        n="02"
        titulo="Últimas noticias"
        desc="Todas las del período, filtrables por tema."
      >
        <ListaNoticias notas={filas} pills={pills} />
        <Pie>
          Esta portada son {orden.length} notas entre el {desde} y el {hasta}; el corpus completo
          del sitio son {formatInteger(TOTAL_DOCS)} documentos. Las píldoras salen de las seis
          categorías que el fixture declara filtrables — actualidad, laboral y ambiente se
          alcanzan por el buscador. Sin orden por relevancia: no hay ninguna señal de relevancia
          en el dato y un puntaje inventado no es un orden.
        </Pie>
      </Seccion>
    </>
  )
}
