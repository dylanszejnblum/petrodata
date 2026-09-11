import { Header } from '@/ui/shell/Header'

/* Chrome de las vistas de aplicación (hoy: el mapa). Sin footer y a alto
   de viewport exacto: el header ocupa lo suyo y el contenido se queda con
   todo el resto. `min-h-0` es lo que permite que un hijo con h-full no
   desborde el flex; `overflow-hidden` mata el scroll de página, que en
   una vista de mapa competiría con el zoom del propio mapa. */
export default function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <main id="contenido" tabIndex={-1} className="min-h-0 w-full flex-1">
        {children}
      </main>
    </div>
  )
}
