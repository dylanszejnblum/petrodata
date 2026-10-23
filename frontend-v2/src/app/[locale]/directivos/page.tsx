import { Ranking } from './Ranking'
import { pageMetadata } from '@/lib/metadata'

export const generateMetadata = pageMetadata('/directivos')

/* DIRECTIVOS — quién dirige la cuenca, ordenado por un índice.

   La sección sale de CEOS/, el pipeline que busca y confirma al CEO actual de
   las 50 primeras empresas del sitio. Cruzan 48 con el ranking de COMPANIES.

   LA DECISIÓN DE FONDO, y conviene que esté escrita porque condiciona todo lo
   demás: no hay ninguna métrica de la PERSONA en el dato. El pipeline trae
   nombre, cargo y fuente. Así que el índice es de la EMPRESA, atribuido a quien
   la dirige, y la página lo dice en el pie de la card. Cualquier otra lectura
   sería inventarle a una persona real un número que nadie midió.

   LA PONDERACIÓN NO SE PUBLICA (pedido de Mariano, 2026-09-01). El pie nombra
   los tres insumos y nada más. Que eso sea cierto no depende de la prosa sino
   de qué se serializa: ver `PersonaFila` en fixtures/personas.ts.

   LA CARD 01 —la que explicaba el índice y mostraba el presupuesto de votos—
   ESTÁ SACADA (pedido de Mariano, 2026-09-01: «por ahora saquemos esta card,
   dejemos solo la lista»).

   El contador de votos restantes que vivía en esa card volvió como chip en
   la cabecera (EstadoVoto), y los más votados como un renglón con el conteo
   real. PanelVoto.tsx, que tenía las dos cosas con números inventados, se
   borró.

   Una cosa que queda pendiente de decisión y no de código:

   · LAS CARAS ESTÁN GENERADAS CON IA. Salen de CEOS/data/headshots/, que las
     produce con Higgsfield desde una foto real y el prompt «Recreate this exact
     person as a professional corporate executive cover portrait». Son
     fotorrealistas, sin marca de agua, de personas con nombre y apellido. Están
     en public/images/ceos para poder ver la maqueta —se versionan desde el
     2026-09-01, ver el .gitignore de esa carpeta—. La lista cae al monograma
     sola si el archivo no está, así que publicar sin resolver la foto ya
     funciona.

   EL VOTO YA NO ES UNA MAQUETA: vive en /api/v2/directivos/:slug/voto, con el
   presupuesto semanal y el corte diario del lado del servidor. Lo que sigue
   siendo cierto es la advertencia del pie: una IP no es una persona —una
   oficina o una operadora móvil son miles detrás de una sola— y cualquiera con
   VPN vota lo que quiera. */

/* Las otras seis páginas con datos declaran su revalidate acá; ésta no lo hacía
   y el `next: { revalidate: 300 }` del fetch no alcanza para levantar la ruta:
   salía del build como estática pura —la tabla de `next build` la listaba sin
   ventana— y el ranking y los contadores de votos quedaban congelados en el
   momento del deploy. Votar seguía escribiendo en la base; lo que no cambiaba
   era la página. */
export const revalidate = 300

export default async function V2Directivos({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <Ranking locale={locale} />
}
