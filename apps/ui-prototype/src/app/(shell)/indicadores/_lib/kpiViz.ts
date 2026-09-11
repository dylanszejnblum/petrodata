import { ACTIVIDAD, CRUCE, KPIS, MUNDO, SERIE } from '@/fixtures/inversiones'
import type { KpiViz } from './types'

/** Valor puntual de un KPI de la fixture (null si no existe). */
export const kpiValue = (id: string): number | null =>
  KPIS.find((k) => k.id === id)?.figure.value ?? null

/* Mini-viz del bento — todas series REALES ya scrapeadas (nada simulado):
   rampa de producción, actividad de pozos, exportaciones de energía del
   cruce y el flip del superávit desde los charts de política. */
export function buildKpiViz(): Record<string, KpiViz> {
  const superavitSerie = MUNDO.politica?.charts.find((c) => c.id === 'superavit_energia')

  /* Desglose VM vs resto para las cards de participación — el volumen
     nacional se deriva de datos confirmados: nacional = VM ÷ participación */
  const lastConfirmed = SERIE.points.filter((p) => !p.preliminary).at(-1)
  const shareRows = (vm: number, sharePct: number, fmt: (v: number) => string) => [
    { label: 'Vaca Muerta', value: fmt(vm), pct: sharePct },
    { label: 'Resto del país', value: fmt(vm / (sharePct / 100) - vm), pct: 100 - sharePct },
  ]
  const milBbl = (v: number) => `${Math.round(v / 1000)} mil bbl/d`
  const mmm3 = (v: number) => `${v.toFixed(1).replace('.', ',')} MMm³/d`
  const oilVm = kpiValue('produccion_vm')
  const oilShare = kpiValue('participacion_petroleo')
  const gasVm = lastConfirmed?.gasMm3D
  const gasShare = kpiValue('participacion_gas')

  return {
    produccion_vm: {
      kind: 'area',
      color: 'var(--data-oil)',
      data: SERIE.points.map((p) => ({ x: p.period, y: p.oilBblD })),
      tip: { kind: 'number', suffix: ' bbl/d' },
    },
    ...(oilVm != null && oilShare != null
      ? {
          participacion_petroleo: {
            kind: 'share' as const,
            color: 'var(--data-oil)',
            rows: shareRows(oilVm, oilShare, milBbl),
          },
        }
      : {}),
    ...(gasVm != null && gasShare != null
      ? {
          participacion_gas: {
            kind: 'share' as const,
            color: 'var(--data-gas)',
            rows: shareRows(gasVm, gasShare, mmm3),
          },
        }
      : {}),
    pozos_activos: {
      kind: 'bars',
      color: 'rgba(255,255,255,0.8)',
      data: ACTIVIDAD.points.map((p) => ({ x: p.period, y: p.nuevosPozos })),
      tip: { kind: 'number', suffix: ' pozos nuevos' },
    },
    exportaciones_energia: {
      kind: 'line',
      color: '#2fe0a4',
      data: CRUCE.points
        .filter((p) => p.energiaUsd != null)
        .slice(-20)
        .map((p) => ({ x: p.period, y: p.energiaUsd as number })),
      tip: { kind: 'usd' },
    },
    ...(superavitSerie
      ? {
          superavit_energia: {
            kind: 'signed-bars' as const,
            color: '#2fe0a4',
            /* la serie viene en US$ MM → scale 1e6 para leerla en USD */
            data: superavitSerie.points.map((p) => ({ x: p.period, y: p.value })),
            tip: { kind: 'usd' as const, scale: 1e6 },
          },
        }
      : {}),
  }
}
