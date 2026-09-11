/* NOTICIAS REALES de vacamuerta.io/noticias (portada del 2026-08-05).
   Títulos, fuentes, categorías y fechas reales; resúmenes acortados. */

export type NewsItem = {
  id: string
  title: string
  summary: string
  category:
    | 'actualidad'
    | 'produccion'
    | 'inversion'
    | 'regulacion'
    | 'financiamiento'
    | 'exportacion'
    | 'rigi'
    | 'laboral'
    | 'ambiente'
  source: string
  date: string // ISO
  featured?: boolean
  photo?: boolean
  readingMin?: number
  /** imagen propia de la nota (como card.image en producción); si falta, foto del bucket */
  image?: string
  /** la nota trae video (el pipeline marca esto; el player va en el rail derecho) */
  video?: boolean
}

export const CATEGORY_LABEL: Record<NewsItem['category'], string> = {
  actualidad: 'Actualidad',
  produccion: 'Producción',
  inversion: 'Inversión',
  regulacion: 'Regulación',
  financiamiento: 'Financiamiento',
  exportacion: 'Exportación',
  rigi: 'RIGI',
  laboral: 'Laboral',
  ambiente: 'Ambiente',
}

/** Chips de filtro del listado real (el resto de categorías vive bajo "Todas") */
export const FILTER_CATEGORIES: NewsItem['category'][] = [
  'produccion',
  'inversion',
  'regulacion',
  'financiamiento',
  'exportacion',
  'rigi',
]

export const TOTAL_DOCS = 790 // el sitio reporta 790 documentos · 33 páginas

