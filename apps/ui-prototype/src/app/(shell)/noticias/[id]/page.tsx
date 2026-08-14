import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SectionLabel } from '@/ui/section-label'
import { formatDate } from '@/lib/format'
import { CATEGORY_LABEL, NEWS } from '@/fixtures/news'
import { NewsCard } from '../_components/NewsCard'
import { ArticleHero } from '../_components/ArticleHero'
import { KeyPoints } from '../_components/KeyPoints'
import { PullQuote } from '../_components/ArticleBlocks'
import { AdSlot, VideoCard } from '../_components/ArticleRail'
import { bucketFor } from '../_components/categories'

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const item = NEWS.find((n) => n.id === id)
  return { title: item ? item.title : 'Noticia', description: item?.summary }
}

/* Cuerpo simulado: párrafos CORTOS (2-4 oraciones, práctica editorial) generados
   determinísticamente. El producto real trae rich text del CMS + los bloques
   que decida el pipeline; acá solo importa la forma y el ritmo. */
function buildBody(summary: string, category: string, source: string): string[] {
  return [
    summary,
    `El dato consolida una tendencia que el sector venía anticipando desde comienzos de año. En los despachos de ${source} y de las operadoras de la cuenca, la lectura es la misma.`,
    'La curva de aprendizaje del shale argentino sigue comprimiendo costos y tiempos de perforación. Y eso se traduce directamente en los números del mes.',
    `Puertas adentro de la industria, el capítulo de ${category.toLowerCase()} concentra las conversaciones. Cada licitación y cada anuncio de inversión se sigue de cerca.`,
    'Los equipos técnicos apuntan a tres cuellos de botella: disponibilidad de sets de fractura, capacidad de evacuación y logística de arena.',
    'Hacia adelante, los analistas coinciden en que el ritmo dependerá menos de la geología —ya probada— y más de la macro: financiamiento, reglas estables e infraestructura terminada. Nota simulada con fines de prototipo.',
  ]
}

/** La frase con la cifra (misma lógica que el pullQuote() del código real) */
function pickQuote(title: string, paragraphs: string[]): string {
  const sentences = [title, ...paragraphs]
    .join(' ')
    .split(/(?<=[.:!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 180)
  return sentences.find((s) => /\d/.test(s)) ?? title
}


/* Puntos clave simulados (en producción los emite el pipeline de noticias) */
function buildKeyPoints(summary: string, category: string): string[] {
  return [
    summary.replace(/…$/, '.'),
    `El capítulo de ${category.toLowerCase()} concentra la conversación del sector: sets de fractura, evacuación y logística de arena son los cuellos de botella a vigilar.`,
    'El ritmo hacia adelante depende menos de la geología y más de la macro: financiamiento, reglas estables e infraestructura en marcha.',
  ]
}

export default async function NoticiaPage({ params }: { params: Params }) {
  const { id } = await params
  const item = NEWS.find((n) => n.id === id)
  if (!item) notFound()

  const categoryLabel = CATEGORY_LABEL[item.category]
  const bucket = bucketFor(item.category)
  const body = buildBody(item.summary, categoryLabel, item.source)
  const keyPoints = buildKeyPoints(item.summary, categoryLabel)
  const quote = pickQuote(item.title, body)

  const sameCategory = NEWS.filter((n) => n.id !== item.id && n.category === item.category)
  const filler = NEWS.filter(
    (n) => n.id !== item.id && !sameCategory.some((s) => s.id === n.id),
  ).sort((a, b) => b.date.localeCompare(a.date))
  const related = [...sameCategory, ...filler].slice(0, 3)

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      {/* pt-5 == mt-5 del hero: mismo aire arriba y abajo de la miga de pan */}
      <nav aria-label="Miga de pan" className="pt-5">
        <Link
          href="/noticias"
          className="type-label-md !text-secondary transition-colors duration-150 hover:!text-primary"
        >
          ← Noticias
        </Link>
      </nav>

      {/* Hero de la nota (componentizado en ArticleHero) */}
      <article className="mt-5">
        <ArticleHero item={item} />

        {/* Cuerpo + rail derecho (video si la nota lo trae + publicidad).
            El rail solo existe en desktop; en móvil el video se integra
            arriba del cuerpo. */}
        {/* justify-between pega el rail (336px = ancho del ad IAB large
            rectangle) contra el borde derecho de la card del hero */}
        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,44rem)_336px] lg:justify-between lg:gap-10">
          <div className="max-w-[44rem]">
            {item.video && (
              <div className="mb-6 lg:hidden">
                <VideoCard item={item} />
              </div>
            )}

            <p className="type-card-title !text-[1.05rem] !leading-normal text-balance">
              {body[0]}
            </p>
            <KeyPoints points={keyPoints} accent={bucket.color} />

            {/* Notas cortas: una sola interrupción (el pull quote) alcanza.
                Los demás bloques (Subhead/StatCallout/InlineRelated) quedan
                disponibles en ArticleBlocks para notas largas del pipeline. */}
            <p className="mt-5 leading-relaxed text-body">{body[1]}</p>
            <p className="mt-5 leading-relaxed text-body">{body[2]}</p>

            <PullQuote accent={bucket.color}>{quote}</PullQuote>

            <p className="leading-relaxed text-body">{body[3]}</p>
            <p className="mt-5 leading-relaxed text-body">{body[4]}</p>
            <p className="mt-5 leading-relaxed text-body">{body[5]}</p>
          </div>

          <aside aria-label="Contenido complementario" className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-8">
              {item.video && <VideoCard item={item} />}
              <AdSlot />
            </div>
          </aside>
        </div>

        {/* La línea de cierre va FUERA de la grilla, a ancho completo: es el
            límite inferior del sticky del rail (no puede pasarla) y cierra
            visualmente la nota bajo ambas columnas */}
        <p className="type-label mt-10 border-t pt-4">
          Fuente: {item.source} · {formatDate(item.date)} · contenido simulado
        </p>
      </article>

      {/* Relacionadas */}
      <section className="mt-16">
        <SectionLabel index="01" title="Relacionadas" note={categoryLabel} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {related.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      </section>
    </div>
  )
}
