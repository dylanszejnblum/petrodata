/* Lo que el dato oficial no trae: la capacidad de los gasoductos (ENARGAS
   publica capacidad contratada por cargador, no por gasoducto) y las obras de
   ampliación. Tabla curada a mano, una fuente por fila. `source_kind` dice qué
   tan firme es: 'filing' = presentación regulatoria (CNV, SEC 20-F), 'company' =
   comunicado de la empresa, 'press' = prensa. Revisada el 2026-10-20: las fechas
   de obra cambian, así que conviene repasarla cada pocos meses. */

export type ObraStatus = 'operating' | 'under_construction' | 'expansion_approved' | 'announced';

export interface CapacidadGas {
  pipeline: string; // clave en fact_pipeline_flow, si tiene flujo
  name: string;
  operator: string;
  capacity_mm3d: number;
  as_of: string;
  source_kind: 'filing' | 'company' | 'press';
  source_url: string;
  note?: string;
}

/** Capacidad de los gasoductos de salida de la cuenca Neuquina. */
export const CAPACIDAD_GAS: CapacidadGas[] = [
  {
    pipeline: 'tgs_neuba',
    name: 'Neuba I + Neuba II (TGS)',
    operator: 'TGS',
    capacity_mm3d: 49,
    as_of: '≤2023',
    source_kind: 'press',
    source_url: 'https://bnamericas.com/en/analysis/how-chile-may-ease-argentinas-gas-dispatch-headache',
    note: 'Approximate; may predate the 2023 Neuba II loop. ENARGAS volumes for Neuba I+II likely include gas received from the Perito Moreno pipeline, so utilization against 49 can exceed 100%.',
  },
  {
    pipeline: 'gpm',
    name: 'Gasoducto Perito Moreno, Tramo I (ex-GPNK)',
    operator: 'ENARSA / TGS',
    capacity_mm3d: 21,
    as_of: '2024-10',
    source_kind: 'filing',
    source_url: 'https://www.sec.gov/Archives/edgar/data/931427/000114036126016167/ef20060824_20f.htm',
    note: 'TGS 20-F FY2025: compressor plants raised capacity from 11 to 21 MMm3/d in Oct 2024. No separate monthly flow in ENARGAS data.',
  },
  {
    pipeline: 'tgn_centro_oeste',
    name: 'Centro Oeste (TGN)',
    operator: 'TGN',
    capacity_mm3d: 28,
    as_of: '?',
    source_kind: 'press',
    source_url: 'https://bnamericas.com/en/analysis/how-chile-may-ease-argentinas-gas-dispatch-headache',
    note: 'Approximate.',
  },
];

export interface Obra {
  name: string;
  type: 'oleoducto' | 'gasoducto' | 'gnl';
  operator: string;
  from: string;
  to: string;
  capacity: number;
  capacity_unit: 'bbl/d' | 'MMm3/d' | 'MTPA';
  /** para GNL: gas de alimentación aproximado, MMm3/d */
  feed_gas_mm3d?: number;
  status: ObraStatus;
  expected: string;
  source_kind: 'filing' | 'company' | 'press';
  source_url: string;
  note?: string;
}

