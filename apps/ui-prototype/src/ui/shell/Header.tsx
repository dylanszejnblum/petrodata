import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

/* Navegación real del producto (post-pivot O&G). Minerals/Uranium quedan
   fuera del nav como en producción — se llega por URL. */
const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/map', label: 'Mapa' },
  { href: '/provincias', label: 'Provincias' },
  { href: '/companies', label: 'Companies' },
  { href: '/indicadores', label: 'Indicadores' },
  { href: '/noticias', label: 'Noticias' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-canvas/90 backdrop-blur-sm">
      {/* Regla 9: skip link — inexistente en producción, de serie en Estrato */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:rounded-[8px] focus:border"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto max-w-[80rem] px-4 md:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            {/* Marca Estrato: rombo monocromo (negro en claro, blanco en oscuro) */}
            <span aria-hidden className="size-2 shrink-0 rotate-45 bg-primary" />
            <span className="type-label-md truncate !text-secondary tracking-[0.14em]">
              Vacamuerta.io
            </span>
            {/* El badge de prototipo se oculta abajo de sm: son 86px de una
                etiqueta de desarrollo que en 375px empujaba la barra fuera de
                la pantalla (la fila pedía 369px sobre 343 disponibles). */}
            <span className="type-label hidden shrink-0 rounded-full border px-2 py-0.5 !text-tertiary sm:inline-block">
              Prototipo Estrato
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/catalog"
              className="type-label-md rounded-[8px] px-3 py-2 hover:bg-raised hover:!text-primary"
            >
              Catálogo
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Navegación principal" className="flex gap-5 overflow-x-auto pb-3 -mt-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="type-label-md whitespace-nowrap pb-1 border-b-2 border-transparent hover:!text-primary hover:border-line-strong"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
