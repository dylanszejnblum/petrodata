/* EMPRESAS REALES de vacamuerta.io/companies — scrape del 2026-08-11.
   Copia 1:1 del listado en producción: las 52 del ranking con su slug real,
   sector, % nacional, % del valor (US$) y proyectos (conteo de pozos).
   `exchange`/`price`/`change` son la foto de las cotizaciones en vivo de ese
   día (producción las refresca cada 5 min contra /api/v2/companies/prices).
   `website` alimenta el favicon de Google, igual que CompanyLogo en producción.
   `logoUrl` es el ícono resuelto del sitio de la empresa, verificado a mano
   para las que Google no indexa o indexa mal: se confirmó que el sitio es de
   esa empresa y que la URL devuelve una imagen. Las restantes no tienen
   presencia web y caen al monograma.

   Segunda pasada (2026-08-17). El favicon de Google devuelve 16x16 incluso
   pidiendo sz=128, y a 48px de placa eso se ve como un borrón, así que se
   fueron a buscar los logos del header y del app icon de cada sitio. Se
   midieron uno por uno: tamaño real, cuadratura, canal alfa y luminancia
   media. Entraron seis —YPF (SVG 300x81), TotalEnergies (208x152), Pampa,
   GeoPark, CAPEX y PAE, que pasa del favicon al apple-touch-icon porque es
   cuadrado y llena la placa—. Los seis con transparencia.

   Dos advertencias para el que agregue más:
   · varios sitios publican SÓLO la versión blanca del logo, para header
     oscuro. Es el caso del lockup de PAE (luminancia 255 medida): sobre una
     placa clara desaparece. Hay que medir la luminancia, no confiar en que
     "se ve bien" en el sitio de origen.
   · los lockups son apaisados y la placa es cuadrada, así que se dibujan
     chicos —el de YPF, a 13px de alto sobre 48—. Se leen igual porque son
     letras grandes, y llenar la placa exigiría recortar el logo, que a una
     marca no se le hace.
   NO editar a mano los números: se regeneran re-scrapeando el sitio. */

export type Company = {
  rank: number
  slug: string
  name: string
  sector: string
  pctNacional: number
  pctValor: number
  proyectos: number
  /** false → chip "Privada" (producción sólo lo muestra cuando lo sabe) */
  isPublic: boolean
  exchange?: string
  ticker?: string
  price?: number
  /** variación del día en %, con signo */
  change?: number
  website?: string
  /** Ícono resuelto del sitio de la empresa (para las que Google no indexa).
      Tiene prioridad sobre el favicon de Google que deriva de `website`. */
  logoUrl?: string
  blurb?: string
}

const c = (
  rank: number,
  slug: string,
  name: string,
  pctNacional: number,
  pctValor: number,
  proyectos: number,
  extra?: Partial<Company>,
): Company => ({
  rank,
  slug,
  name,
  sector: 'Petróleo & Gas',
  pctNacional,
  pctValor,
  proyectos,
  isPublic: false,
  ...extra,
})

