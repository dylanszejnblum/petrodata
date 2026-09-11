import { Header } from '@/ui/shell/Header'
import { Footer } from '@/ui/shell/Footer'

/* Chrome de las páginas: header, contenido y footer, con el body en
   columna (globals.css) para que el footer quede siempre abajo. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </>
  )
}
