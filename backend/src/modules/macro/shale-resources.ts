/* Recursos técnicamente recuperables de shale, por país. Es una tabla FIJA: la
   EIA no la actualizó desde septiembre de 2015, así que no tiene sentido
   cargarla en la base. Cifras «unproved technically recoverable», gas húmedo en
   Tcf y petróleo (tight oil) en miles de millones de barriles. El dato de EE.UU.
   sale del AEO2015 y no del método ARI de los demás países. */
export const SHALE_RESOURCES = {
  source: 'EIA/ARI, World Shale Resource Assessments (updated September 2015)',
  source_url: 'https://www.eia.gov/analysis/studies/worldshalegas/',
  countries_assessed: 46,
  world_total: { gas_tcf: 7576.6, oil_bbbl: 418.9 },
  gas_top10: [
    { rank: 1, country: 'China', gas_tcf: 1115.2 },
    { rank: 2, country: 'Argentina', gas_tcf: 801.5 },
    { rank: 3, country: 'Algeria', gas_tcf: 706.9 },
    { rank: 4, country: 'United States', gas_tcf: 622.5 },
    { rank: 5, country: 'Canada', gas_tcf: 572.9 },
    { rank: 6, country: 'Mexico', gas_tcf: 545.2 },
    { rank: 7, country: 'Australia', gas_tcf: 429.3 },
    { rank: 8, country: 'South Africa', gas_tcf: 389.7 },
    { rank: 9, country: 'Russia', gas_tcf: 284.5 },
    { rank: 10, country: 'Brazil', gas_tcf: 244.9 },
  ],
  oil_top10: [
    { rank: 1, country: 'United States', oil_bbbl: 78.2 },
    { rank: 2, country: 'Russia', oil_bbbl: 74.6 },
    { rank: 3, country: 'China', oil_bbbl: 32.2 },
    { rank: 4, country: 'Argentina', oil_bbbl: 27.0 },
    { rank: 5, country: 'Libya', oil_bbbl: 26.1 },
    { rank: 6, country: 'United Arab Emirates', oil_bbbl: 22.6 },
    { rank: 7, country: 'Chad', oil_bbbl: 16.2 },
    { rank: 8, country: 'Australia', oil_bbbl: 15.6 },
    { rank: 9, country: 'Venezuela', oil_bbbl: 13.4 },
    { rank: 10, country: 'Mexico', oil_bbbl: 13.1 },
  ],
  // Attachment A (xlsx por formación), sólo Argentina
  argentina_by_formation: [
    { formation: 'Vaca Muerta', basin: 'Neuquina', gas_tcf: 307.8, oil_bbbl: 16.23 },
    { formation: 'Los Molles', basin: 'Neuquina', gas_tcf: 275.4, oil_bbbl: 3.66 },
    { formation: 'L. Inoceramus', basin: 'Austral', gas_tcf: 129.5, oil_bbbl: 6.56 },
    { formation: 'Aguada Bandera', basin: 'Golfo San Jorge', gas_tcf: 50.8, oil_bbbl: 0 },
    { formation: 'D-129', basin: 'Golfo San Jorge', gas_tcf: 34.9, oil_bbbl: 0.5 },
    { formation: 'Ponta Grossa', basin: 'Chaco-Paraná', gas_tcf: 3.2, oil_bbbl: 0.01 },
  ],
} as const;
