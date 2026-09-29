import { NextRequest } from 'next/server'
import { loadHeadline, loadTopOperators, loadVM } from '@/lib/data/production'
import { loadProvinces } from '@/lib/data/provinces'
import { loadNews } from '@/lib/data/news'
import { loadVmSerie } from '@/lib/data/inversiones'
import { loadAcciones, loadDolar, loadEnergiaViva } from '@/lib/data/vivo'

/* Chat con los datos — DeepSeek (API compatible con OpenAI) con herramientas
   que llaman a los MISMOS loaders que las páginas. Cada resultado de
   herramienta vuelve al cliente como un bloque y el panel lo dibuja con el kit
   del sistema: esa es la parte "generativa" de la UI.

   La respuesta sale como NDJSON, un evento por renglón, para que el panel
   muestre cada paso mientras pasa:
     {t:'paso', id, tool}          empieza una herramienta
     {t:'bloque', id, tool, data}  terminó; el panel dibuja la tarjeta
     {t:'texto', d}                un pedazo del comentario del modelo
     {t:'reset'}                   el texto previo era preámbulo de herramientas
     {t:'error', msg}
   GET ?vivo=<tool> devuelve sólo los datos, para refrescar las tarjetas vivas. */

const TOOLS = [
  {
    name: 'resumen_vaca_muerta',
    description: 'Producción de Vaca Muerta del último mes: petróleo bbl/d, gas MMm³/d, BOE, participación en el total nacional, variación mensual e interanual, pozos. mom*, oilYoY y vmShare son FRACCIONES (-0.22 = -22%); *SharePct ya son porcentajes. El último mes puede estar incompleto: una caída mensual fuerte suele ser eso, no una caída real.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'serie_produccion',
    description: 'Serie mensual de Vaca Muerta: petróleo (bbl/d) y gas (MMm³/d), sólo meses completos.',
    parameters: { type: 'object', properties: { meses: { type: 'integer', minimum: 2, maximum: 24 } } },
  },
  {
    name: 'ranking_operadoras',
    description: 'Ranking de operadoras en Vaca Muerta del último mes por BOE.',
    parameters: { type: 'object', properties: { limite: { type: 'integer', minimum: 1, maximum: 15 } } },
  },
  {
    name: 'provincias',
    description: 'Provincias productoras: cuenca, pozos de petróleo y gas, exportaciones en millones de USD y participación.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'noticias',
    description: 'Últimas noticias del sector.',
    parameters: { type: 'object', properties: { cantidad: { type: 'integer', minimum: 1, maximum: 8 } } },
  },
  {
    name: 'precios_energia',
    description: 'EN VIVO: Brent, WTI (USD/bbl) y Henry Hub (USD/MMBtu), con variación diaria en cambioPct (YA en %: -8.5 = -8,5%) y cierres del último mes. Si preguntan por UNO solo, pasá `producto`: se dibuja como tarjeta grande con gráfico.',
    parameters: { type: 'object', properties: { producto: { type: 'string', enum: ['brent', 'wti', 'henry_hub'] } } },
  },
  {
    name: 'dolar',
    description: 'EN VIVO: cotizaciones del dólar en Argentina (oficial, blue, MEP, CCL, mayorista), compra y venta en ARS.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'acciones',
    description: 'EN VIVO: precio y variación diaria en cambioPct (YA en %) de las acciones de las petroleras. Tickers: YPF, VIST, PAM, CAPX, GPRK, CVX, SHEL, TTE. Si preguntan por empresas puntuales, pasá `tickers` (hasta 4): trae el último mes y se grafica.',
    parameters: { type: 'object', properties: { tickers: { type: 'array', items: { type: 'string' }, maxItems: 4 } } },
  },
] as const

type Args = { meses?: number; limite?: number; cantidad?: number; producto?: string; tickers?: string[] }

/* El modelo leía −0,085 como −0,5%: le damos el porcentaje hecho. La tarjeta
   sigue usando `cambio` en fracción, como el resto del kit. */
const conPct = <T extends { cambio: number | null }>(xs: T[]) =>
  xs.map((x) => ({ ...x, cambioPct: x.cambio == null ? null : Math.round(x.cambio * 1000) / 10 }))

/** El schema de la herramienta es una sugerencia para el modelo, no un
    límite: los números se recortan acá. */
const tope = (v: unknown, def: number, max: number) => Math.min(Math.max(1, Math.trunc(Number(v)) || def), max)

