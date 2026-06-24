/**
 * Localization for the /inversiones payload. The endpoint historically emitted
 * Spanish-only text; this module externalizes every user-visible string so the
 * controller can serve `es` or `en` based on the request's Accept-Language.
 *
 * Only descriptive copy is translated. Proper nouns (org names like INDEC, BCRA,
 * EIA, YPF; operator/project names from the DB) and neutral units (bbl/d, US$, %,
 * ARS/USD) are kept as-is. Numbers are formatted with the locale's conventions.
 */

export type Lang = 'es' | 'en';

/** Map an Accept-Language header (or any locale tag) to a supported language. */
export function pickLang(acceptLanguage?: string | null): Lang {
  return acceptLanguage?.toLowerCase().trim().startsWith('en') ? 'en' : 'es';
}

/** Intl locale used for number formatting per language. */
export function numLocale(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'es-AR';
}

/** Source attributions — descriptive label translated, org names + URLs kept. */
export function sources(lang: Lang) {
  const en = lang === 'en';
  return {
    PROD: {
      label: en ? 'Secretaría de Energía — well production' : 'Secretaría de Energía — Producción de pozos',
      url: 'https://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo',
    },
    EXPORT: {
      label: en ? 'Exports by sector (provinces)' : 'Exportaciones por sector (provincias)',
      url: 'https://datos.energia.gob.ar/',
    },
    BRENT: { label: 'EIA (Brent)', url: 'https://www.eia.gov/dnav/pet/hist/RBRTEM.htm' },
    GDP: {
      label: en ? 'World Bank (nominal GDP, US$)' : 'Banco Mundial (PBI nominal, US$)',
      url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=AR',
    },
    WORLD: {
      label: en
        ? 'EIA — International Energy Statistics (production by country)'
        : 'EIA — International Energy Statistics (producción por país)',
      url: 'https://www.eia.gov/international/data/world',
    },
    SHALE: {
      label: 'EIA — Technically Recoverable Shale Oil and Shale Gas Resources (2013)',
      url: 'https://www.eia.gov/analysis/studies/worldshalegas/',
    },
    RIGI: {
      label: en ? 'Ministry of Economy — RIGI Registry (Law 27.742)' : 'Ministerio de Economía — Registro RIGI (Ley 27.742)',
      url: 'https://www.argentina.gob.ar/economia/rigi',
    },
    BREAKEVEN_REFERENCE: {
      label: en ? 'YPF (Vaca Muerta breakeven ~US$45/bbl)' : 'YPF (breakeven Vaca Muerta ~US$45/bbl)',
      url: 'https://www.ypf.com/inversoresaccionistas/Paginas/informacion-financiera.aspx',
    },
    MACRO: {
      fx_a3500: {
        label: en ? 'BCRA — Wholesale Exchange Rate (Com. A 3500)' : 'BCRA — Tipo de Cambio Mayorista (Com. A 3500)',
        url: 'https://www.bcra.gob.ar/',
      },
      ipc_mensual: {
        label: en
          ? 'INDEC — monthly CPI change (National General Level)'
          : 'INDEC — IPC variación mensual (Nivel General Nacional)',
        url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
      },
      fiscal_primario: {
        label: en ? 'Treasury Secretariat — primary balance (IMIG)' : 'Secretaría de Hacienda — Resultado primario (IMIG)',
        url: 'https://www.argentina.gob.ar/economia/sechacienda',
      },
    } as Record<string, { label: string; url: string }>,
  };
}

export type Sources = ReturnType<typeof sources>;

