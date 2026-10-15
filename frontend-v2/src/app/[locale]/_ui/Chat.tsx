'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Card, CardHead, Dato, FLUIDO, PALETA_TAGS } from './kit'
import { Serie } from './Serie'
import { Icono, PATH } from './iconos'
import { SerieLinea } from './SerieLinea'
import { formatDate, formatDecimal, formatDelta, formatInteger, formatMonth, type AppLocale } from '@/lib/format'

/* Chat con los datos — la tercera columna. El modelo (DeepSeek, en
   /api/chat) elige herramientas; cada resultado llega como bloque y acá se
   dibuja con las piezas del kit. El texto del modelo sólo comenta. */

type Block = { id?: string; tool: string; data: any } // eslint-disable-line @typescript-eslint/no-explicit-any
/** `pasos`: herramientas en curso (id → tool). `escribiendo`: el turno todavía recibe. */
type Turno = {
  role: 'user' | 'assistant'
  content: string
  blocks?: Block[]
  pasos?: { id: string; tool: string }[]
  escribiendo?: boolean
  error?: boolean
}

/* Lo que el panel dice mientras cada herramienta trabaja. */
const PASO: Record<string, { es: string; en: string }> = {
  resumen_vaca_muerta: { es: 'Leyendo el último mes de Vaca Muerta', en: "Reading Vaca Muerta's latest month" },
  serie_produccion: { es: 'Armando la serie mensual', en: 'Building the monthly series' },
  ranking_operadoras: { es: 'Ordenando operadoras por BOE', en: 'Ranking operators by BOE' },
  provincias: { es: 'Cruzando pozos y exportaciones por provincia', en: 'Crossing wells and exports by province' },
  noticias: { es: 'Buscando noticias', en: 'Fetching news' },
  precios_energia: { es: 'Consultando Brent, WTI y Henry Hub en vivo', en: 'Fetching live Brent, WTI and Henry Hub' },
  dolar: { es: 'Consultando el dólar en vivo', en: 'Fetching live FX rates' },
  acciones: { es: 'Consultando acciones en vivo', en: 'Fetching live share prices' },
}

const SUGERENCIAS = {
  es: [
    '¿Cuánto produce Vaca Muerta?',
    'Top operadoras del mes',
    'Petróleo y gas, últimos 12 meses',
    '¿Qué provincias exportan más?',
    '¿A cuánto está el Brent?',
    '¿A cuánto está el dólar?',
    '¿Cómo cotizan YPF y Vista?',
    'Últimas noticias del sector',
  ],
  en: [
    'How much does Vaca Muerta produce?',
    'Top operators this month',
    'Oil and gas, last 12 months',
    'Which provinces export the most?',
    "What's the Brent price?",
    "What's the dollar rate?",
    'How are YPF and Vista trading?',
    'Latest industry news',
  ],
}

/* Repreguntas armadas a mano según qué herramientas usó la respuesta: cada una
   la contesta otra herramienta, así la charla abre el resto de los datos en vez
   de repetir la misma tarjeta. */
const SEGUIMIENTO: Record<string, { es: string[]; en: string[] }> = {
  resumen_vaca_muerta: {
    es: ['¿Cómo vino la producción en los últimos 12 meses?', '¿Qué operadoras lideran?', '¿A cuánto está el Brent?'],
    en: ['How has production moved over the last 12 months?', 'Which operators lead?', "What's the Brent price?"],
  },
  serie_produccion: {
    es: ['¿Qué operadoras explican esa producción?', '¿Cuánto pesa Vaca Muerta en el total del país?', 'Mostrame sólo los últimos 6 meses'],
    en: ['Which operators drive that output?', "How much of the country's total is Vaca Muerta?", 'Show only the last 6 months'],
  },
  ranking_operadoras: {
    es: ['Mostrame el top 10', '¿Cuánto produce Vaca Muerta en total?', 'Noticias recientes del sector'],
    en: ['Show me the top 10', 'How much does Vaca Muerta produce in total?', 'Recent industry news'],
  },
  provincias: {
    es: ['¿Qué provincia tiene más pozos?', '¿Cuánto produce Vaca Muerta?', '¿A cuánto está el Brent?'],
    en: ['Which province has the most wells?', 'How much does Vaca Muerta produce?', "What's the Brent price?"],
  },
  noticias: {
    es: ['¿Cómo viene la producción?', 'Top operadoras del mes', 'Más noticias'],
    en: ["How's production trending?", 'Top operators this month', 'More news'],
  },
  precios_energia: {
    es: ['¿Cómo cotizan YPF y Vista?', '¿Cómo viene el petróleo de Vaca Muerta?', '¿A cuánto está el dólar?'],
    en: ['How are YPF and Vista trading?', "How's Vaca Muerta oil trending?", "What's the dollar rate?"],
  },
  dolar: {
    es: ['¿A cuánto está el Brent?', '¿Cómo cotizan YPF y Vista?', '¿Qué provincias exportan más?'],
    en: ["What's the Brent price?", 'How are YPF and Vista trading?', 'Which provinces export the most?'],
  },
  acciones: {
    es: ['¿Qué operadoras lideran la producción?', '¿A cuánto está el Brent?', 'Noticias recientes del sector'],
    en: ['Which operators lead production?', "What's the Brent price?", 'Recent industry news'],
  },
}

