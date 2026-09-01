/* Pozos — GET /api/v1/geo/wells (GeoJSON crudo).
   Mapea GeoWellFeatureDto → WellFeature del fixture (id/name/operator/status/oil/gas).
   El GeoJSON no trae producción por pozo: el popup del mapa muestra los
   metadatos y omite la grilla de producción cuando no hay datos. */

import { api } from '@/api/client'
import type { WellFeature, WellStatus } from '@/fixtures/wells'
import { WELLS as FIXTURE_WELLS } from '@/fixtures/wells'
import { withFallback } from './fallback'

function mapStatus(statusCode: string | null | undefined): WellStatus {
  const s = (statusCode ?? '').toLowerCase()
  if (s.includes('producción') || s.includes('produccion')) return 'activo'
  if (s.includes('perforación') || s.includes('perforacion')) return 'perforacion'
  return 'abandonado'
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
      return data.features
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
              operatorName: p.operator_name,
              status: mapStatus(p.status_code),
              oil: 0,
              gas: 0,
            },
          }
        })
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
