import type { MineralCommodity } from '@/fixtures/projects'

/* token-exception: maplibre no resuelve CSS vars — hex espejo de los tokens
   (lithium→--status-positive, copper→--status-caution, gold→--status-caution dark,
   silver→--text-tertiary, uranium→--data-gas). Solo para capas del mapa y su leyenda. */
export const COMMODITY_HEX: Record<MineralCommodity, string> = {
  lithium: '#0aa173',
  copper: '#9a7420',
  gold: '#c49a3f',
  silver: '#837f7c',
  uranium: '#2382cf',
}
