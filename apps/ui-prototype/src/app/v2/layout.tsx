import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './sistema.css'
import { Indice } from './_ui/Indice'

/* Esqueleto del sistema V2. No es el chrome de Estrato con otros colores: es
   el esqueleto que pide el sistema medido — índice fijo de 288px + columna de
   contenido, con el contenido topeado en 672 y alineado a la izquierda.

   La columna de contenido ocupa TODO el ancho sobrante (1fr) aunque su
   contenido se tope en 672. Antes el grid entero se topaba en 960 y la
   columna terminaba ahí: al ponerle la trama de puntos, la textura cortaba en
   seco a mitad de pantalla en monitores anchos. Con 1fr la textura llega
   hasta el borde y el contenido sigue donde estaba.

   El índice cumple el mismo papel que en la referencia (tabla de contenidos),
   sólo que ahí indexaba las 19 secciones de una página única y acá indexa las
   secciones del sitio, que son páginas. */

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Vaca Muerta — sistema V2', template: '%s · V2' },
  description: 'Las secciones de vacamuerta.io rederivadas con el sistema de beautifului.dev.',
}

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sistema ${inter.variable} ${mono.variable}`}>
      <div className="grid lg:grid-cols-[288px_1fr]">
        <Indice />
        <main className="s-contenido min-w-0">
          {children}
          {/* La referencia cierra con un filete punteado y una línea de
              atribución, no al aire. Es el mismo separador de siempre. */}
          <footer className="s-pie">
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              Prototipo · datos simulados sobre cifras públicas
            </span>
            <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
              sistema v2
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
