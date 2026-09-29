/* Datos EN VIVO para Vacamuerta IA — lo único del sitio que no es mensual.

   · Energía: Yahoo Finance (futuros BZ=F, CL=F, NG=F), cierre diario de un mes
     para la chispa. Si Yahoo no responde, cae al último mensual del backend
     (/api/v1/prices/energy) marcado `vivo: false`.
   · Dólar: dolarapi.com (oficial, blue, MEP, CCL, mayorista). Fallback: el
     /api/v1/macro/fx/latest del backend.
   · Acciones: /api/v2/companies/prices del backend, que ya es intradiario.

   ponytail: el endpoint de Yahoo no es una API oficial; si se corta, el
   fallback mensual sostiene la tarjeta. Cambiar a un proveedor con clave
   cuando esto pase de demo. */

import { api } from '@/api/client'
import { num } from './fallback'

const REVALIDA = { next: { revalidate: 60 } }

export type Cotizacion = {
  clave: string
  nombre: string
  unidad: string
  precio: number
  /** variación contra el cierre anterior, en fracción; null si no hay */
  cambio: number | null
  /** cierres diarios del último mes, para la chispa y el gráfico */
  serie: number[]
  /** fecha ISO (AAAA-MM-DD) de cada cierre */
  fechas: string[]
  hora: string
  vivo: boolean
}

const ENERGIA = [
  { clave: 'brent', simbolo: 'BZ=F', nombre: 'Brent', unidad: 'USD/bbl' },
  { clave: 'wti', simbolo: 'CL=F', nombre: 'WTI', unidad: 'USD/bbl' },
  { clave: 'henry_hub', simbolo: 'NG=F', nombre: 'Henry Hub', unidad: 'USD/MMBtu' },
] as const

async function yahoo(simbolo: string) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?interval=1d&range=1mo`,
    { headers: { 'user-agent': 'Mozilla/5.0' }, ...REVALIDA },
  )
  if (!r.ok) return null
  const res = (await r.json())?.chart?.result?.[0]
  const precio = num(res?.meta?.regularMarketPrice)
  if (precio == null) return null
  const previo = num(res.meta.chartPreviousClose)
  const ts = (res.timestamp ?? []) as number[]
  const pares = ((res.indicators?.quote?.[0]?.close ?? []) as unknown[])
    .map((c, i) => [num(c), ts[i]] as const)
    .filter((x): x is readonly [number, number] => x[0] != null && x[1] != null)
  const cierres = pares.map((x) => x[0])
  // el cambio del día: contra el último cierre ANTERIOR al precio actual
  const base = cierres.length > 1 ? cierres[cierres.length - 2] : previo
  return {
    precio,
    cambio: base ? precio / base - 1 : null,
    serie: cierres,
    fechas: pares.map((x) => new Date(x[1] * 1000).toISOString().slice(0, 10)),
    hora: new Date((res.meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
  }
}

/** `producto` acota a uno solo (brent | wti | henry_hub): el panel lo dibuja
    como tarjeta grande con gráfico en vez de lista. */
export async function loadEnergiaViva(producto?: string): Promise<Cotizacion[]> {
  const pedidos = ENERGIA.filter((e) => !producto || e.clave === producto)
  const lista = pedidos.length ? pedidos : ENERGIA
  const vivos = await Promise.all(lista.map((e) => yahoo(e.simbolo).catch(() => null)))
  if (vivos.every(Boolean)) return lista.map((e, i) => ({ ...e, ...vivos[i]!, vivo: true }))

  // fallback: el mensual del backend para las que faltan
  const { data } = await api.GET('/api/v1/prices/energy', REVALIDA).catch(() => ({ data: undefined }))
  const filas = (data?.data ?? []) as unknown as { series?: string; latest?: unknown; latest_date?: string }[]
  return lista.flatMap((e, i): Cotizacion[] => {
    if (vivos[i]) return [{ ...e, ...vivos[i]!, vivo: true }]
    const f = filas.find((x) => x.series === e.clave)
    const precio = num(f?.latest)
    return precio == null ? [] : [{ ...e, precio, cambio: null, serie: [], fechas: [], hora: f?.latest_date ?? '', vivo: false }]
  })
}

export type Dolar = {
  casa: string
  nombre: string
  compra: number | null
  venta: number
  hora: string
  vivo: boolean
  /** venta de los últimos 30 días hábiles (argentinadatos.com), para la chispa */
  serie: number[]
}

/** Historia diaria de venta por casa. Viene la serie entera (años), así que se
    cachea una hora y se recorta a los últimos 30 registros. */
async function historiaDolar(casa: string): Promise<number[]> {
  try {
    const r = await fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`, { next: { revalidate: 3600 } })
    if (!r.ok) return []
    return ((await r.json()) as { venta: number }[]).slice(-30).map((x) => x.venta)
  } catch {
    return []
  }
}

