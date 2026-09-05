'use client'

import { useEffect, useState } from 'react'
import { api, type ApiSchemas } from '@/api/client'
import { formatDecimal, formatInteger } from '@/lib/format'
import { Icono, PATH } from './iconos'

/* LO QUE LA FICHA DE EMPRESA NO TIENE EN EL LISTADO — los dos pedidos que la
   v1 hace en su página de empresa:

   · GET /v2/companies/prices/{ticker}?range=6mo — la HISTORIA del papel. El
     listado ya trae el precio y la variación del día (lote de
     /companies/prices); lo que no trae es la línea. Va como un paso más del
     riel, al lado de la cotización que ya estaba.
   · GET /v2/companies/{slug} — el detalle: resumen O&G (pozos activos, share
     nacional de BOE, provincias). Es lo que la v1 muestra como StatCounters
     en companies/[slug].

   Cache de módulo, como el popup del pozo y la serie del mapa: abrir y
   cerrar la ficha de la misma empresa no vuelve a golpear la API. */

type Detalle = ApiSchemas['CompanyDetailDto']
type Historia = ApiSchemas['StockHistoryDto']

const cacheDetalle = new Map<string, Detalle>()
const cacheHistoria = new Map<string, Historia>()

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

/** Línea de cierres, 132×30. La misma gramática de la Serie: comparación
 *  DENTRO del rango —los precios de seis meses se leen por su movimiento— y
 *  punto final en el último valor. Sin ejes ni números sobre el trazo: la
 *  cifra vive a la izquierda, que es donde el sistema pone lo que se cuenta. */
function Linea({ cierres }: { cierres: number[] }) {
  if (cierres.length < 2) return null
  const min = Math.min(...cierres)
  const max = Math.max(...cierres)
  const paso = 132 / (cierres.length - 1)
  const y = (v: number) => 28 - ((v - min) / (max - min || 1)) * 26
  const puntos = cierres.map((v, i) => `${(i * paso).toFixed(1)},${y(v).toFixed(1)}`)
  const subio = cierres[cierres.length - 1] >= cierres[0]
  const color = subio ? 'var(--green)' : 'var(--red)'
  const [cx, cy] = puntos[puntos.length - 1].split(',')
  return (
    <svg width="132" height="30" viewBox="0 0 132 30" aria-hidden className="shrink-0">
      <polyline
        points={puntos.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="2.2" fill={color} />
    </svg>
  )
}

export function DetalleEmpresa({ slug, ticker }: { slug: string; ticker?: string }) {
  const [detalle, setDetalle] = useState<Detalle | null>(() => cacheDetalle.get(slug) ?? null)
  const [historia, setHistoria] = useState<Historia | null>(() =>
    ticker ? cacheHistoria.get(ticker) ?? null : null,
  )

  /* El ticker puede llegar del listado (arranca ya) o recién del detalle. */
  const papel = ticker ?? detalle?.stock?.ticker

  useEffect(() => {
    const hit = cacheDetalle.get(slug)
    if (hit) {
      setDetalle(hit)
      return
    }
    let vivo = true
    ;(async () => {
      try {
        const { data, error } = await api.GET('/api/v2/companies/{slug}', {
          params: { path: { slug } },
        })
        if (vivo && !error && data?.data) {
          cacheDetalle.set(slug, data.data)
          setDetalle(data.data)
        }
      } catch {
        /* sin detalle: la ficha muestra sólo lo que ya tenía */
      }
    })()
    return () => {
      vivo = false
    }
  }, [slug])

  useEffect(() => {
    if (!papel) return
    const hit = cacheHistoria.get(papel)
    if (hit) {
      setHistoria(hit)
      return
    }
    let vivo = true
    ;(async () => {
      try {
        const { data, error } = await api.GET('/api/v2/companies/prices/{ticker}', {
          params: { path: { ticker: papel }, query: { range: '6mo' } },
        })
        if (vivo && !error && data?.data) {
          cacheHistoria.set(papel, data.data)
          setHistoria(data.data)
        }
      } catch {
        /* sin historia: queda el precio del listado */
      }
    })()
    return () => {
      vivo = false
    }
  }, [papel])

  const og = detalle?.oil_gas_production_summary
  const cierres = (historia?.history ?? [])
    .map((p) => num(p.close))
    .filter((v): v is number => v != null)
  const meses = new Set(cierres.map((_, i) => i)).size

  return (
    <>
      {/* La línea de seis meses. Sólo si hay historia — un paso vacío con un
          rótulo sería una promesa rota. Sin repetir la cifra: ésa ya está en
          el renglón de la cotización que el listado dibuja arriba. */}
      {cierres.length > 1 && (
        <div className="s-paso">
          <span className="shrink-0" style={{ color: 'var(--ink-3)' }}>
            <Icono d={PATH.tendencia} size={14} grosor={2} />
          </span>
          <span className="min-w-0 truncate text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
            Últimos {meses} cierres
          </span>
          <span className="ml-auto self-center">
            <Linea cierres={cierres} />
          </span>
        </div>
      )}

      {/* Resumen de operación, del detalle: pozos activos y share nacional de
          BOE. El paso de Pozos del listado dice cuántos hay en la MUESTRA del
          mapa; éste es el número del país, que es el que publica la v1. */}
      {og && (
        <div className="s-paso">
          <span className="shrink-0" style={{ color: 'var(--ink-3)' }}>
            <Icono d={PATH.barras} size={14} grosor={2} />
          </span>
          <span
            className="m-0 flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 text-[12.5px]"
            style={{ color: 'var(--ink-2)' }}
          >
            <span className="s-num font-medium" style={{ color: 'var(--ink)' }}>
              {formatInteger(og.well_count)}
            </span>
            pozos activos en el país
            {num(og.national_share_boe) !== null && (
              <>
                ·<b className="s-num font-medium" style={{ color: 'var(--ink)' }}>
                  {formatDecimal((og.national_share_boe ?? 0) * 100, 1)}%
                </b>
                del BOE
              </>
            )}
            {og.provinces?.length > 0 && (
              <span className="truncate" style={{ color: 'var(--ink-3)' }}>
                · {og.provinces.join(' · ')}
              </span>
            )}
          </span>
        </div>
      )}
    </>
  )
}
