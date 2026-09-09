/* Pozos — GET /api/v1/geo/wells (GeoJSON crudo).
   Mapea GeoWellFeatureDto → WellFeature del fixture
   (id/name/operator/status/recurso). El GeoJSON NO trae producción por pozo:
   por eso el recurso sale de `well_type` y no de comparar bbl/d contra MMm³/d,
   y el popup del mapa pide /v1/wells/{id} para la grilla de producción. */

import { api, type ApiSchemas } from '@/api/client'
import type { WellFeature } from '@/fixtures/wells'
import { WELLS as FIXTURE_WELLS } from '@/fixtures/wells'
import { withFallback } from './fallback'
import { mapStatus, mapWellType, nombreOperadora } from './clasificar'

/** GeoJSON crudo de la API → WellFeature. Se usa del lado del servidor
    (loadWells) y también del cliente, cuando el mapa pide los pozos de UNA
    operadora al seleccionarla en el panel. */
export function toWellFeatures(
  features: ApiSchemas['GeoWellFeatureDto'][],
): WellFeature[] {
  return features
    .filter((f) => f.geometry?.coordinates?.length === 2)
    .map((f) => {
      const p = f.properties
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
        },
        properties: {
          id: p.well_id,
          name: p.sigla,
          operator: p.operator_slug,
          operatorName: nombreOperadora(p.operator_slug, p.operator_name),
          status: mapStatus(p.status_code),
          recurso: mapWellType(p.well_type),
          statusCode: p.status_code,
          formation: p.formation_slug,
          basin: p.basin,
          province: p.province,
          concession: p.concession,
          yacimiento: p.yacimiento,
          depth: typeof p.depth_m === 'number' ? p.depth_m : null,
        },
      }
    })
}

/** Pozos de una operadora, ya filtrados por la API (formation + operator).
 *  Del lado del cliente: el mapa llama acá al seleccionar una operadora, como
 *  hace la v1 al refetchear con ?operator=. */
export async function fetchWellsByOperator(operator: string, limit = 1000): Promise<WellFeature[] | null> {
  try {
    const { data, error } = await api.GET('/api/v1/geo/wells', {
      params: { query: { formation: 'vaca_muerta', operator, limit } },
    })
    if (error || !data?.features?.length) return null
    return toWellFeatures(data.features)
  } catch {
    return null
  }
}

export async function fetchMapWells(filters: {
  operator?: string
  basin?: string
  province?: string
  formation?: string
}, limit = 1000, signal?: AbortSignal): Promise<WellFeature[] | null> {
  try {
    const query = new URLSearchParams({ limit: String(limit) })
    for (const [name, value] of Object.entries(filters)) {
      if (value) query.set(name, value)
    }
    const response = await fetch(`/api/map-wells?${query}`, {
      cache: 'no-store',
      signal,
    })
    if (!response.ok) return null
    const data = (await response.json()) as ApiSchemas['GeoWellFeatureCollectionDto']
    if (!data?.features) return null
    return toWellFeatures(data.features)
  } catch {
    return null
  }
}

export async function loadMapWells(limit = 1000): Promise<WellFeature[]> {
  return withFallback(
    'map-wells',
    async () => {
      const { data, error } = await api.GET('/api/v1/geo/wells', {
        params: { query: { limit } },
        next: { revalidate: 300 },
      })
      return error || !data?.features?.length ? null : toWellFeatures(data.features)
    },
    () => FIXTURE_WELLS,
  )
}

export async function loadWells(limit = 1000): Promise<WellFeature[]> {
  return withFallback(
    'wells',
    async () => {
      const { data, error } = await api.GET('/api/v1/geo/wells', {
        params: { query: { formation: 'vaca_muerta', limit } },
        next: { revalidate: 300 },
      })
      if (error || !data?.features?.length) return null
      return toWellFeatures(data.features)
    },
    () => FIXTURE_WELLS,
  )
}

/** Detalle de un pozo para el popup en vivo (producción del último mes). */
export async function loadWellProduction(
  wellId: string,
): Promise<{ oil: number; gas: number } | null> {
  try {
    const { data, error } = await api.GET('/api/v1/wells/{id}', {
      params: { path: { id: wellId } },
      next: { revalidate: 300 },
    })
    if (error || !data?.data) return null
    const lp = data.data.latest_production
    if (!lp) return null
    return { oil: lp.oil_bbl_d, gas: lp.gas_mmcf_d * 0.0283168466 }
  } catch {
    return null
  }
}
