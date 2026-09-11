import Link from 'next/link'

/* Placeholder para las pantallas del producto que todavía no se construyeron.
   Se reemplazan una por una en los Niveles 4 y 4b del plan. */

const PLANEADAS: Record<string, { nombre: string; tanda: string }> = {
  map: { nombre: 'Mapa de pozos', tanda: 'Nivel 4 · tanda núcleo' },
  provincias: { nombre: 'Provincias', tanda: 'Nivel 4 · tanda núcleo' },
  indicadores: { nombre: 'Indicadores', tanda: 'Nivel 4 · tanda núcleo' },
  noticias: { nombre: 'Noticias', tanda: 'Nivel 4 · tanda núcleo' },
  companies: { nombre: 'Companies', tanda: 'Nivel 4b · resto' },
  minerals: { nombre: 'Minerals', tanda: 'Nivel 4b · resto' },
  exportaciones: { nombre: 'Exportaciones', tanda: 'Nivel 4b · resto' },
}

export default async function Pendiente({ params }: { params: Promise<{ pendiente: string[] }> }) {
  const { pendiente } = await params
  const raiz = pendiente[0] ?? ''
  const info = PLANEADAS[raiz]

  return (
    <div className="mx-auto grid max-w-[80rem] place-items-center px-4 py-24 md:px-8">
      <div className="w-full max-w-[34rem] rounded-[10px] border bg-surface p-8">
        <p className="type-label mb-3 flex items-center gap-2">
          <span aria-hidden className="size-1.5 bg-primary" />
          {info ? info.tanda : 'Ruta desconocida'}
        </p>
        <h1 className="type-h1 !text-[1.8rem]">
          {info ? info.nombre : `/${pendiente.join('/')}`}
        </h1>
        <p className="mt-3 text-secondary">
          {info
            ? 'Esta pantalla todavía no se construyó en el prototipo. Se habilita cuando su tanda entre en revisión — primero se aprueban fundaciones y componentes.'
            : 'Esta ruta no existe en el producto ni en el plan del prototipo.'}
        </p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="type-label rounded-full border px-2.5 py-1">
            {info ? 'Estado: Draft' : '404'}
          </span>
          <div className="flex gap-2.5">
            <Link
              href="/catalog"
              className="rounded-[8px] border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-primary"
            >
              Ver catálogo
            </Link>
            <Link
              href="/"
              className="rounded-[8px] bg-primary px-4 py-2 text-[13px] font-medium text-canvas"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
