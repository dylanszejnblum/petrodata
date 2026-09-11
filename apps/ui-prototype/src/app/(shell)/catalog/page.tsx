import Link from 'next/link'

const SECTIONS = [
  {
    href: '/catalog/fundaciones',
    idx: '01',
    title: 'Fundaciones',
    desc: 'Color, tipografía, espaciado, radios, superficies, motion',
    status: 'Ready for review',
  },
  {
    href: '/catalog/componentes',
    idx: '02',
    title: 'Componentes',
    desc: 'Los 20 componentes de src/ui con variantes, estados, casos extremos, tabla de props y notas de accesibilidad',
    status: 'En revisión',
  },
  {
    href: '/catalog/patrones',
    idx: '03',
    title: 'Patrones',
    desc: 'Composiciones reales: cards de noticia y foto, KPI band, tabla con filtros, overlay de mapa — y cuándo usar cada una',
    status: 'En revisión',
  },
  {
    href: '/catalog/estados',
    idx: '04',
    title: 'Estados',
    desc: 'El simulador del mock (?estado, ?latencia), vacío vs. error vs. offline, y los EmptyState por tipo',
    status: 'En revisión',
  },
]

export default function CatalogIndex() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-12 md:px-8">
      <h1 className="type-h1">Catálogo Estrato</h1>
      <p className="mt-2 max-w-[44rem] text-secondary">
        Cada pieza se evalúa acá antes de usarse en una pantalla: primero los tokens, después
        cada componente aislado con sus estados y casos extremos, después las composiciones.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-[10px] border bg-surface p-5 hover:bg-raised"
          >
            <div className="flex items-baseline justify-between">
              <span className="type-label !text-primary">{s.idx}</span>
              <span className="type-label rounded-full border px-2 py-0.5">{s.status}</span>
            </div>
            <p className="type-card-title mt-3">{s.title}</p>
            <p className="mt-1 text-[13px] text-secondary">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