/** All descriptive strings, with template helpers for the computed sentences. */
export function strings(lang: Lang) {
  const en = lang === 'en';
  return {
    note: en
      ? 'All figures are computed from official data already ingested by the pipeline. UNDERWAY / PROJECTED figures will be added with their verifiable source.'
      : 'Todas las cifras se computan a partir de datos oficiales ya ingeridos por el pipeline. Las cifras EN MARCHA / PROYECTADO se agregarán con su fuente verificable.',

    headline: (sharePct: string, bblD: string, asOf: string) =>
      en
        ? `Vaca Muerta accounts for ${sharePct}% of national oil and produces ${bblD} bbl/d (${asOf}).`
        : `Vaca Muerta concentra el ${sharePct}% del petróleo nacional y produce ${bblD} bbl/d (${asOf}).`,

    serieTitle: en ? 'Vaca Muerta oil production' : 'Producción de petróleo en Vaca Muerta',
    actividadUnit: en ? 'wells/month' : 'pozos/mes',
    cruceTitle: en ? 'Exports: agri vs energy' : 'Exportaciones: agro vs energía',

    // KPI labels
    kpi: {
      produccionVm: en ? 'VM oil production' : 'Producción de petróleo VM',
      participacionPetroleo: en ? 'Share of national oil' : 'Participación en petróleo nacional',
      participacionGas: en ? 'Share of national gas' : 'Participación en gas nacional',
      produccionNacional: en ? 'National oil production' : 'Producción nacional de petróleo',
      pozosActivos: en ? 'Active wells in VM' : 'Pozos activos en VM',
      exportacionesEnergia: en ? 'Energy exports (annual)' : 'Exportaciones de energía (anual)',
      superavitEnergia: en ? 'Energy trade surplus (annual)' : 'Superávit comercial energético (anual)',
    },
    wellsSuffix: en ? ' wells' : ' pozos',

    // World-stage product labels
    product: {
      oil: en ? 'Crude oil' : 'Petróleo crudo',
      gas: en ? 'Natural gas' : 'Gas natural',
    } as Record<string, string>,

    shaleNote: en
      ? "Vaca Muerta holds the world's 2nd-largest technically recoverable shale gas resource and the 4th-largest shale oil."
      : 'Vaca Muerta concentra el 2.º recurso de shale gas y el 4.º de shale oil técnicamente recuperable del mundo.',

    // Policy levers
    lever: {
      fxTag: en ? 'FX' : 'Cambiario',
      fxTitle: en
        ? 'Exchange-rate normalization and FX access for exporters'
        : 'Normalización del tipo de cambio y acceso a divisas para exportadores',
      exportTag: en ? 'Exports' : 'Exportación',
      exportTitle: en
        ? 'End of export quotas and duties on crude and gas'
        : 'Fin de los cupos y retenciones a la exportación de crudo y gas',
      rigiTag: 'RIGI',
      rigiTitle: en
        ? 'Large Investment Incentive Regime: 30-year fiscal stability'
        : 'Régimen de Incentivo a Grandes Inversiones: estabilidad fiscal a 30 años',
      rigiMilestone: en
        ? 'Regime in force (Law 27.742): fiscal, FX and customs stability for 30 years.'
        : 'Régimen vigente (Ley 27.742): estabilidad fiscal, cambiaria y aduanera por 30 años.',
      fiscalTag: en ? 'Fiscal' : 'Fiscal',
      fiscalTitle: en
        ? 'Fiscal discipline and deregulation that anchor investment predictability'
        : 'Disciplina fiscal y desregulación que anclan la previsibilidad de inversión',
    },

    // Policy indicators
    indicator: {
      inflacionMensual: en ? 'Monthly inflation' : 'Inflación mensual',
      superavitEnergetico: en ? 'Energy trade surplus' : 'Superávit comercial energético',
      inversionComprometida: en ? 'Committed investment (oil and gas)' : 'Inversión comprometida (petróleo y gas)',
      mesesSuperavit: en ? 'Months with primary surplus (last 12)' : 'Meses con superávit primario (últ. 12)',
    },
    pctMesSuffix: en ? '%/mo' : '%/mes',

    // Policy charts
    chart: {
      inflacionTitle: en ? 'Monthly inflation' : 'Inflación mensual',
      fxTitle: en ? 'Wholesale exchange rate (A3500)' : 'Tipo de cambio mayorista (A3500)',
      fiscalTitle: en ? 'Monthly primary balance (NPS)' : 'Resultado primario mensual (SPN)',
      superavitTitle: en ? 'Energy trade surplus' : 'Superávit comercial energético',
    },
    pctMesUnit: en ? '%/mo' : '%/mes',
    arsMillonesUnit: en ? 'ARS million' : 'ARS millones',

    // Impacto
    impacto: {
      headline: (pctGdp: string) =>
        en
          ? `If oil production reaches the target, the incremental exportable value equals ~${pctGdp}% of GDP.`
          : `Si la producción de petróleo alcanza la meta, el valor exportable incremental equivale a ~${pctGdp}% del PBI.`,
      headlineFallback: en
        ? 'If production reaches the target, the export jump accelerates.'
        : 'Si la producción alcanza la meta, el salto exportador se acelera.',
      valorExportable: en ? 'Incremental exportable value' : 'Valor exportable incremental',
      equivalentePbi: en ? 'GDP equivalent' : 'Equivalente en PBI',
      bAnioSuffix: en ? ' B/yr' : ' B/año',
      pctPbiSuffix: en ? '% of GDP' : '% del PBI',
      priceBasis: (months: number) => (en ? `Brent avg. ${months}m (EIA)` : `Brent prom. ${months}m (EIA)`),
    },

    // Política intro
    politicaIntroTitle: en
      ? 'The policy that turns potential into production'
      : 'La política que convierte potencial en producción',
    politicaIntroText: en
      ? 'The resource already exists. What changed is the framework: current measures unlock the investment needed for the projection to materialize — and with it, the jump in the world ranking.'
      : 'El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial.',

    // RIGI block
    rigiTitle: en ? 'RIGI oil & gas projects' : 'Proyectos RIGI de petróleo y gas',
    rigiSubtitle: en ? 'Committed investment in approved projects' : 'Inversión comprometida en proyectos aprobados',
  };
}

export type Strings = ReturnType<typeof strings>;
