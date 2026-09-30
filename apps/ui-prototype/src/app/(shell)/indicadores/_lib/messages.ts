/* Textos ES de producción (frontend/src/messages/es.json → namespace
   "indicadores"), con un shim mínimo de la API de next-intl para que los
   componentes portados queden idénticos al código real. */

const MESSAGES = {
 "eyebrow": "Tesis de inversión",
 "title": "Indicadores",
 "blurb": "La oportunidad de Vaca Muerta en números: cada cifra se computa a partir de datos oficiales de producción y exportación, con su fuente y fecha de corte. Sin proyecciones sin respaldo.",
 "asOf": "Datos al {month}",
 "operatorsTitle": "Operadores principales",
 "contribution": {
  "title": "Contribución económica por operadora",
  "blurb": "Cuánto aporta la operación de cada empresa al país: valor bruto de producción en dólares, regalías provinciales y exportaciones de energía atribuidas según su participación en la producción.",
  "grossValue": "Valor bruto de producción",
  "annualizedNote": "anualizado · Brent promedio US$ {brent}",
  "windowNote": "últimos {months} meses",
  "ofGdp": "% del PBI ({year})",
  "royalties": "Regalías (12%)",
  "exports": "Exportaciones de energía",
  "colOperator": "Operadora",
  "colShare": "Part. BOE",
  "colValueShare": "Part. US$",
  "colGross": "Valor bruto",
  "colRoyalties": "Regalías",
  "colExports": "Expo. atribuidas",
  "methodology": "Metodología: volúmenes oficiales (Secretaría de Energía) por operadora, ventana {from} a {to}. Petróleo valuado a Brent (promedio US$ {brent}/bbl) menos US$ {discount}/bbl de descuento por calidad; gas al precio PIST promedio ponderado (US$ {pist}/MMBtu). Regalías a la alícuota legal del {royalty}% sobre el valor en boca de pozo. Exportaciones de energía (INDEC) atribuidas pro rata por participación en BOE: son estimaciones, no cifras contables de cada empresa."
 },
 "transportTitle": "Infraestructura de transporte",
 "transportBlurb": "La red troncal que evacúa la producción: gasoductos de transporte por operador y oleoductos troncales. Geometría y trazas oficiales — sin datos de caudal en la fuente.",
 "transportNetwork": "Red troncal",
 "transportGas": "Gasoductos",
 "transportOil": "Oleoductos",
 "transportSegments": "{count} tramos",
 "transportByOperator": "Gasoductos de transporte por operador",
 "kmUnit": "km",
 "worldTitle": "Argentina en el mundo",
 "worldBlurb": "Dónde está Argentina hoy entre los productores del mundo, y a dónde la lleva Vaca Muerta si la proyección se realiza. El salto en el ranking, con datos de la EIA.",
 "charts": {
  "noProduction": "Sin datos de producción.",
  "noActivity": "Sin datos de actividad.",
  "noTrade": "Sin datos de comercio.",
  "noBrent": "Sin serie histórica de Brent.",
  "preliminary": "preliminar",
  "preliminaryPartial": "Dato preliminar (mes parcial)",
  "wells": "pozos",
  "agro": "Agro",
  "agroLegend": "Agro (primarios + MOA)",
  "energy": "Energía",
  "pctGdpSuffix": "% PBI",
  "breakevenHeadroom": "Headroom sobre breakeven"
 },
 "world": {
  "unitTbpd": "mil bbl/d",
  "unitBcf": "BCF/año",
  "worldProduction": "{label} · producción mundial",
  "fastestGrowing": "{label} · productores de mayor crecimiento",
  "growthBlurb": "Entre los grandes productores, Argentina es de los que más rápido crece{rank} — el ritmo que la proyección extiende.",
  "growthRank": " (puesto {rank})",
  "impactKicker": "Impacto · si la proyección se realiza",
  "assumptions": "Supuestos:",
  "assumptionPrice": " precio de exportación US${price}/bbl ({basis});",
  "assumptionProd": " producción {from} → {to} bbl/d;",
  "assumptionGdp": " PBI US${gdp} B ({year}).",
  "illustrative": "Proyección ilustrativa, no es un pronóstico.",
  "sectorOil": "petróleo",
  "sectorGas": "gas",
  "policyFallbackTitle": "La política que convierte potencial en producción",
  "policyFallbackText": "El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial.",
  "jumpLabel": "Salto proyectado · {year}",
  "countriesCount": "{countries} países"
 },
 "breakevenTitle": "Margen sobre el breakeven",
 "actividadTitle": "Actividad: pozos nuevos por mes",
 "cruceBlurb": "Exportaciones anuales en dólares. La energía gana peso frente al agro a medida que Vaca Muerta escala.",
 "cruceModeLabel": "Unidad",
 "cruceModeUsd": "US$",
 "cruceModeGdp": "% del PBI",
 "thesisLabel": "La tesis en seis datos",
 "thesisBlurb": "La tesis en seis cifras verificables: producción, participación, actividad y comercio exterior — cada una con su fuente y su variación interanual.",
 "breakevenBlurb": "El Brent contra el costo de desarrollo de referencia de la cuenca (US$ 45/bbl, YPF): la banda es el margen del negocio, mes a mes.",
 "serieBlurb": "La rampa de producción de petróleo de Vaca Muerta, mes a mes. El tramo punteado es el último dato, todavía parcial.",
 "actividadBlurb": "El pulso de la perforación: pozos nuevos conectados por mes. La actividad de hoy anticipa la producción de los próximos trimestres.",
 "operatorsBlurb": "Quién produce el petróleo de la cuenca: las principales operadoras por volumen diario y participación sobre el total.",
 "growthSectionBlurb": "Entre los grandes productores del mundo, la métrica que importa acá: velocidad. Argentina, empujada por Vaca Muerta, corre en el pelotón de punta.",
 "politicaBlurb": "Las variables macro que condicionan la inversión — inflación, tipo de cambio, resultado fiscal y superávit energético — y las medidas que destraban el capital.",
 "rigiBlurb": "Los proyectos de petróleo y gas con inversión comprometida bajo el Régimen de Incentivo a Grandes Inversiones. Aprobados, no anunciados.",
 "impactoBlurb": "Qué significa para la economía si la proyección a 2030 se cumple: valor exportable, PBI y producción. Ilustrativo, con supuestos explícitos.",
 "growthTitle": "Productores de mayor crecimiento",
 "politicaTitle": "Política económica",
 "rigiTitle": "RIGI · Inversión comprometida",
 "impactoTitle": "Impacto proyectado"
} as const

function lookup(key: string): string {
  let cur: unknown = MESSAGES
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part]
    } else return key
  }
  return typeof cur === 'string' ? cur : key
}

export type T = (key: string, values?: Record<string, string | number>) => string

/** Igual firma que next-intl: useTranslations('indicadores.contribution') */
export function useTranslations(ns: string): T {
  const prefix = ns.replace(/^indicadores\.?/, '')
  return (key, values) => {
    let s = lookup(prefix ? `${prefix}.${key}` : key)
    if (values) for (const [k, v] of Object.entries(values)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }
}