/* ── Protección del endpoint ─────────────────────────────────────────────
   Sin login, así que tres filtros baratos: sólo desde el propio sitio
   (el navegador manda sec-fetch-site / origin y un script cualquiera no puede
   falsear el del navegador de un tercero), un tope de cuerpo, y un límite por
   IP. La IP sale de cf-connecting-ip (vacamuerta.io está detrás de
   Cloudflare) y si no, del último salto de x-forwarded-for, que lo agrega el
   proxy y no el cliente.
   ponytail: el límite vive en memoria de UNA instancia; con varias réplicas
   pasa a Redis o a una regla de rate limit en Cloudflare. */
const VENTANA = 60_000
const cubos = new Map<string, { n: number; desde: number }>()

function ipDe(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for')?.split(',').map((x) => x.trim()).filter(Boolean)
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? xff?.at(-1) ?? 'local'
}

function rechazo(req: NextRequest, cupo: number): Response | null {
  const sitio = req.headers.get('sec-fetch-site')
  const origen = req.headers.get('origin')
  const ajeno = sitio ? sitio !== 'same-origin' : origen != null && new URL(origen).host !== req.headers.get('host')
  if (ajeno) return Response.json({ error: 'origen no permitido' }, { status: 403 })

  const ahora = Date.now()
  if (cubos.size > 10_000) for (const [k, v] of cubos) if (ahora - v.desde > VENTANA) cubos.delete(k)
  const clave = `${cupo}:${ipDe(req)}`
  const c = cubos.get(clave)
  if (!c || ahora - c.desde > VENTANA) cubos.set(clave, { n: 1, desde: ahora })
  else if (++c.n > cupo)
    return Response.json({ error: 'demasiadas consultas, probá en un minuto' }, { status: 429, headers: { 'retry-after': '60' } })
  return null
}

async function run(name: string, a: Args, locale: string): Promise<unknown> {
  switch (name) {
    case 'resumen_vaca_muerta': {
      const [h, vm, serie] = await Promise.all([loadHeadline(), loadVM(), loadVmSerie(locale)])
      const doce = serie.points.filter((p) => !p.preliminary).slice(-12)
      return {
        ...h,
        oilYoY: vm.oilYoY,
        oilSharePct: vm.oilSharePct,
        gasSharePct: vm.gasSharePct,
        vmWells: vm.wells,
        // doce meses completos, para las chispas de la tarjeta
        oil12: doce.map((p) => Math.round(p.oilBblD)),
        gas12: doce.map((p) => p.gasMm3D),
      }
    }
    case 'serie_produccion':
      return (await loadVmSerie(locale)).points
        .filter((p) => !p.preliminary)
        .slice(-tope(a.meses, 12, 24))
        .map((p) => ({ period: p.period, oil: Math.round(p.oilBblD), gas: p.gasMm3D }))
    case 'ranking_operadoras':
      return (await loadTopOperators(tope(a.limite, 5, 15))).map(({ slug, name, boeDay, boeMonth, color }) => ({ slug, name, boeDay, boeMonth, color }))
    case 'provincias':
      return (await loadProvinces())
        .filter((p) => p.esProvincia !== false && p.wells > 0)
        .sort((x, y) => y.wells - x.wells)
        .map(({ slug, name, basin, wells, exportsMUSD, expSharePct }) => ({ slug, name, basin, wells, exportsMUSD, expSharePct }))
    case 'noticias':
      return (await loadNews(tope(a.cantidad, 4, 8))).slice(0, tope(a.cantidad, 4, 8)).map(({ id, title, source, date, category }) => ({ id, title, source, date, category }))
    case 'precios_energia':
      return conPct(await loadEnergiaViva(a.producto))
    case 'dolar':
      return await loadDolar()
    case 'acciones':
      return conPct(await loadAcciones(a.tickers))
    default:
      return { error: `herramienta desconocida: ${name}` }
  }
}

type Msg = { role: 'user' | 'assistant'; content: string }
type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }

const VIVOS = new Set(['precios_energia', 'dolar', 'acciones'])

export async function GET(req: NextRequest) {
  const no = rechazo(req, 30)
  if (no) return no
  const tool = req.nextUrl.searchParams.get('vivo') ?? ''
  if (!VIVOS.has(tool)) return Response.json({ error: 'no es una herramienta viva' }, { status: 400 })
  const q = req.nextUrl.searchParams
  const args: Args = { producto: q.get('producto') ?? undefined, tickers: q.get('tickers')?.split(',').filter(Boolean) }
  // el CDN absorbe los refrescos repetidos; el dato vivo igual se renueva cada minuto
  return Response.json(await run(tool, args, 'es'), { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' } })
}

/** Lee el SSE de DeepSeek: emite el texto a medida que llega y arma las
    llamadas a herramientas, que vienen partidas en pedazos por índice. */
async function* deepseek(key: string, messages: unknown[], signal: AbortSignal, forzar: boolean) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages,
      tools: TOOLS.map((t) => ({ type: 'function', function: t })),
      /* La primera vuelta de cada pregunta TIENE que traer datos: sin esto el
         modelo contestaba de memoria lo que ya había dicho antes (el Brent en
         texto, sin tarjeta). Las vueltas siguientes son libres para comentar. */
      tool_choice: forzar ? 'required' : 'auto',
      temperature: 0.3,
      max_tokens: 600,
      stream: true,
    }),
    signal,
  })
  if (!r.ok || !r.body) throw new Error(`DeepSeek ${r.status}`)
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader()
  let resto = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    resto += value
    const lineas = resto.split('\n')
    resto = lineas.pop() ?? ''
    for (const l of lineas) {
      if (!l.startsWith('data: ') || l === 'data: [DONE]') continue
      const delta = JSON.parse(l.slice(6)).choices?.[0]?.delta
      if (delta) yield delta as { content?: string; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] }
    }
  }
}

