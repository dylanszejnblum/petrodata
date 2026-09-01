'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CardCuenca } from './CardCuenca'
import { formatMonth } from '@/lib/format'

/* Los nombres y el orden son los de vacamuerta.io, tal cual. Los había
   cambiado —"Inicio" por "Producción", "Companies" por "Empresas", más una
   sección "Operadoras" que el sitio no tiene— siguiendo las reglas de
   escritura del sistema, pero eso convertía la comparación en dos sitios
   distintos en vez de dos diseños del mismo. La nomenclatura se discute
   aparte, con el diseño ya decidido.

   Los rótulos salen de src/messages/es.json del sitio, que es la fuente
   canónica: nav.dashboardFull = "Dashboard" y nav.companiesFull = "Empresas".
   El header que habíamos copiado en Estrato mostraba "Inicio" y "Companies",
   que no coinciden con las traducciones propias del sitio.

   Índice — el panel de la izquierda: marca arriba, lista de secciones, la
   card de la cuenca y el bloque de cierre. Es sticky y de alto de viewport
   desde 1024px; abajo de eso se apila, que es el único reordenamiento que el
   sistema hace en todo el responsive.

   El padding superior es 16px, el mismo que el de las secciones, para que la
   fila de la marca arranque a la misma altura que el primer marco de la
   página. Antes era un clamp de 40 a 80px heredado de la referencia —donde el
   panel no tenía nada con qué alinearse— y dejaba la columna 58px más abajo
   que el contenido.

   Tiene fondo propio (--panel), un peldaño más claro que el suelo, y una
   divisoria fina de 1px en --line: a la derecha desde 1024px y abajo cuando
   se apila. La divisoria es SÓLIDA y no punteada, porque el punteado quedó
   fuera de v2. */

/* Las etiquetas viven en v2.indice.* (messages) y salen por useTranslations
   en el render, no acá: el índice es cliente y cambia de idioma sin recargar. */
const SECCIONES = [
  { href: '/', n: '01', label: 'dashboard' },
  { href: '/mapa', n: '02', label: 'mapa' },
  { href: '/provincias', n: '03', label: 'provincias' },
  { href: '/empresas', n: '04', label: 'empresas' },
  { href: '/indicadores', n: '05', label: 'indicadores' },
  { href: '/noticias', n: '06', label: 'noticias' },
  { href: '/personalidades', n: '07', label: 'personalidades' },
]

export function Indice({ periodo }: { periodo: string }) {
  const t = useTranslations('v2.indice')
  const ruta = usePathname()

  return (
    <aside
      className="flex flex-col border-b px-7 pt-4 pb-7 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-b-0"
      style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
    >
      {/* La marca de vacamuerta.io, la misma de Estrato: rombo monocromo más
          la palabra. Usa el marco, igual que la card de la cuenca: mismo
          fondo de canvas y mismo anillo de 1px.

          El radio SÍ cambia: 10 y no los 14 del marco. La regla del sistema
          es que el radio crece con la caja para que la esquina se vea igual,
          no para que el número sea igual. Con 42px de alto, 14 de radio son
          el 33% del alto —la pieza más redonda del sistema, más incluso que
          un chip— mientras que en el marco de sección son el 4%. Con 10
          queda en 24%, en línea con el chip (27%) y los controles.

          El padding va por estilo inline y no por clase: el marco define 12px
          y acá hacen falta 10. Con 12 la fila pide 216px sobre 208 y la
          palabra se trunca en "VACAMUERTA...". Inline gana siempre, sin
          depender del orden en que salga el CSS.

          Los otros tres recortes que hicieron entrar la fila: los dos gaps de
          12 y 10 a 8, el tracking de 0,14 a 0,10em y el chip a 10,5px. */}
      <div
        className="s-marco flex shrink-0 items-center justify-between gap-2"
        style={{ padding: '10px', borderRadius: 'var(--radius-card)' }}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2 no-underline">
          <span
            aria-hidden
            className="size-2 shrink-0 rotate-45"
            style={{ background: 'var(--ink)' }}
          />
          <span
            className="s-micro truncate font-medium uppercase"
            style={{ color: 'var(--ink-2)', letterSpacing: '0.10em' }}
          >
            Vacamuerta.io
          </span>
        </Link>
        <span className="s-chip s-chip--neutro s-mono shrink-0 !px-2 !text-[10.5px]">
          {formatMonth(periodo)}
        </span>
      </div>

      <div className="mt-7 shrink-0" />

      {/* Sin flex-1: con siete ítems, estirar la lista abría un hueco de 400px
          entre el último ítem y la card. Ahora todo se apila arriba y el aire
          sobrante queda al pie, que es como se lee una columna normal.
          Se va también la máscara de desvanecido: servía cuando la lista
          desbordaba, y sobre una lista corta lo único que hacía era borronear
          el último ítem. */}
      <nav className="relative shrink-0">
        {/* Sin padding izquierdo: los ítems compensan su propio padding con un
            margen negativo, así que su texto arranca en el borde del nav. Con
            pl-1.5 el rótulo quedaba 6px adentro y no alineaba con los números. */}
        <p className="s-etq mb-1">{t('secciones')}</p>
        {SECCIONES.map((s) => {
          const activa = s.href === '/' ? ruta === '/' : ruta.startsWith(s.href)
          return (
            <Link key={s.href} href={s.href} className="s-item" aria-current={activa ? 'page' : undefined}>
              <span className="s-mono w-4 shrink-0 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {s.n}
              </span>
              {t(s.label)}
            </Link>
          )
        })}
      </nav>

      {/* La card va entre el índice y el bloque de datos: cierra la columna
          con la cifra que resume todo, en el lugar donde antes había un
          titular que no aportaba dato. */}
      <div className="mt-7 shrink-0">
        <CardCuenca />
      </div>

      <div className="mt-6 shrink-0">
        <p className="m-0 text-[12.5px] font-medium">{t('datosTitle')}</p>
        <p className="s-desc m-0 mt-0.5">
          {t('datosDesc')}
        </p>
      </div>
    </aside>
  )
}