export const NEWS: NewsItem[] = [
  {
    id: 'pampa-ebitda-record',
    title:
      'Pampa cerró el segundo trimestre con un EBITDA de u$s 415 millones, un 75% más, y producción récord de 107.500 barriles equivalentes',
    summary:
      'La compañía hizo referencia además a la mayor decisión de inversión de su historia: u$s 2.700 millones para levantar en Bahía Blanca la planta…',
    category: 'exportacion',
    source: 'Shale24',
    date: '2026-08-05',
    featured: true,
    photo: true,
    readingMin: 4,
    image: '/images/news/news-produccion-rig.jpg',
    video: true,
  },
  {
    id: 'ley-tierras-figueroa',
    title:
      'Ley de Tierras: Rolando Figueroa se plantó contra la extranjerización y confirmó el voto en contra de Julieta Corroza en el Senado',
    summary:
      'El gobernador de Neuquén complicó este miércoles las chances de que La Libertad Avanza reúna los votos.',
    category: 'produccion',
    source: 'Diario Río Negro',
    date: '2026-08-05',
    photo: true,
  },
  {
    id: 'geopark-apuesta-vm',
    title: 'GeoPark aceleró su apuesta por Vaca Muerta: el 64% de las inversiones fueron para Argentina',
    summary: 'La operadora concentró casi dos tercios de su plan de inversión en el shale argentino.',
    category: 'actualidad',
    source: 'Diario Río Negro',
    date: '2026-08-05',
    photo: true,
  },
  {
    id: 'ormuz-brent',
    title: 'Donald Trump anticipa un acuerdo inminente para reabrir el Estrecho de Ormuz: el petróleo frena su escalada a US$80',
    summary: 'El crudo recorta la suba geopolítica ante la expectativa de normalización del tránsito.',
    category: 'actualidad',
    source: 'Diario Río Negro',
    date: '2026-08-05',
    photo: true,
  },
  {
    id: 'ypf-acciones-app',
    title: 'Horacio Marín ratificó que pronto se podrán comprar acciones de YPF desde la app',
    summary: 'Tras el split diez a uno, falta el canal minorista dentro de APP YPF para multiplicar al inversor pequeño.',
    category: 'financiamiento',
    source: 'Shale24',
    date: '2026-08-05',
    readingMin: 3,
    photo: true,
  },
  {
    id: 'ushuaia-termoelectrica',
    title: 'Cuál es la única central termoeléctrica que se está construyendo en el país en medio del faltante de turbinas',
    summary: 'Tierra del Fuego construye un ciclo combinado en Ushuaia que estará operativo en mayo de 2027.',
    category: 'inversion',
    source: 'EconoJournal',
    date: '2026-08-05',
    readingMin: 5,
  },
  {
    id: 'ypf-zeus-halliburton',
    title: 'El salto eléctrico de YPF: Halliburton confirma que la primera flota de fractura Zeus ya está en viaje',
    summary: 'El set eléctrico sale de Estados Unidos y se enciende en el cuarto trimestre.',
    category: 'produccion',
    source: 'Shale24',
    date: '2026-08-05',
    readingMin: 4,
  },
  {
    id: 'camara-argentina-texas',
    title: 'Gabriela Aguilar: “El desarrollo de Vaca Muerta exige continuidad, reglas claras y seguridad jurídica”',
    summary: 'La nueva presidenta de la Cámara Argentina-Texas quiere fortalecer el puente entre negocios y tecnología.',
    category: 'exportacion',
    source: 'Shale24',
    date: '2026-08-05',
    readingMin: 10,
  },
  {
    id: 'hidroelectrica-tucuman',
    title: 'Hidroeléctrica de Tucumán: vence la concesión de El Cadillal, Escaba y Pueblo Viejo y el Gobierno la prorroga',
    summary: 'La Resolución 168/2026 obliga a operar hasta el 15 de diciembre mientras se convoca la licitación.',
    category: 'inversion',
    source: 'Shale24',
    date: '2026-08-05',
    readingMin: 3,
  },
  {
    id: 'gyp-licitacion-bloques',
    title: 'Vaca Muerta: hay al menos 15 petroleras interesadas en las nuevas áreas que Neuquén licita a través de GyP',
    summary: 'Firmas norteamericanas y argentinas compraron pliegos por los 15 bloques que licita la estatal provincial.',
    category: 'financiamiento',
    source: 'EconoJournal',
    date: '2026-08-05',
    readingMin: 4,
    photo: true,
  },
  {
    id: 'combustible-nuclear-piletas',
    title: 'Qué pasa con el combustible nuclear: el papel de las piletas de almacenamiento en las centrales argentinas',
    summary: 'El rol del almacenamiento húmedo en Atucha y Embalse, explicado.',
    category: 'actualidad',
    source: 'Diario Río Negro',
    date: '2026-08-05',
  },
  {
    id: 'nuclear-inversion',
    title: 'Energía nuclear: la ventana de oportunidad para el despegue inversor de Argentina',
    summary: 'El rediseño del sector atómico y la posible privatización parcial marcan un punto de inflexión.',
    category: 'financiamiento',
    source: 'Shale24',
    date: '2026-08-04',
    readingMin: 3,
  },
  {
    id: 'acuerdo-productividad-rucci',
    title: 'Vaca Muerta: cómo es el acuerdo de productividad que firmó Rucci con operadoras y empresas de servicios',
    summary: 'Incentivos para perforación, pulling y workover firmados por el sindicato con las cámaras.',
    category: 'financiamiento',
    source: 'EconoJournal',
    date: '2026-08-04',
    readingMin: 6,
  },
  {
    id: 'cnv-pampa',
    title: 'Información financiera — Pampa Energía (CNV)',
    summary: 'Presentación ante la Comisión Nacional de Valores según normas del Título XII.',
    category: 'regulacion',
    source: 'CNV',
    date: '2026-08-04',
  },
  {
    id: 'bbva-infraestructura',
    title: 'Vaca Muerta requerirá entre US$ 15.000 y US$ 20.000 millones de inversiones adicionales en infraestructura hasta 2030',
    summary: 'BBVA Research estima la inversión necesaria para capitalizar el escenario de precios altos.',
    category: 'inversion',
    source: 'EconoJournal',
    date: '2026-08-04',
    readingMin: 3,
    photo: true,
  },
  {
    id: 'rigi-cinco-aprobaciones',
    title: 'El Gobierno anunció cinco nuevas aprobaciones del RIGI y proyecta un fuerte impacto en exportaciones y empleo',
    summary: 'Nuevos proyectos aprobados en el régimen de incentivo a grandes inversiones.',
    category: 'rigi',
    source: 'Diario Río Negro',
    date: '2026-08-04',
  },
  {
    id: 'paro-portuario',
    title: 'Se levantó el paro portuario: acordaron bajar tarifas y revisar la reforma impulsada por Sturzenegger',
    summary: 'Acuerdo entre gremios y Gobierno destraba los embarques.',
    category: 'laboral',
    source: 'Diario Río Negro',
    date: '2026-08-04',
  },
  {
    id: 'ruta-151-derrame',
    title: 'Alarma en la Ruta 151: un camión con ácido clorhídrico que iba a Neuquén tuvo un derrame',
    summary: 'El incidente obligó a un operativo de emergencia en el corredor petrolero.',
    category: 'ambiente',
    source: 'Diario Río Negro',
    date: '2026-08-04',
  },
  {
    id: 'cnv-red-federal',
    title: 'Información societaria — preadjudicación del tramo mesopotámico, Red Federal de Concesiones etapa III',
    summary: 'Recomendación de preadjudicación publicada ante la CNV.',
    category: 'regulacion',
    source: 'CNV',
    date: '2026-08-04',
  },
  {
    id: 'arcor-parque-solar',
    title: 'Arcor inauguró en Catamarca su primer parque solar y busca llevar el modelo a otras plantas',
    summary: 'El parque de 12 hectáreas alimenta las tres plantas fabriles del complejo Recreo.',
    category: 'inversion',
    source: 'Diario Río Negro',
    date: '2026-08-05',
    readingMin: 6,
  },
]