/** Hasta tres repreguntas para el último turno, sin repetir lo ya preguntado. */
function repreguntas(turnos: Turno[], l: AppLocale): string[] {
  const ultimo = turnos.at(-1)
  if (!ultimo || ultimo.role !== 'assistant' || ultimo.error || ultimo.escribiendo) return []
  const hechas = new Set(turnos.filter((t) => t.role === 'user').map((t) => t.content))
  const tools = ultimo.blocks?.map((b) => b.tool) ?? []
  const pool = tools.length ? tools.flatMap((t) => SEGUIMIENTO[t]?.[l] ?? []) : SUGERENCIAS[l]
  return [...new Set(pool)].filter((q) => !hechas.has(q)).slice(0, 3)
}

/* ── Tarjetas vivas ──────────────────────────────────────────────────────
   Se refrescan solas cada minuto mientras la pestaña está a la vista, contra
   GET /api/chat?vivo=<tool>. Cuando una cifra cambia, destella una vez. */
const REFRESCO = 60_000

function useVivo<T>(tool: string, inicial: T, params = ''): [T, number] {
  const [dato, setDato] = useState(inicial)
  const [hora, setHora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return
      try {
        const r = await fetch(`/api/chat?vivo=${tool}${params && `&${params}`}`, { cache: 'no-store' })
        if (r.ok) { setDato(await r.json()); setHora(Date.now()) }
      } catch {}
    }, REFRESCO)
    return () => clearInterval(id)
  }, [tool, params])
  return [dato, hora]
}