export const COMPANIES: Company[] = [
  c(1, 'ypf', 'YPF S.A.', 34.2, 45.6, 5725, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'YPF',
    price: 48.76,
    change: -1.8,
    website: 'www.ypf.com',
    logoUrl: 'https://ypf.com/images/menu-principal/ypf_logoazul.svg',
    blurb: 'La mayor operadora del país y ancla del desarrollo de Vaca Muerta.',
  }),
  c(2, 'pae', 'PAN AMERICAN ENERGY SL', 10.9, 10.9, 4471, {
    blurb: 'Integrada privada líder, del Golfo San Jorge al gas de Vaca Muerta.',
    logoUrl: 'https://www.pan-energy.com/Style%20Library/PAE/images/apple-touch-icon-114x114.png',
  }),
  c(3, 'cgc', 'CGC (Compañía General de Combustibles)', 2.6, 1.9, 1521, {
    website: 'www.cgcenergia.com.ar',
  }),
  c(4, 'pcr', 'PETROQUIMICA COMODORO RIVADAVIA S.A.', 0.6, 0.9, 1312),
  c(5, 'patagonia_resources_sa', 'PATAGONIA RESOURCES S.A.', 0.3, 0.5, 1256),
  c(6, 'clear_petroleum_sa', 'Clear Petroleum S.A.', 0.3, 0.6, 1177),
  c(7, 'roch_sa', 'ROCH S.A.', 0.3, 0.4, 1123, { logoUrl: 'https://www.roch.com.ar/wp-content/uploads/2026/07/cropped-cropped-roch-favicon-32x32.png' }),
  c(8, 'petroleos_sudamericanos_sa', 'PETROLEOS SUDAMERICANOS S.A.', 0.9, 1.7, 1083),
  c(9, 'quintana_e_p_argentina_srl', 'QUINTANA E&P ARGENTINA S.R.L.', 0.9, 0.8, 859),
  c(10, 'pluspetrol', 'Pluspetrol S.A.', 8.4, 7.7, 840, {
    website: 'www.pluspetrol.com',
    blurb: 'Gas rico en La Calera y expansión en la ventana húmeda.',
  }),
  c(11, 'capex', 'CAPEX S.A.', 1.2, 1.3, 740, {
    isPublic: true,
    exchange: 'BUE',
    ticker: 'CAPX',
    price: 3400,
    change: -8.6,
    website: 'www.capex.com.ar',
    logoUrl: 'https://capex.com.ar/wp-content/uploads/2023/11/isotipo-seccion-con-fondo.svg',
  }),
  c(12, 'aconcagua', 'Petrolera Aconcagua Energía S.A.', 0.5, 0.7, 722, { logoUrl: 'https://aconcaguaenergia.com/wp-content/uploads/2026/05/cropped-favicon-32x32.png' }),
  c(13, 'crown_point', 'CROWN POINT ENERGIA S.A.', 0.3, 0.6, 697, { logoUrl: 'https://crownpointenergy.com/wp-content/uploads/2020/05/logo-45x45.png' }),
  c(14, 'cap', 'COMPAÑÍAS ASOCIADAS PETROLERAS S.A.', 0.7, 1.3, 673),
  c(15, 'pecom_servicios_energia_sau', 'PECOM SERVICIOS ENERGIA SAU', 0.7, 1.4, 618),
  c(16, 'oilstone_energia_sa', 'OILSTONE ENERGIA S.A.', 0.3, 0.2, 491, { logoUrl: 'https://oilstone.com.ar/assets/images/logo-128x128-95-128x128.png' }),
  c(17, 'bentia_energy_sa', 'BENTIA ENERGY S.A.', 0.3, 0.4, 418),
  c(18, 'vista', 'Vista Energy', 4.4, 7.7, 400, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'VIST',
    price: 65.78,
    change: -0.5,
    website: 'www.vistaenergy.com',
    blurb: 'Pure play de shale oil con la mejor curva de eficiencia de la cuenca.',
  }),
  c(19, 'totalenergies', 'TotalEnergies', 11.7, 0.9, 366, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'TTE',
    price: 88.18,
    change: 3.5,
    website: 'www.totalenergies.com',
    logoUrl: 'https://totalenergies.com/themes/custom/totalenergies_com/dist/img/logo_totalenergies.png',
  }),
  c(20, 'tecpetrol', 'Tecpetrol S.A.', 7.7, 2.4, 349, {
    website: 'www.tecpetrol.com',
    blurb: 'Fortín de Piedra: el desarrollo de gas más rápido de la cuenca.',
  }),
  c(21, 'flxs_oge_sa', 'FLXS OGE S.A', 0.3, 0.0, 314),
  c(22, 'pampa', 'Pampa Energía S.A.', 5.8, 2.2, 277, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'PAM',
    price: 79.77,
    change: -5.9,
    website: 'www.pampaenergia.com',
    logoUrl: 'https://pampa.com/wp-content/uploads/2023/12/pampa-favicon.svg',
  }),
  c(23, 'brest_sa_de_servicios_petroleros', 'BREST S.A. DE SERVICIOS PETROLEROS', 0.1, 0.1, 175),
  c(24, 'shell', 'Shell Argentina', 2.4, 3.9, 162, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'SHEL',
    price: 90.56,
    change: 0.8,
    website: 'www.shell.com.ar',
    blurb: 'Bandurria Sur y Sierras Blancas, foco en crudo de exportación.',
  }),
  c(25, 'venoil_sa', 'VENOIL S.A.', 0.2, 0.2, 137),
  c(26, 'chevron', 'Chevron Argentina', 1.5, 2.1, 122, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'CVX',
    price: 196.31,
    change: 3.1,
    website: 'www.chevron.com',
    blurb: 'Socio histórico de YPF en Loma Campana.',
  }),
  c(27, 'petrolera_el_trebol', 'PETROLERA EL TREBOL S.A.', 0.4, 0.7, 82),
  c(28, 'petrolera_santa_maria_sau', 'PETROLERA SANTA MARIA SAU', 0.6, 0.2, 58),
  c(29, 'pampetrol_sapem', 'PAMPETROL S.A.P.E.M', 0.0, 0.0, 46),
  c(30, 'edhipsa', 'EDHIPSA', 0.0, 0.0, 41, { logoUrl: 'https://www.edhipsa.com.ar/images/favicon.png' }),
  c(31, 'madalena_energy_argentina_srl', 'MADALENA ENERGY ARGENTINA SRL', 0.0, 0.0, 41),
  c(32, 'pilgrim_energy_sa', 'Pilgrim Energy S.A.', 0.0, 0.0, 38),
  c(33, 'colhue_huapi_sa', 'COLHUE HUAPI S.A.', 0.0, 0.0, 32),
  c(34, 'emesa', 'E.M.E.S.A', 0.0, 0.0, 29, { logoUrl: 'https://emesa.com.ar/wp-content/uploads/2021/04/favicon.png' }),
  c(35, 'hattrick_energy_sas', 'HATTRICK ENERGY SAS', 0.1, 0.1, 29),
  c(36, 'ingenieria_alpa_sa', 'INGENIERIA ALPA S.A.', 0.0, 0.0, 27),
  c(37, 'interoil', 'INTEROIL ARGENTINA S A', 0.1, 0.0, 26),
  c(38, 'copesa_cia_constructora_petrolera_sa', 'COPESA CIA CONSTRUCTORA PETROLERA SA', 0.0, 0.0, 25),
  c(39, 'azruge_sa', 'AZRUGE S.A.', 0.0, 0.0, 20),
  c(40, 'vm_inversiones', 'VACA MUERTA INVERSIONES SAU', 0.3, 0.4, 18),
  c(41, 'medanito', 'MEDANITO S.A.', 0.0, 0.0, 15, { logoUrl: 'https://www.medanito.com.ar/wp-content/uploads/2024/04/cropped-icono-32x32.png' }),
  c(42, 'jujuy_hidrocarburos_sau', 'JUJUY HIDROCARBUROS SAU', 0.0, 0.0, 11),
  c(43, 'recursos_y_energia_formosa_sa', 'RECURSOS Y ENERGIA FORMOSA S.A.', 0.0, 0.1, 10),
  c(44, 'alianza_petrolera_argentina_sa', 'ALIANZA PETROLERA ARGENTINA S.A.', 0.0, 0.0, 9),
  c(45, 'geopark', 'GeoPark Argentina', 0.0, 0.1, 9, {
    isPublic: true,
    exchange: 'NYQ',
    ticker: 'GPRK',
    price: 9.35,
    change: -0.4,
    website: 'www.geo-park.com',
    logoUrl: 'https://www.geo-park.com/wp-content/uploads/2022/04/cropped-favicon_new-192x192.png',
  }),
  c(46, 'patagonia_energy_sa', 'PATAGONIA ENERGY S.A.', 0.0, 0.0, 9),
  c(47, 'petrolsur_energia_sa', 'PETROLSUR ENERGIA S.A.', 0.0, 0.0, 9),
  c(48, 'fomicruz', 'FOMICRUZ S.E.', 0.0, 0.0, 3),
  c(49, 'g_y_g_oil_service_srl', 'G Y G OIL SERVICE SRL', 0.0, 0.0, 3),
  c(50, 'geopetrol_drilling_sa', 'GEOPETROL DRILLING S.A.', 0.0, 0.0, 2),
  c(51, 'petrofaro_sa', 'PETROFARO S.A.', 0.0, 0.0, 2),
  c(52, 'high_luck_group_ltd___sucursal_argentina', 'HIGH LUCK GROUP LTD. - SUCURSAL ARGENTINA', 0.0, 0.0, 1),
]
