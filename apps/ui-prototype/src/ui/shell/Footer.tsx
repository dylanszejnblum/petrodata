import Link from 'next/link'
import Image from 'next/image'
import { FooterNewsletterForm } from './FooterNewsletterForm'

/* Footer — card oscura (superficie inversa: jerarquía, no tema).
   Estructura por decisión de Mariano (2026-08-05):
   marca + tagline → Recursos/Boletín debajo → hairline →
   Estado en una línea (tamaño de créditos) → © + Made by + contacto.
   Radio 10px por regla Estrato (el original usa 14px). */

const RESOURCES = [
  { href: '/', label: 'Dashboard' },
  { href: '/map', label: 'Petróleo y gas' },
  { href: '/companies', label: 'Empresas' },
  { href: '/provincias', label: 'Provincias' },
]

export function Footer() {
  return (
    /* Sin pt propio: el aire lo pone el pb-16 de cada página (64px, mismo
       ritmo que entre secciones — antes se sumaban ambos y quedaban 128px) */
    <footer className="mx-auto w-full max-w-[80rem] px-4 pb-8 md:px-8">
      {/* pb-6 = mismo aire bajo los créditos que entre la divisoria y Estado.
          border-4 hacia adentro (border-box), mismo marco que el hero del artículo */}
      <div className="overflow-hidden rounded-[10px] border-4 border-black bg-inverse px-6 pb-6 pt-12 md:px-10">
        {/* Zona superior: la imagen vive SOLO acá y termina exacto en la
            línea divisoria (pedido de Mariano) */}
        <div className="relative pb-12">
          {/* Pad de perforación panorámico (vm-rig del sitio real) en B&N,
              fundido en diagonal con el negro vía máscara; sangra hasta los
              bordes de la card con offsets negativos */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-12 bottom-0 w-[85%] sm:w-[60%] md:-right-10"
          >
            <Image
              src="/images/vm-rig.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 46rem, 85vw"
              /* fundido corto (primer tercio) con arranque 100% transparente en
                 todo el borde izquierdo para que nunca se vea el corte de la
                 imagen (pedido de Mariano) */
              className="object-cover grayscale opacity-50 [mask-image:linear-gradient(100deg,transparent_12%,black_45%)]"
            />
          </div>

          <div className="relative">
        {/* Marca */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Marca Estrato: misma pieza que el navbar, en los tonos claros del DS */}
            <span aria-hidden className="size-2 rotate-45 bg-on-dark" />
            <span className="type-label-md !tracking-[0.14em] !text-on-dark-2">
              Vacamuerta.io
            </span>
          </Link>
          <p className="max-w-xs text-xs text-on-dark-3">
            Inteligencia de petróleo y gas en un solo lugar.
          </p>
        </div>

        {/* Recursos + Boletín, debajo del tagline */}
        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-12 md:gap-16">
          <nav aria-label="Recursos" className="flex flex-col gap-2">
            <span className="type-label-md !text-on-dark-2">Recursos</span>
            {RESOURCES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="text-sm text-on-dark-2 transition-colors duration-150 hover:text-on-dark"
              >
                {r.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            <span className="type-label-md !text-on-dark-2">Boletín</span>
            <p className="max-w-[220px] text-xs text-on-dark-3">
              Nuevas investigaciones y estadísticas en tu bandeja. Sin spam.
            </p>
            <div className="mt-1">
              <FooterNewsletterForm />
            </div>
          </div>
        </div>
          </div>
        </div>

        {/* Estado + créditos (fuera de la zona de la imagen) */}
        {/* Grilla 2×2: cada fila comparte altura, así Estado ↔ pregunta y
            © ↔ mail quedan alineados por construcción (pedido de Mariano) */}
        <div className="grid grid-cols-1 gap-y-3 border-t border-white/10 pt-6 sm:grid-cols-[auto_auto] sm:items-baseline sm:justify-between">
          <span className="type-label flex items-center gap-2 !text-on-dark-3 sm:col-start-1 sm:row-start-1">
            <span aria-hidden className="size-1.5 rounded-full bg-positive motion-safe:animate-pulse" />
            Estado · Todos los sistemas operativos
          </span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:col-start-1 sm:row-start-2">
            <span className="type-label !text-on-dark-3">© 2026 vacamuerta.io</span>
            <span className="type-label !normal-case !tracking-[0.04em] !text-on-dark-3">
              Made by{' '}
              <a
                href="https://x.com/dylansz_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-on-dark-2 transition-colors duration-150 hover:text-on-dark"
              >
                @dylansz_
                <svg
                  aria-hidden
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="-mt-px inline-block align-middle"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </span>
          </div>

          <span className="text-[11px] text-on-dark-3 sm:col-start-2 sm:row-start-1 sm:justify-self-end">
            ¿Tenés información sobre un proyecto u operador?
          </span>
          <a
            href="mailto:info@vacamuerta.io"
            className="text-[11px] text-on-dark-2 transition-colors duration-150 hover:text-on-dark sm:col-start-2 sm:row-start-2 sm:justify-self-end"
          >
            info@vacamuerta.io
          </a>
        </div>
      </div>
    </footer>
  )
}
