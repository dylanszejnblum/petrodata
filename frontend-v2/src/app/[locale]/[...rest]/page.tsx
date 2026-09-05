import { notFound } from 'next/navigation'

/* Catch-all bajo [locale]: cualquier ruta desconocida cae acá y renderiza
   el not-found del sistema (dentro del layout con el índice), en vez del
   404 default de Next sin chrome. */
export default function RestoNoExiste() {
  notFound()
}
