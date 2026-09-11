import { ButtonLink } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import { PageHero } from '@/ui/page-hero'
import { SectionLabel } from '@/ui/section-label'

/* Catálogo · 04 — el simulador de estados del mock (src/mock/state.ts).
   Cualquier pantalla del producto acepta ?estado= y ?latencia=. */

const ESTADOS: [string, string, string][] = [
  ['(sin parámetro)', 'ok', 'Datos completos — el caso feliz.'],
  ['?estado=vacio', 'vacio', 'El dataset llega como []. La pantalla muestra EmptyState kind="empty".'],
  ['?estado=parcial', 'parcial', 'El dataset se recorta (primeros N registros). La pantalla avisa que faltan datos.'],
  ['?estado=error', 'error', 'El dataset llega como null. La pantalla muestra EmptyState kind="error".'],
  ['?estado=offline', 'offline', 'También null, pero la causa es la fuente: EmptyState kind="offline".'],
  ['?latencia=1500', '—', 'Demora el server component esa cantidad de ms (tope 6000): se ven los Skeleton reales.'],
]

const LINKS: [string, string][] = [
  ['/noticias?estado=vacio', 'Noticias sin resultados'],
  ['/indicadores?estado=error', 'Indicadores con error de carga'],
  ['/map?estado=offline', 'Mapa con la fuente caída'],
  ['/companies?latencia=2000', 'Companies con 2s de latencia (Skeleton)'],
]

function Seccion({
  idx,
  title,
  note,
  children,
}: {
  idx: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="pt-14">
      <SectionLabel index={idx} title={title} note={note} />
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function Estados() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Catálogo · 04" title="Estados">
        Ninguna pantalla se aprueba viendo solo el caso feliz. El mock trae un simulador
        (src/mock/state.ts): cualquier ruta del producto acepta ?estado= y ?latencia= por
        query string para forzar vacío, error, datos parciales, fuente caída o carga lenta.
      </PageHero>

      {/* ················· 01 · Parámetros ················· */}
      <Seccion idx="01" title="Parámetros del simulador" note="src/mock/state.ts">
        <div className="overflow-x-auto rounded-[10px] border bg-surface">
          <table className="w-full min-w-[36rem] border-collapse text-[13px]">
            <caption className="sr-only">
              Parámetros de query string del simulador de estados y su efecto en los datos
            </caption>
            <thead>
              <tr className="bg-raised">
                <th scope="col" className="px-4 py-2 text-left type-label">Query string</th>
                <th scope="col" className="px-4 py-2 text-left type-label">Estado</th>
                <th scope="col" className="px-4 py-2 text-left type-label">Efecto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ESTADOS.map(([query, estado, efecto]) => (
                <tr key={query}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-body">{query}</td>
                  <td className="px-4 py-2.5 font-mono text-secondary">{estado}</td>
                  <td className="px-4 py-2.5 text-secondary">{efecto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[46rem] text-[13px] text-secondary">
          Un valor desconocido de ?estado= cae en ok. Los parámetros se combinan:
          <span className="ml-1 font-mono">?estado=parcial&amp;latencia=1500</span> primero
          espera y después recorta.
        </p>
      </Seccion>

      {/* ················· 02 · Probarlo en el producto ················· */}
      <Seccion idx="02" title="Probarlo en el producto" note="links reales">
        <div className="flex flex-wrap gap-3">
          {LINKS.map(([href, label]) => (
            <ButtonLink key={href} href={href} variant="outline" size="sm">
              {label}
            </ButtonLink>
          ))}
        </div>
        <p className="mt-3 max-w-[46rem] text-[13px] text-secondary">
          Cada link abre una pantalla real del producto con el estado forzado. Al revisar un
          componente nuevo, recorré los cuatro antes de aprobarlo.
        </p>
      </Seccion>

      {/* ················· 03 · EmptyState por kind ················· */}
      <Seccion idx="03" title="EmptyState por kind" note="vacío ≠ error ≠ offline">
        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <p className="type-label mb-2">kind=&quot;empty&quot; · sin role, no interrumpe</p>
            <EmptyState kind="empty" actionHref="/noticias" actionLabel="Limpiar filtros" />
          </div>
          <div>
            <p className="type-label mb-2">kind=&quot;error&quot; · role=&quot;alert&quot;</p>
            <EmptyState kind="error" />
          </div>
          <div>
            <p className="type-label mb-2">kind=&quot;offline&quot; · role=&quot;alert&quot;</p>
            <EmptyState kind="offline" />
          </div>
        </div>
        <p className="mt-3 max-w-[46rem] text-[13px] text-secondary">
          La distinción importa: vacío es una respuesta válida (el lector filtró de más),
          error es culpa nuestra y offline es culpa de la fuente. Cada uno pide un mensaje
          y una salida distintos — nunca un return null silencioso.
        </p>
      </Seccion>
    </div>
  )
}
