/**
 * Ticker mappings used by PricesService.
 *
 * COMMODITY_TICKERS — one ticker per commodity. Where no clean futures market
 * exists (Uranium, Lithium) we use the most-traded sector ETF as a proxy.
 *
 * OPERATOR_TICKERS — list of regex patterns matched against the project's
 * `operator` and `owner_controller` strings. First match wins. Private,
 * state-owned, or unmapped operators yield no stock block.
 */

export interface CommodityTicker {
  ticker: string;
  display: string;
  unit: string;
  proxy: boolean;
}

export const COMMODITY_TICKERS: Record<string, CommodityTicker> = {
  Silver: { ticker: 'SI=F', display: 'Silver futures (COMEX)', unit: 'USD/oz', proxy: false },
  Gold: { ticker: 'GC=F', display: 'Gold futures (COMEX)', unit: 'USD/oz', proxy: false },
  Copper: { ticker: 'HG=F', display: 'Copper futures (COMEX)', unit: 'USD/lb', proxy: false },
  Uranium: { ticker: 'URA', display: 'Global X Uranium ETF (proxy — no clean futures market)', unit: 'USD/share', proxy: true },
  Lithium: { ticker: 'LIT', display: 'Global X Lithium & Battery Tech ETF (proxy — no clean futures market)', unit: 'USD/share', proxy: true },
};

export interface OperatorTicker {
  match: RegExp;
  ticker: string;
  name: string;
  exchange: string;
}

/**
 * Order matters: more specific patterns first (e.g. "Lundin Gold" before
 * "Lundin Mining"). Subsidiaries and Argentine entities are matched to their
 * publicly-traded parent. Every entry here has been verified to fire on at
 * least one project in the current dataset's operator or owner_controller
 * field. Add new entries when new decks are ingested.
 */
export const OPERATOR_TICKERS: OperatorTicker[] = [
  // Silver
  { match: /AbraSilver|Abra Plata/i, ticker: 'ABBRF', name: 'AbraSilver Resource Corp.', exchange: 'OTC' },
  { match: /Argenta Silver|SILEX Argentina/i, ticker: 'AGAG.V', name: 'Argenta Silver Corp.', exchange: 'TSXV' },
  { match: /Pan American Silver|Minera Argenta/i, ticker: 'PAAS', name: 'Pan American Silver Corp.', exchange: 'NASDAQ' },
  { match: /SSR Mining|Pirquitas/i, ticker: 'SSRM', name: 'SSR Mining Inc.', exchange: 'NASDAQ' },
  { match: /Hochschild|Minera Santa Cruz/i, ticker: 'HOC.L', name: 'Hochschild Mining plc', exchange: 'LSE' },
  { match: /McEwen Mining|Minera Andes/i, ticker: 'MUX', name: 'McEwen Mining Inc.', exchange: 'NYSE' },

  // Gold
  { match: /Cerrado Gold|Minera Don Nicolás/i, ticker: 'CERT.V', name: 'Cerrado Gold Inc.', exchange: 'TSXV' },
  { match: /Newmont|OroPlata/i, ticker: 'NEM', name: 'Newmont Corporation', exchange: 'NYSE' },
  { match: /AngloGold Ashanti|Cerro Vanguardia/i, ticker: 'AU', name: 'AngloGold Ashanti plc', exchange: 'NYSE' },
  { match: /Barrick|Minera Andina Del Sol/i, ticker: 'GOLD', name: 'Barrick Gold Corporation', exchange: 'NYSE' },

  // Copper
  { match: /Aldebaran/i, ticker: 'ALDE.V', name: 'Aldebaran Resources Inc.', exchange: 'TSXV' },
  { match: /Lundin Mining/i, ticker: 'LUN.TO', name: 'Lundin Mining Corporation', exchange: 'TSX' },
  { match: /Glencore|El Pachón/i, ticker: 'GLEN.L', name: 'Glencore plc', exchange: 'LSE' },
  { match: /First Quantum|Corriente Argentina/i, ticker: 'FM.TO', name: 'First Quantum Minerals Ltd.', exchange: 'TSX' },

  // Lithium
  { match: /Lake Resources/i, ticker: 'LKE.AX', name: 'Lake Resources NL', exchange: 'ASX' },
  { match: /Galan( Litio| Exploraciones)?/i, ticker: 'GLN.AX', name: 'Galan Lithium Limited', exchange: 'ASX' },
  { match: /Eramet|Eramine/i, ticker: 'ERA.PA', name: 'Eramet SA', exchange: 'EPA' },
  { match: /POSCO|Lithea/i, ticker: '005490.KS', name: 'POSCO Holdings Inc.', exchange: 'KRX' },
  { match: /Ganfeng|Litio Minera Argentina/i, ticker: '1772.HK', name: 'Ganfeng Lithium Group Co., Ltd.', exchange: 'HKEX' },
  { match: /Rio Tinto|Rincon Mining/i, ticker: 'RIO', name: 'Rio Tinto Group', exchange: 'NYSE' },

  // Uranium
  { match: /Blue Sky Uranium|Ivana Minerales/i, ticker: 'BSK.V', name: 'Blue Sky Uranium Corp.', exchange: 'TSXV' },
];

export function findOperatorTicker(operator: string | null | undefined, ownerController?: string | null): OperatorTicker | null {
  const haystacks = [operator, ownerController].filter((s): s is string => !!s && !!s.trim());
  for (const text of haystacks) {
    for (const entry of OPERATOR_TICKERS) {
      if (entry.match.test(text)) return entry;
    }
  }
  return null;
}