export async function POST(req: NextRequest) {
  const no = rechazo(req, 10)
  if (no) return no
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) {
    console.error('[chat] falta DEEPSEEK_API_KEY')
    return Response.json({ error: 'no disponible' }, { status: 503 })
  }

  // tope de cuerpo ANTES de parsear: 12 turnos × 2000 caracteres entran holgados en 64 KB
  const crudo = await req.text()
  if (crudo.length > 64_000) return Response.json({ error: 'consulta demasiado larga' }, { status: 413 })
  const body = (() => { try { return JSON.parse(crudo) } catch { return null } })() as { messages?: Msg[]; locale?: string } | null
  // ponytail: historial acotado a los últimos 12 turnos de texto; los bloques no vuelven al modelo.
  const history = (body?.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  if (!history.length) return Response.json({ error: 'Sin mensajes' }, { status: 400 })

  const locale = body?.locale === 'en' ? 'en' : 'es'
  const lang = locale === 'en' ? 'English' : 'español rioplatense'
  const messages: unknown[] = [
    {
      role: 'system',
      content:
        `Sos Vacamuerta IA, el analista de datos de vacamuerta.io (petróleo y gas de Argentina). Respondé en ${lang}, breve: ` +
        `2 a 4 oraciones. Usá SIEMPRE las herramientas para cualquier cifra; nunca inventes números. ` +
        `Las herramientas ya se muestran al usuario como tarjetas y gráficos, así que no repitas tablas: ` +
        `comentá lo relevante (tendencia, líder, proporción). La producción es mensual; precios, dólar y acciones ` +
        `son en vivo. Sin markdown. No escribas nada antes de llamar herramientas. Aunque el dato ya esté en la ` +
        `conversación, volvé a llamar la herramienta: el usuario ve tarjetas y gráficos, no texto. Elegí los ` +
        `parámetros que den un gráfico (producto para un commodity, tickers para empresas puntuales).`,
    },
    ...history,
  ]

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (e: object) => ctrl.enqueue(enc.encode(JSON.stringify(e) + '\n'))
      try {
        // ponytail: cuatro vueltas de herramientas alcanzan para estas preguntas.
        for (let vuelta = 0; vuelta < 4; vuelta++) {
          let texto = ''
          const calls: ToolCall[] = []
          for await (const d of deepseek(key, messages, req.signal, vuelta === 0)) {
            if (d.content) {
              texto += d.content
              emit({ t: 'texto', d: d.content })
            }
            for (const tc of d.tool_calls ?? []) {
              const c = (calls[tc.index] ??= { id: '', type: 'function', function: { name: '', arguments: '' } })
              if (tc.id) c.id = tc.id
              if (tc.function?.name) c.function.name += tc.function.name
              if (tc.function?.arguments) c.function.arguments += tc.function.arguments
            }
          }
          if (!calls.length) break
          calls.splice(4) // como mucho cuatro herramientas por vuelta
          if (texto) emit({ t: 'reset' })

          messages.push({ role: 'assistant', content: texto, tool_calls: calls })
          for (const c of calls) emit({ t: 'paso', id: c.id, tool: c.function.name })
          // las herramientas de una vuelta corren en paralelo; cada tarjeta sale apenas su dato llega
          await Promise.all(
            calls.map(async (c) => {
              let args: Args = {}
              try { args = JSON.parse(c.function.arguments || '{}') } catch {}
              const data = await run(c.function.name, args, locale).catch(() => ({ error: 'no disponible' }))
              emit({ t: 'bloque', id: c.id, tool: c.function.name, data })
              messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(data) })
            }),
          )
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error('[chat]', e)
          emit({ t: 'error', msg: locale === 'en' ? 'Service unavailable, try again' : 'No disponible, probá de nuevo' })
        }
      }
      ctrl.close()
    },
  })
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } })
}