/** Obras de evacuación en marcha o anunciadas. */
export const OBRAS: Obra[] = [
  {
    name: 'VMOS — Vaca Muerta Oleoducto Sur',
    type: 'oleoducto',
    operator: 'VMOS S.A. (YPF, Vista, Pampa, PAE, Chevron, Pluspetrol, Shell y otros)',
    from: 'Allen (Río Negro)',
    to: 'Punta Colorada, terminal de exportación (Río Negro)',
    capacity: 550_000,
    capacity_unit: 'bbl/d',
    status: 'under_construction',
    expected: 'Primer petróleo fines 2026 / inicio 2027 a 180.000 bbl/d; 550.000 bbl/d hacia el 3T-2027 (COD 2027-07-31)',
    source_kind: 'filing',
    source_url: 'https://surtidores.com.ar/wp-content/uploads/2024/12/HR-20241216-Proyecto-Vaca-Muerta-Sur.pdf',
    note: 'Hecho relevante de YPF a la CNV (2024-12-16): 437 km, ampliable a 700.000 bbl/d. Avance y etapa inicial según prensa (LM Neuquén, 2026-07).',
  },
  {
    name: 'Duplicar Norte (Oldelval)',
    type: 'oleoducto',
    operator: 'Oldelval',
    from: 'Auca Mahuida (Neuquén)',
    to: 'Allen (Río Negro)',
    capacity: 500_000,
    capacity_unit: 'bbl/d',
    status: 'under_construction',
    expected: '220.000 bbl/d a fines de 2026; 500.000 bbl/d en el 1T-2027',
    source_kind: 'press',
    source_url: 'https://mase.lmneuquen.com/vaca-muerta/oldelval-acelera-duplicar-norte-un-hito-clave-sacar-mas-petroleo-vaca-muerta-n1252988',
    note: 'Alimenta el nodo de Allen; por sí solo no es una salida nueva al Atlántico.',
  },
  {
    name: 'Duplicar X (Oldelval, Allen–Puerto Rosales)',
    type: 'oleoducto',
    operator: 'Oldelval',
    from: 'Allen',
    to: 'Puerto Rosales',
    capacity: 730_000,
    capacity_unit: 'bbl/d',
    status: 'expansion_approved',
    expected: 'Por etapas, mayo–agosto 2026',
    source_kind: 'press',
    source_url: 'https://www.noticiasnqn.com.ar/noticias/2026/07/24/344839-oldelval-ampliara-la-capacidad-de-transporte-de-petroleo-para-acompanar-el-crecimiento-de-vaca-muerta',
    note: 'De ~530.000 a ~730.000 bbl/d; los 200.000 adicionales son INTERRUMPIBLES, no firmes.',
  },
  {
    name: 'Ampliación Gasoducto Perito Moreno, Tramo I (TGS, RIGI)',
    type: 'gasoducto',
    operator: 'TGS',
    from: 'Tratayén (Neuquén)',
    to: 'Salliqueló (Buenos Aires)',
    capacity: 14,
    capacity_unit: 'MMm3/d',
    status: 'under_construction',
    expected: 'Invierno 2027 (COD 2027-04-01); de 21 a 35 MMm3/d',
    source_kind: 'press',
    source_url: 'https://econojournal.com.ar/2026/02/tgs-inicio-la-ampliacion-del-gasoducto-perito-moreno-y-convoco-a-concurso-abierto-para-adjudicar-la-capacidad-incremental/',
    note: 'RIGI Res. 676/2026. Capacidad incremental.',
  },
  {
    name: 'Ampliación tramos finales del sistema TGS',
    type: 'gasoducto',
    operator: 'TGS',
    from: 'Salliqueló',
    to: 'Gran Buenos Aires',
    capacity: 12,
    capacity_unit: 'MMm3/d',
    status: 'under_construction',
    expected: '2027-04-30',
    source_kind: 'filing',
    source_url: 'https://www.sec.gov/Archives/edgar/data/931427/000114036126016167/ef20060824_20f.htm',
    note: 'Capacidad incremental, complemento aguas abajo de la ampliación del Perito Moreno.',
  },
  {
    name: 'Gasoducto dedicado San Matías (Southern Energy)',
    type: 'gasoducto',
    operator: 'San Matías Pipeline S.A.',
    from: 'Tratayén (Neuquén)',
    to: 'Golfo San Matías (Río Negro)',
    capacity: 27,
    capacity_unit: 'MMm3/d',
    status: 'under_construction',
    expected: 'Operación 2028-05-01',
    source_kind: 'press',
    source_url: 'https://www.shale24.com/oil-gas/el-gobierno-firma-adhesion-gasoducto-sesa-480-kilometros-27-mmmd-60000-hp-exportar-gnl-rio-negro-cuando-arranca-obra-n1366',
    note: 'RIGI Res. 873/2026. ~480 km, 36". Alimenta los dos FLNG de Southern Energy.',
  },
  {
    name: 'FLNG Hilli Episeyo (Southern Energy)',
    type: 'gnl',
    operator: 'Southern Energy S.A. (PAE, YPF, Pampa, Harbour, Golar)',
    from: 'Golfo San Matías',
    to: 'Exportación',
    capacity: 2.45,
    capacity_unit: 'MTPA',
    feed_gas_mm3d: 11.4,
    status: 'under_construction',
    expected: 'Fines de 2027',
    source_kind: 'company',
    source_url: 'https://mfn.se/one/a/golar-lng/golar-entered-into-20-year-agreements-for-5-95mtpa-nameplate-capacity-in-argentina-one-of-the-worlds-largest-flng-development-projects-56afc9e7',
    note: 'Gas de alimentación aproximado, según prensa.',
  },
  {
    name: 'FLNG MKII (Southern Energy)',
    type: 'gnl',
    operator: 'Southern Energy S.A.',
    from: 'Golfo San Matías',
    to: 'Exportación',
    capacity: 3.5,
    capacity_unit: 'MTPA',
    feed_gas_mm3d: 15.6,
    status: 'under_construction',
    expected: '2028',
    source_kind: 'company',
    source_url: 'https://mfn.se/all/a/golar-lng/final-investment-decision-for-20-year-charter-of-mk-ii-flng-to-southern-energy-in-argentina-e2a9131c',
    note: 'Gas de alimentación aproximado, según prensa. Hilli + MKII = 5,95 MTPA.',
  },
  {
    name: 'Argentina LNG (YPF, Eni, XRG) — 2 FLNG',
    type: 'gnl',
    operator: 'YPF / Eni / XRG',
    from: 'Golfo San Matías',
    to: 'Exportación',
    capacity: 12,
    capacity_unit: 'MTPA',
    status: 'announced',
    expected: 'Decisión de inversión pendiente; exportaciones 2030–2031',
    source_kind: 'press',
    source_url: 'https://jpt.spe.org/ypf-eni-xrg-target-fid-for-argentina-lng-export-project-in-mid-2026',
    note: 'Sin decisión final de inversión. No hay cifra publicada de gas de alimentación ni del gasoducto dedicado.',
  },
];
