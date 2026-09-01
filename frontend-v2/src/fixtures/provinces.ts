/* DATOS REALES de vacamuerta.io/provincias (2026-08-05). */

export type Province = {
  slug: string
  name: string
  basin: string
  wells: number
  exportsMUSD: number
  /* OJO con este campo: NO es la participación de la provincia en la columna
     exportsMUSD. Los once exportsMUSD suman 6.879 y los once expSharePct suman
     40,4%, no 100. El denominador es otro —las exportaciones totales del país,
     no las del complejo—, así que Neuquén es 28,1% acá y 69,6% de la columna.

     Las dos cifras son reales y las dos sirven, pero mezclarlas en una misma
     tabla no: v2 usa la participación en la columna, que es la que cierra
     contra el total que muestra la cabecera. */
  expSharePct: number
  featured?: boolean
  /** operadoras destacadas (ilustrativo, para la ficha) */
  operators?: string[]
  blurb: string
  /** false sólo en "Estado Nacional", que no es una provincia. Ver abajo. */
  esProvincia?: boolean
}

export const PROVINCES: Province[] = [
  {
    slug: 'neuquen',
    name: 'Neuquén',
    basin: 'Cuenca Neuquina',
    wells: 4_688,
    exportsMUSD: 4_790,
    expSharePct: 28.1,
    featured: true,
    operators: ['ypf', 'pluspetrol', 'pampa', 'shell'],
    blurb: 'El corazón de Vaca Muerta: Loma Campana, Bajada del Palo y la ventana de shale oil.',
  },
  {
    slug: 'chubut',
    name: 'Chubut',
    basin: 'Golfo San Jorge',
    wells: 2_783,
    exportsMUSD: 823,
    expSharePct: 4.8,
    operators: ['pecom_servicios_energia_sau'],
    blurb: 'Golfo San Jorge: el bastión convencional del sur, con crudo pesado de exportación.',
  },
  {
    slug: 'santa-cruz',
    name: 'Santa Cruz',
    basin: 'Golfo San Jorge',
    wells: 3_266,
    exportsMUSD: 436,
    expSharePct: 2.6,
    operators: ['ypf'],
    blurb: 'Austral y San Jorge sur: gas de plataforma y campos maduros en revitalización.',
  },
  {
    slug: 'mendoza',
    name: 'Mendoza',
    basin: 'Cuenca Cuyana',
    wells: 1_932,
    exportsMUSD: 340,
    expSharePct: 2.0,
    operators: ['ypf'],
    blurb: 'Cuenca Cuyana: producción convencional madura con piloto no convencional.',
  },
  {
    slug: 'rio-negro',
    name: 'Rio Negro',
    basin: 'Cuenca Neuquina',
    wells: 1_325,
    exportsMUSD: 171,
    expSharePct: 1.0,
    operators: ['ypf', 'pluspetrol'],
    blurb: 'Estación Fernández Oro y el corredor del Alto Valle; la salida del VMOS a Punta Colorada.',
  },
  {
    slug: 'estado-nacional',
    name: 'Estado Nacional',
    basin: 'Total país',
    wells: 8,
    exportsMUSD: 162,
    expSharePct: 1.0,
    blurb: 'Áreas bajo administración del Estado Nacional.',
    esProvincia: false,
  },
  {
    slug: 'la-pampa',
    name: 'La Pampa',
    basin: 'Cuenca Neuquina',
    wells: 272,
    exportsMUSD: 72.2,
    expSharePct: 0.4,
    blurb: 'El borde oriental de la cuenca Neuquina, entre Medanito y 25 de Mayo.',
  },
  {
    slug: 'tierra-del-fuego',
    name: 'Tierra del Fuego',
    basin: 'Cuenca Austral',
    wells: 143,
    exportsMUSD: 47.7,
    expSharePct: 0.3,
    blurb: 'Gas austral onshore y offshore, con la única termoeléctrica en construcción del país.',
  },
  {
    slug: 'salta',
    name: 'Salta',
    basin: 'Cuenca Noroeste',
    wells: 1,
    exportsMUSD: 32.7,
    expSharePct: 0.2,
    blurb: 'Cuenca Noroeste: actividad residual de gas y condensado.',
  },
  {
    slug: 'formosa',
    name: 'Formosa',
    basin: 'Cuenca Noroeste',
    wells: 12,
    exportsMUSD: 3.06,
    expSharePct: 0.0,
    blurb: 'Producción marginal de la Cuenca Noroeste.',
  },
  {
    slug: 'jujuy',
    name: 'Jujuy',
    basin: 'Cuenca Noroeste',
    wells: 11,
    exportsMUSD: 1.19,
    expSharePct: 0.0,
    blurb: 'Actividad menor de hidrocarburos en el ramal noroeste.',
  },
]

/* "Estado Nacional" está en PROVINCES porque sus 8 pozos y sus 162 MUSD suman
   al total del país y tienen que aparecer en los totales y en las listas. Pero
   no es una provincia, y su "cuenca" —"Total país"— no es una cuenca.

   Contarlo como una llevaba a decir tres cosas falsas al mismo tiempo: "11
   provincias" en la tarjeta de resumen, "de 11" en el puesto de cada fila y
   seis cuencas en una sección cuyo texto dice cinco. Todo denominador que
   hable de provincias o de cuencas se calcula sobre esta lista. */
export const SOLO_PROVINCIAS = PROVINCES.filter((p) => p.esProvincia !== false)