function EnVivo({ l, vivo = true, hora }: { l: AppLocale; vivo?: boolean; hora: number }) {
  if (!vivo) return <span>{l === 'en' ? 'monthly' : 'mensual'}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="s-vivo-punto live-dot" aria-hidden />
      {l === 'en' ? 'Live' : 'En vivo'} ·{' '}
      {new Date(hora).toLocaleTimeString(l === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

/** La cifra destella cuando cambia de valor (key = valor fuerza el remonte). */
function Cifra({ v, className = 's-cifra-sm' }: { v: string; className?: string }) {
  return <span key={v} className={`${className} s-flash`}>{v}</span>
}

function Cambio({ c, l }: { c: number | null; l: AppLocale }) {
  const d = formatDelta(c, l)
  if (!d) return <span className="s-micro" style={{ color: 'var(--ink-3)' }}>—</span>
  return <span className={`s-delta ${d.dir === 'up' ? 's-delta--sube' : 's-delta--baja'} s-micro`}>{d.dir === 'up' ? '+' : '\u2212'}{d.label}</span>
}

const dia = (f: string, l: AppLocale) =>
  new Date(`${f}T12:00:00`).toLocaleDateString(l === 'en' ? 'en-US' : 'es-AR', { day: 'numeric', month: 'short' })

/** Un solo instrumento: tarjeta grande con el mes en línea. La cifra y la
    lectura al recorrer las pone SerieLinea; la cabecera lleva el cambio. */
function TarjetaGrande({
  titulo, icono, unidad, serie, fechas, cambio, decimales, prefijo = '', nota, l,
}: {
  titulo: string; icono: string; unidad: string; serie: number[]; fechas: string[]
  cambio: number | null; decimales: number; prefijo?: string; nota: React.ReactNode; l: AppLocale
}) {
  const meses = fechas.map((f) => dia(f, l))
  return (
    <Card>
      <CardHead titulo={titulo} icono={icono} nota={nota} sub={<Cambio c={cambio} l={l} />} />
      <div className="p-3">
        <SerieLinea
          leyenda={false}
          meses={meses}
          rango={`${meses[0]} – ${meses.at(-1)}`}
          series={[{ nombre: titulo, color: FLUIDO.petroleo, unidad, valores: serie, textos: serie.map((v) => `${prefijo}${formatDecimal(v, decimales, l)}`) }]}
        />
      </div>
    </Card>
  )
}

type Cot = { clave: string; nombre: string; unidad: string; precio: number; cambio: number | null; serie: number[]; fechas: string[]; vivo: boolean }
function TarjetaEnergia({ inicial, l }: { inicial: Cot[]; l: AppLocale }) {
  const uno = inicial.length === 1 ? inicial[0].clave : ''
  const [xs, hora] = useVivo('precios_energia', inicial, uno && `producto=${uno}`)
  const x = xs[0]
  if (uno && x?.serie.length > 2) {
    // el último cierre del gráfico es el precio vivo, así la línea termina donde dice la cifra
    const serie = [...x.serie.slice(0, -1), x.precio]
    return (
      <TarjetaGrande titulo={x.nombre} icono={PATH.gota} unidad={x.unidad} serie={serie} fechas={x.fechas}
        cambio={x.cambio} decimales={2} nota={<EnVivo l={l} vivo={x.vivo} hora={hora} />} l={l} />
    )
  }
  return (
    <Card>
      <CardHead titulo={l === 'en' ? 'Energy prices' : 'Precios de energía'} icono={PATH.gota} nota={<EnVivo l={l} vivo={xs.some((x) => x.vivo)} hora={hora} />} />
      <ul className="m-0 list-none p-0">
        {xs.map((x) => (
          <li key={x.clave} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-0 flex-1">
              <span className="s-etq block" style={{ color: 'var(--ink)' }}>{x.nombre}</span>
              <span className="s-micro" style={{ color: 'var(--ink-3)' }}>{x.unidad}</span>
            </span>
            {x.serie.length > 2 && <Serie valores={x.serie} className="w-20" />}
            <span className="flex w-20 flex-col items-end">
              <Cifra v={formatDecimal(x.precio, 2, l)} />
              <Cambio c={x.cambio} l={l} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

type Dol = { casa: string; nombre: string; compra: number | null; venta: number; vivo: boolean; serie: number[] }
function TarjetaDolar({ inicial, l }: { inicial: Dol[]; l: AppLocale }) {
  const [xs, hora] = useVivo('dolar', inicial)
  return (
    <Card>
      <CardHead titulo={l === 'en' ? 'US dollar · ARS' : 'Dólar · ARS'} icono={PATH.moneda} nota={<EnVivo l={l} vivo={xs.some((x) => x.vivo)} hora={hora} />} />
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 pt-2 s-micro" style={{ color: 'var(--ink-3)' }}>
        <span /> <span className="w-16 text-right">{l === 'en' ? '30 days' : '30 días'}</span> <span className="w-14 text-right">{l === 'en' ? 'Buy' : 'Compra'}</span> <span className="w-14 text-right">{l === 'en' ? 'Sell' : 'Venta'}</span>
      </div>
      <ul className="m-0 list-none p-0">
        {xs.map((x) => (
          <li key={x.casa} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b px-3 py-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <span className="s-etq" style={{ color: 'var(--ink)' }}>{x.nombre}</span>
            <span className="flex w-16 justify-end">{x.serie?.length > 2 && <Serie valores={x.serie} textos={x.serie.map((v) => formatDecimal(v, 0, l))} className="w-16" />}</span>
            <span className="w-14 text-right s-micro s-num" style={{ color: 'var(--ink-2)' }}>{x.compra == null ? '—' : formatDecimal(x.compra, 0, l)}</span>
            <span className="w-14 text-right"><Cifra v={formatDecimal(x.venta, 0, l)} /></span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

type Acc = { slug: string; nombre: string; ticker: string; precio: number; cambio: number | null; mercado: string; serie: number[]; fechas: string[] }
function TarjetaAcciones({ inicial, l }: { inicial: Acc[]; l: AppLocale }) {
  // con historia = se pidieron tickers puntuales; el refresco pide los mismos
  const tickers = inicial.some((x) => x.serie?.length) ? inicial.map((x) => x.ticker).join(',') : ''
  const [xs, hora] = useVivo('acciones', inicial, tickers && `tickers=${tickers}`)
  const x = xs[0]
  if (xs.length === 1 && x.serie?.length > 2) {
    const prefijo = x.mercado === 'BYMA' ? '$ ' : 'US$ '
    return (
      <TarjetaGrande titulo={`${x.ticker} · ${x.nombre}`} icono={PATH.tendencia} unidad={x.mercado} serie={[...x.serie.slice(0, -1), x.precio]}
        fechas={x.fechas} cambio={x.cambio} decimales={2} prefijo={prefijo} nota={<EnVivo l={l} hora={hora} />} l={l} />
    )
  }
  const comparables =
    xs.length > 1 &&
    xs.every((a) => a.serie?.length > 2) &&
    xs[0].fechas.filter((f) => xs.every((a) => a.fechas.includes(f))).length >= 3
  return (
    <Card>
      {comparables && <Comparacion xs={xs} l={l} hora={hora} />}
      {!comparables && <CardHead titulo={l === 'en' ? 'Shares' : 'Acciones'} icono={PATH.tendencia} nota={<EnVivo l={l} hora={hora} />} />}
      <ul className="m-0 list-none p-0">
        {xs.map((x) => (
          <li key={x.ticker} className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <span className="s-mono w-11 text-[11px]" style={{ color: 'var(--ink)' }}>{x.ticker}</span>
            <span className="s-micro min-w-0 flex-1 truncate" style={{ color: 'var(--ink-2)' }}>{x.nombre}</span>
            {!comparables && x.serie?.length > 2 && <Serie valores={x.serie} textos={x.serie.map((v, i) => `${dia(x.fechas[i], l)} · ${formatDecimal(v, 2, l)}`)} className="w-20" />}
            <span className="flex w-20 flex-col items-end">
              <Cifra v={`${x.mercado === 'BYMA' ? '$' : 'US$'} ${formatDecimal(x.precio, 2, l)}`} />
              <Cambio c={x.cambio} l={l} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Varias acciones en UN gráfico: cada una como variación % desde el primer
    día que todas comparten. En precio no se comparan (US$ 10 contra US$ 205,
    pesos contra dólares); en % desde la misma base, sí. */
function Comparacion({ xs, l, hora }: { xs: Acc[]; l: AppLocale; hora: number }) {
  // fechas que tienen TODAS (BYMA y NYSE no cierran los mismos días)
  const comunes = xs[0].fechas.filter((f) => xs.every((x) => x.fechas.includes(f)))
  const series = xs.map((x, k) => {
    const cierres = comunes.map((f) => x.serie[x.fechas.indexOf(f)])
    cierres[cierres.length - 1] = x.precio // termina en el precio vivo
    const valores = cierres.map((c) => (c / cierres[0] - 1) * 100)
    return {
      nombre: x.ticker,
      color: PALETA_TAGS[k % PALETA_TAGS.length],
      unidad: '',
      valores,
      textos: valores.map((v) => `${v >= 0 ? '+' : '\u2212'}${formatDecimal(Math.abs(v), 1, l)}%`),
    }
  })
  const meses = comunes.map((f) => dia(f, l))
  return (
    <>
      <CardHead
        titulo={l === 'en' ? 'Comparison' : 'Comparación'}
        icono={PATH.tendencia}
        sub={l === 'en' ? `% change since ${meses[0]}` : `variación % desde el ${meses[0]}`}
        nota={<EnVivo l={l} hora={hora} />}
      />
      <div className="border-b p-3" style={{ borderColor: 'var(--line)' }}>
        <SerieLinea meses={meses} rango={`${meses[0]} – ${meses.at(-1)}`} series={series} escala="rango" />
      </div>
    </>
  )
}

/** Mientras una herramienta trabaja: el esqueleto de la tarjeta que viene. */
function Esqueleto({ tool, l }: { tool: string; l: AppLocale }) {
  return (
    <div className="s-card s-skel-card" aria-hidden>
      <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
        <span className="s-spin" />
        <span className="s-micro" style={{ color: 'var(--ink-2)' }}>{PASO[tool]?.[l] ?? '…'}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <span className="s-skel" style={{ width: '62%' }} />
        <span className="s-skel" style={{ width: '88%' }} />
        <span className="s-skel" style={{ width: '45%' }} />
      </div>
    </div>
  )
}

function Bloque({ b, l }: { b: Block; l: AppLocale }) {
  const d = b.data
  if (!d || d.error) return null
  switch (b.tool) {
    case 'resumen_vaca_muerta':
      return (
        <Card>
          <CardHead titulo="Vaca Muerta" nota={formatMonth(`${d.period}-01`, l)} icono={PATH.pozo} />
          <div className="grid grid-cols-2 gap-4 p-3">
            <div className="flex flex-col gap-2">
              <Dato rotulo={l === 'en' ? 'Oil' : 'Petróleo'} valor={formatInteger(d.oil, l)} unidad="bbl/d" delta={d.momOil} grande />
              {d.oil12?.length > 2 && <Serie valores={d.oil12} textos={d.oil12.map((v: number) => `${formatInteger(v, l)} bbl/d`)} className="w-full" />}
            </div>
            <div className="flex flex-col gap-2">
              <Dato rotulo="Gas" valor={formatDecimal(d.gas, 1, l)} unidad="MMm³/d" delta={d.momGas} grande />
              {d.gas12?.length > 2 && <Serie valores={d.gas12} textos={d.gas12.map((v: number) => `${formatDecimal(v, 1, l)} MMm³/d`)} className="w-full" />}
            </div>
            <Dato rotulo={l === 'en' ? 'Share of oil' : 'Del petróleo'} valor={`${formatDecimal(d.oilSharePct, 1, l)}%`} />
            <Dato rotulo={l === 'en' ? 'Share of BOE' : 'Del BOE'} valor={`${formatDecimal(d.vmShare * 100, 1, l)}%`} />
          </div>
        </Card>
      )
    case 'serie_produccion': {
      const pts = d as { period: string; oil: number; gas: number }[]
      if (pts.length < 2) return null
      const meses = pts.map((p) => formatMonth(`${p.period}-01`, l))
      return (
        <Card>
          <CardHead titulo={l === 'en' ? 'Vaca Muerta production' : 'Producción Vaca Muerta'} icono={PATH.tendencia} />
          <div className="p-3">
            <SerieLinea
              meses={meses}
              rango={`${meses[0]} – ${meses.at(-1)}`}
              series={[
                { nombre: l === 'en' ? 'Oil' : 'Petróleo', color: FLUIDO.petroleo, unidad: 'bbl/d', valores: pts.map((p) => p.oil), textos: pts.map((p) => formatInteger(p.oil, l)) },
                { nombre: 'Gas', color: FLUIDO.gas, unidad: 'MMm³/d', valores: pts.map((p) => p.gas), textos: pts.map((p) => formatDecimal(p.gas, 1, l)) },
              ]}
            />
          </div>
        </Card>
      )
    }
    case 'ranking_operadoras': {
      const ops = d as { slug: string; name: string; boeDay: number; color: string }[]
      const max = Math.max(...ops.map((o) => o.boeDay), 1)
      return (
        <Card>
          <CardHead titulo={l === 'en' ? 'Operators · Vaca Muerta' : 'Operadoras · Vaca Muerta'} nota="BOE/d" icono={PATH.barras} />
          <ol className="m-0 list-none p-0">
            {ops.map((o, i) => (
              <li key={o.slug} className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <span className="s-mono w-4 text-[11px]" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
                <span className="s-etq min-w-0 flex-1 truncate" style={{ color: 'var(--ink)' }}>{o.name}</span>
                <span className="s-barra w-16"><i style={{ width: `${(o.boeDay / max) * 100}%`, background: o.color }} /></span>
                <span className="s-cifra-sm w-16 text-right">{formatInteger(o.boeDay, l)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )
    }
    case 'provincias': {
      const ps = (d as { slug: string; name: string; wells: number; exportsMUSD: number }[]).slice(0, 8)
      const tope = Math.max(...ps.map((p) => p.exportsMUSD), 1)
      return (
        <Card>
          <CardHead titulo={l === 'en' ? 'Provinces' : 'Provincias'} nota={l === 'en' ? 'wells · exports MUSD' : 'pozos · expo. MUSD'} icono={PATH.lista} />
          <ul className="m-0 list-none p-0">
            {ps.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <span className="s-etq min-w-0 flex-1 truncate" style={{ color: 'var(--ink)' }}>{p.name}</span>
                <span className="s-micro s-num" style={{ color: 'var(--ink-2)' }}>{formatInteger(p.wells, l)}</span>
                <span className="s-barra w-16"><i style={{ width: `${(p.exportsMUSD / tope) * 100}%` }} /></span>
                <span className="s-cifra-sm w-14 text-right">{formatInteger(p.exportsMUSD, l)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )
    }
    case 'noticias':
      return (
        <Card>
          <CardHead titulo={l === 'en' ? 'News' : 'Noticias'} icono={PATH.lista} />
          <ul className="m-0 list-none p-0">
            {(d as { id: string; title: string; source: string; date: string }[]).map((n) => (
              <li key={n.id} className="border-b px-3 py-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <Link href={`/noticias/${n.id}`} className="s-etq block no-underline hover:underline" style={{ color: 'var(--ink)' }}>{n.title}</Link>
                <span className="s-micro" style={{ color: 'var(--ink-3)' }}>{n.source} · {formatDate(n.date, l)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )
    case 'precios_energia':
      return d.length ? <TarjetaEnergia inicial={d} l={l} /> : null
    case 'dolar':
      return d.length ? <TarjetaDolar inicial={d} l={l} /> : null
    case 'acciones':
      return d.length ? <TarjetaAcciones inicial={d} l={l} /> : null
    default:
      return null
  }
}

export function Chat() {
  const l = useLocale() as AppLocale
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  /* Debajo de 1400 el chat no tiene columna: vive detrás de un botón flotante
     y se abre a pantalla completa en el teléfono, como cajón lateral desde
     640. Arriba de 1400 `abierto` no cambia nada: la columna siempre está. */
  const [abierto, setAbierto] = useState(false)
  const fin = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!abierto) return
    campo.current?.focus({ preventScroll: true })
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [abierto])
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [turnos, cargando])

  async function enviar(pregunta: string) {
    const q = pregunta.trim()
    if (!q || cargando) return
    const hist: Turno[] = [...turnos, { role: 'user', content: q }]
    setTurnos(hist)
    setTexto('')
    setCargando(true)
    /* El turno del asistente se arma a medida que llegan los eventos. */
    let turno: Turno = { role: 'assistant', content: '', blocks: [], pasos: [], escribiendo: true }
    const pintar = (cambio: Partial<Turno>) => {
      turno = { ...turno, ...cambio }
      setTurnos([...hist, turno])
    }
    pintar({})
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: l, messages: hist.filter((t) => !t.error).map(({ role, content }) => ({ role, content })) }),
      })
      if (!r.ok || !r.body) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`)
      const reader = r.body.pipeThrough(new TextDecoderStream()).getReader()
      let resto = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        resto += value
        const lineas = resto.split('\n')
        resto = lineas.pop() ?? ''
        for (const linea of lineas) {
          if (!linea) continue
          const e = JSON.parse(linea)
          if (e.t === 'paso') pintar({ pasos: [...turno.pasos!, { id: e.id, tool: e.tool }] })
          else if (e.t === 'bloque') pintar({ pasos: turno.pasos!.filter((p) => p.id !== e.id), blocks: [...turno.blocks!, { id: e.id, tool: e.tool, data: e.data }] })
          else if (e.t === 'texto') pintar({ content: turno.content + e.d })
          else if (e.t === 'reset') pintar({ content: '' })
          else if (e.t === 'error') throw new Error(e.msg)
        }
      }
      pintar({ escribiendo: false, pasos: [] })
    } catch (e) {
      pintar({ content: (e as Error).message || 'Error', error: true, escribiendo: false, pasos: [] })
    } finally {
      setCargando(false)
    }
  }

  const nombre = l === 'en' ? 'Vacamuerta AI' : 'Vacamuerta IA'

  return (
    <>
    <button
      type="button"
      className="s-chat-fab"
      data-abierto={abierto}
      onClick={() => setAbierto(true)}
      aria-expanded={abierto}
      aria-controls="vm-chat"
    >
      <Icono d={PATH.chispa} size={15} grosor={2} />
      {nombre}
    </button>
    <div className="s-chat-velo" data-abierto={abierto} onClick={() => setAbierto(false)} aria-hidden />
    <aside
      id="vm-chat"
      aria-label={nombre}
      className="s-chat"
      data-abierto={abierto}
    >
      <header className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: 'var(--line)' }}>
        <Icono d={PATH.chispa} size={15} grosor={2} style={{ color: 'var(--accent)' }} />
        <h2 className="s-titulo m-0 flex-1">{nombre}</h2>
        <button
          type="button"
          className="s-chat-cerrar"
          onClick={() => setAbierto(false)}
          aria-label={l === 'en' ? 'Close' : 'Cerrar'}
        >
          <Icono d={PATH.cerrar} size={16} grosor={2} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {!turnos.length && (
          <div className="flex flex-col gap-2">
            <p className="s-desc m-0">
              {l === 'en'
                ? 'Answers come from the same series as the site, drawn as cards.'
                : 'Las respuestas salen de las mismas series del sitio, dibujadas como tarjetas.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGERENCIAS[l].map((s) => (
                <button key={s} type="button" className="s-boton" onClick={() => enviar(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {turnos.map((t, i) =>
          t.role === 'user' ? (
            <p key={i} className="s-cuerpo m-0 self-end rounded-[10px] px-3 py-2" style={{ background: 'var(--field)', color: 'var(--ink)', maxWidth: '85%' }}>
              {t.content}
            </p>
          ) : (
            <div key={i} className="flex flex-col gap-2" aria-busy={t.escribiendo}>
              {t.blocks?.map((b, j) => (
                <div key={b.id ?? j} className="s-entra"><Bloque b={b} l={l} /></div>
              ))}
              {t.pasos?.map((p) => <Esqueleto key={p.id} tool={p.tool} l={l} />)}
              {t.escribiendo && !t.content && !t.pasos?.length && !t.blocks?.length && (
                <span className="s-pensando" role="status" aria-label={l === 'en' ? 'Thinking' : 'Pensando'}>
                  <i /><i /><i />
                </span>
              )}
              {t.content && (
                <p className={`s-cuerpo m-0 ${t.escribiendo ? 's-caret' : ''}`} style={{ color: t.error ? 'var(--red)' : 'var(--ink)' }}>{t.content}</p>
              )}
            </div>
          ),
        )}
        {!cargando && repreguntas(turnos, l).length > 0 && (
          <div className="s-entra flex flex-col gap-1.5">
            <span className="s-micro" style={{ color: 'var(--ink-3)' }}>{l === 'en' ? 'Follow up' : 'Seguí con'}</span>
            <div className="flex flex-wrap gap-1.5">
              {repreguntas(turnos, l).map((q) => (
                <button key={q} type="button" className="s-boton" onClick={() => enviar(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
        <div ref={fin} />
      </div>

      <form
        className="s-chat-form border-t px-5 py-3"
        style={{ borderColor: 'var(--line)' }}
        onSubmit={(e) => { e.preventDefault(); enviar(texto) }}
      >
        <div className="s-buscador">
          <input
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={l === 'en' ? 'Ask about production, operators…' : 'Preguntá por producción, operadoras…'}
            aria-label={l === 'en' ? 'Question' : 'Pregunta'}
            className="h-7 text-[13px]"
          />
          <button type="submit" className="s-boton" disabled={cargando || !texto.trim()} aria-label={l === 'en' ? 'Send' : 'Enviar'}>
            {cargando ? <span className="s-spin" /> : <Icono d={PATH.enlace} size={13} />}
          </button>
        </div>
      </form>
    </aside>
    </>
  )
}
