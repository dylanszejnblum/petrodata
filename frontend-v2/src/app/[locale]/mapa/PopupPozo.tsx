'use client'

import { useEffect, useState } from 'react'
import { api, type ApiSchemas } from '@/api/client'
import { formatDecimal, formatInteger } from '@/lib/format'
import { COMPANIES } from '@/fixtures/companies'
import { LogoEmpresa } from '../_ui/LogoEmpresa'

/* EL POPUP DEL POZO — GET /api/v1/wells/{id} al abrir.

   La v1 hace exactamente esto (WellPopup): la ficha del pozo no viaja con el
   GeoJSON —que trae lo mínimo para dibujar 1.000 puntos— y se busca al clic.
   Acá va con las piezas del sistema V2: rótulos .s-micro, cifras .s-num y las
   mismas pastillas de estado del mapa, sin nada flotando encima del propio
   popup.

   El cache es a nivel de módulo, como en la v1: reabrir el mismo pozo es
   inmediato y no vuelve a golpear la API. */

type Detalle = ApiSchemas['WellDetailDto']

const cache = new Map<string, Detalle>()
const EMPRESA_POR_SLUG = new Map(COMPANIES.map((empresa) => [empresa.slug, empresa]))

/* El spec declara depth_m como object con ejemplo numérico — llega number en
   runtime. Se coerse como los precios de DetalleEmpresa. */
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

