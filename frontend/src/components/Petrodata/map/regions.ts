export type Bounds = [[number, number], [number, number]]

export const PROVINCE_BOUNDS: Record<string, Bounds> = {
  Neuquén: [
    [-71.0, -41.0],
    [-68.0, -36.5],
  ],
  'Río Negro': [
    [-71.5, -42.0],
    [-62.5, -37.5],
  ],
  Mendoza: [
    [-70.5, -37.5],
    [-66.5, -32.0],
  ],
  'La Pampa': [
    [-68.5, -39.5],
    [-63.5, -35.0],
  ],
  Chubut: [
    [-72.0, -46.0],
    [-63.5, -42.0],
  ],
  'Santa Cruz': [
    [-73.0, -52.5],
    [-65.0, -46.0],
  ],
  'Tierra del Fuego': [
    [-69.0, -56.0],
    [-63.5, -52.5],
  ],
  Salta: [
    [-68.5, -26.0],
    [-62.5, -22.0],
  ],
  Jujuy: [
    [-67.0, -24.5],
    [-64.0, -21.8],
  ],
  Formosa: [
    [-62.5, -27.0],
    [-57.5, -22.5],
  ],
  Tucumán: [
    [-66.0, -27.8],
    [-64.5, -26.0],
  ],
  Chaco: [
    [-63.0, -28.0],
    [-58.0, -24.5],
  ],
}

export const BASIN_BOUNDS: Record<string, Bounds> = {
  NOROESTE: [
    [-67.0, -27.5],
    [-58.5, -22.0],
  ],
  NEUQUINA: [
    [-71.5, -42.0],
    [-65.0, -34.0],
  ],
  CUYANA: [
    [-69.5, -35.0],
    [-67.0, -31.5],
  ],
  'GOLFO SAN JORGE': [
    [-71.5, -48.0],
    [-65.0, -44.5],
  ],
  AUSTRAL: [
    [-73.0, -56.0],
    [-65.0, -50.0],
  ],
}

export const ARGENTINA_BOUNDS: Bounds = [
  [-74, -56],
  [-53, -21],
]