const CASAS = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'mayorista']

export async function loadDolar(): Promise<Dolar[]> {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares', REVALIDA)
    const filas = r.ok ? ((await r.json()) as { casa: string; nombre: string; compra: number; venta: number; fechaActualizacion: string }[]) : []
    const historias = await Promise.all(CASAS.map(historiaDolar))
    const vivos = CASAS.flatMap((c, i) => {
      const f = filas.find((x) => x.casa === c)
      return f ? [{ casa: c, nombre: c === 'bolsa' ? 'MEP' : c === 'contadoconliqui' ? 'CCL' : f.nombre, compra: f.compra, venta: f.venta, hora: f.fechaActualizacion, vivo: true, serie: historias[i] }] : []
    })
    if (vivos.length) return vivos
  } catch {}
  const { data } = await api.GET('/api/v1/macro/fx/latest', REVALIDA).catch(() => ({ data: undefined }))
  const fx = data?.data as { date?: string; oficial_sell?: number; oficial_buy?: number; blue_sell?: number; blue_buy?: number } | undefined
  if (!fx?.oficial_sell) return []
  return [
    { casa: 'oficial', nombre: 'Oficial', compra: fx.oficial_buy ?? null, venta: fx.oficial_sell, hora: fx.date ?? '', vivo: false, serie: [] },
    ...(fx.blue_sell ? [{ casa: 'blue', nombre: 'Blue', compra: fx.blue_buy ?? null, venta: fx.blue_sell, hora: fx.date ?? '', vivo: false, serie: [] }] : []),
  ]
}

export type Accion = {
  slug: string
  nombre: string
  ticker: string
  precio: number
  cambio: number | null
  mercado: string
  /** cierres del último mes; sólo cuando se piden tickers puntuales */
  serie: number[]
  fechas: string[]
}

async function historiaAccion(ticker: string) {
  const { data } = await api
    .GET('/api/v2/companies/prices/{ticker}', { params: { path: { ticker } }, ...REVALIDA })
    .catch(() => ({ data: undefined }))
  const h = ((data?.data as { history?: { date: string; close: number }[] } | undefined)?.history ?? []).filter((x) => x.close != null)
  return { serie: h.map((x) => x.close), fechas: h.map((x) => x.date) }
}

/** Sin `tickers`, la lista entera (sin historia). Con hasta cuatro tickers,
    sólo esos y con su mes de cierres para el gráfico. */
export async function loadAcciones(tickers?: string[]): Promise<Accion[]> {
  const { data, error } = await api.GET('/api/v2/companies/prices', REVALIDA).catch(() => ({ data: undefined, error: true }))
  if (error || !data?.data) return []
  const todas = (data.data as unknown as { slug: string; name: string; ticker: string; price: number; change_pct: number | null; exchange: string }[])
    // ponytail: minería/uranio quedan fuera de la UI (el sitio es O&G)
    .filter((c) => c.exchange !== 'VAN')
    .map((c) => ({
      slug: c.slug,
      nombre: c.name,
      ticker: c.ticker,
      precio: c.price,
      cambio: c.change_pct == null ? null : c.change_pct / 100,
      mercado: c.exchange === 'BUE' ? 'BYMA' : 'NYSE',
      serie: [] as number[],
      fechas: [] as string[],
    }))
    .filter((c) => !tickers?.length || tickers.some((t) => t.toUpperCase() === c.ticker))
  if (!tickers?.length) return todas
  const elegidas = todas.slice(0, 4)
  const historias = await Promise.all(elegidas.map((c) => historiaAccion(c.ticker)))
  return elegidas.map((c, i) => ({ ...c, ...historias[i] }))
}