function usePozo(id: string) {
  const [detalle, setDetalle] = useState<Detalle | null>(() => cache.get(id) ?? null)
  const [cargando, setCargando] = useState(() => !cache.has(id))

  useEffect(() => {
    const hit = cache.get(id)
    if (hit) {
      setDetalle(hit)
      setCargando(false)
      return
    }
    const ctrl = new AbortController()
    setCargando(true)
    ;(async () => {
      try {
        const { data, error } = await api.GET('/api/v1/wells/{id}', {
          params: { path: { id } },
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        if (!error && data?.data) {
          cache.set(id, data.data)
          setDetalle(data.data)
        }
      } catch {
        /* abortado o red caída: el popup muestra lo que tiene */
      } finally {
        if (!ctrl.signal.aborted) setCargando(false)
      }
    })()
    return () => ctrl.abort()
  }, [id])

  return { detalle, cargando }
}

/* La clasificación de estado del fixture de pozos, no la de la v1: el mapa ya
   pinta con estos tres y el popup tiene que decir lo mismo que el color. */
function clasifica(statusCode: string | null | undefined): { rot: string; tono: 'ok' | 'aviso' | 'mudo' } {
  const s = (statusCode ?? '').toLowerCase()
  if (s.includes('producción') || s.includes('produccion')) return { rot: 'En producción', tono: 'ok' }
  if (s.includes('inyector')) return { rot: 'Pozo inyector', tono: 'ok' }
  if (s.includes('parado') || s.includes('transitorio')) return { rot: 'Parado', tono: 'aviso' }
  if (s.includes('estudio')) return { rot: 'En estudio', tono: 'aviso' }
  if (s.includes('perforación') || s.includes('perforacion')) return { rot: 'En perforación', tono: 'aviso' }
  return { rot: statusCode?.trim() || 'Sin estado', tono: 'mudo' }
}

function Fila({ rot, val }: { rot: string; val: string | null | undefined }) {
  if (val == null || val === '') return null
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
        {rot}
      </span>
      <span className="s-micro s-num truncate" title={val}>
        {val}
      </span>
    </div>
  )
}

type InitialWell = Record<string, unknown>

export function PopupPozo({ id, sigla, initial }: { id: string; sigla: string; initial: InitialWell }) {
  const { detalle, cargando } = usePozo(id)
  const d = detalle
  const texto = (key: string) => typeof initial[key] === 'string' ? String(initial[key]) : undefined
  const numero = (key: string) => typeof initial[key] === 'number' ? Number(initial[key]) : null
  const operatorSlug = d?.operator_slug ?? texto('operator')
  const operatorName = d?.operator_name ?? texto('operatorName')
  const estadoRaw = d?.status_code ?? texto('statusCode')
  const estado = clasifica(estadoRaw)

  const lp = d?.latest_production ?? null
  /* `boe` del pozo es el total del mes; lo diario sale de repartirlo en los
     días del mes de corte. */
  const dias = lp ? new Date(Number(lp.date_month.slice(0, 4)), Number(lp.date_month.slice(5, 7)), 0).getDate() : 0
  const boeDia = lp && dias ? lp.boe / dias : null
  const hayProd = !!lp && ((lp.oil_bbl_d ?? 0) > 0 || (lp.gas_mmcf_d ?? 0) > 0 || boeDia !== null)
  const formation = d?.formation_slug ?? texto('formation')
  const esVm = formation === 'vaca_muerta' || lp?.vm_combined === true
  const empresa = operatorSlug ? EMPRESA_POR_SLUG.get(operatorSlug) : undefined

  return (
    <div className="s-popup-cuerpo">
      <div className="s-popup-cab flex items-center gap-2.5">
        {operatorName && (
          <LogoEmpresa nombre={operatorName} website={empresa?.website} logoUrl={empresa?.logoUrl} caja={36} />
        )}
        <div className="min-w-0 flex-1">
          <span className="s-titulo block truncate" title={d?.sigla ?? sigla}>{d?.sigla ?? sigla}</span>
          <span className="s-mono block" style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>Pozo · {id}</span>
        </div>
      </div>

      <div className="s-popup-badges">
        <span className={`s-chip s-chip--mini ${estado.tono === 'ok' ? 's-chip--ok' : estado.tono === 'aviso' ? 's-chip--warn' : 's-chip--neutro'}`}>
          {estado.rot}
        </span>
        {(d?.well_type ?? texto('recurso')) && (
          <span className="s-chip s-chip--neutro s-chip--mini">{d?.well_type ?? texto('recurso')}</span>
        )}
        {esVm && <span className="s-chip s-chip--ok s-chip--mini">VM</span>}
        {cargando && !d && (
          <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
            cargando…
          </span>
        )}
      </div>

      {hayProd && lp && (
        <div className="s-popup-prod">
          <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
            Último mes · {lp.date_month.slice(0, 7)}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>Petróleo</span>
              <span className="s-num block text-[13px] font-medium">
                {formatInteger(lp.oil_bbl_d ?? 0)}
              </span>
              <span className="s-micro block" style={{ color: 'var(--ink-3)' }}>bbl/d</span>
            </div>
            <div>
              <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>Gas</span>
              <span className="s-num block text-[13px] font-medium">
                {formatDecimal((lp.gas_mmcf_d ?? 0) * 0.0283168466, 1)}
              </span>
              <span className="s-micro block" style={{ color: 'var(--ink-3)' }}>Mm³/d</span>
            </div>
            <div>
              <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>BOE</span>
              <span className="s-num block text-[13px] font-medium">
                {formatInteger(boeDia ?? 0)}
              </span>
              <span className="s-micro block" style={{ color: 'var(--ink-3)' }}>boe/d</span>
            </div>
          </div>
        </div>
      )}

      <div className="s-popup-meta">
        <Fila rot="Operadora" val={operatorName} />
        <Fila rot="Provincia" val={d?.province ?? texto('province')} />
        <Fila rot="Cuenca" val={d?.basin ?? texto('basin')} />
        <Fila rot="Formación" val={formation} />
        <Fila rot="Yacimiento" val={d?.yacimiento ?? texto('yacimiento')} />
        <Fila rot="Concesión" val={d?.concession ?? texto('concession')} />
        {(num(d?.depth_m) ?? numero('depth')) != null && (
          <Fila rot="Profundidad" val={`${formatInteger((num(d?.depth_m) ?? numero('depth')) ?? 0)} m`} />
        )}
      </div>

      <div className="s-popup-pie s-micro" style={{ color: 'var(--ink-3)' }}>
        Secretaría de Energía · catálogo de pozos
      </div>
    </div>
  )
}
