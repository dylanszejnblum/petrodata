/* Barrido de ancho 320→1920 de a 1px sobre una firma de layout.
   Encuentra los breakpoints REALES, sin asumir los de Tailwind. */
const fs = require('fs')
const { OUT, chromium, SITE } = require('./lib')

const FIRMA = () => {
  const q = (s) => document.querySelector(s)
  const r = (el) => (el ? el.getBoundingClientRect() : null)
  const main = q('main')
  const aside = q('aside')
  const sec = q('section[id]')
  const g = (el) => (el ? getComputedStyle(el) : null)
  const rMain = r(main), rAside = r(aside), rSec = r(sec)
  return [
    // ancho y posición del contenido
    rMain && Math.round(rMain.width), rMain && Math.round(rMain.left),
    // sidebar: ¿existe, dónde y cómo?
    rAside ? Math.round(rAside.width) : -1,
    aside ? g(aside).position : 'x',
    aside ? g(aside).display : 'x',
    // grilla de la primera sección
    rSec && Math.round(rSec.width),
    sec ? g(sec).gridTemplateColumns : 'x',
    sec ? g(sec).padding : 'x',
    // tipografía del titular
    q('h1') ? g(q('h1')).fontSize : 'x',
    q('h1') ? Math.round(r(q('h1')).width) : -1,
    // contenedor con max-width
    main ? g(main).maxWidth : 'x',
    // cuántos elementos están ocultos (cambia con las media queries)
    [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).display === 'none').length,
  ].join('|')
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 900 }, colorScheme: 'dark' })
  const page = await ctx.newPage()
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)

  const cambios = []
  let previa = null
  const paso1 = []
  for (let w = 320; w <= 1920; w += 1) {
    await page.setViewportSize({ width: w, height: 900 })
    const f = await page.evaluate(FIRMA)
    if (previa !== null && f !== previa) {
      cambios.push({ ancho: w, antes: previa, despues: f })
    }
    paso1.push({ w, f })
    previa = f
    if (w % 200 === 0) console.log(`  …${w}px`)
  }

  await browser.close()

  // qué campo cambió en cada quiebre
  const CAMPOS = ['main_w', 'main_left', 'aside_w', 'aside_pos', 'aside_display', 'sec_w', 'sec_cols', 'sec_pad', 'h1_size', 'h1_w', 'main_maxw', 'ocultos']
  const detalle = cambios.map((c) => {
    const a = c.antes.split('|'), d = c.despues.split('|')
    const difs = CAMPOS.map((n, i) => (a[i] !== d[i] ? `${n}: ${a[i]} → ${d[i]}` : null)).filter(Boolean)
    return { ancho: c.ancho, difs }
  })

  // los quiebres "duros" son los que cambian algo más que un ancho fluido
  const duros = detalle.filter((d) => d.difs.some((x) => !/^(main_w|main_left|sec_w|h1_w|aside_w)/.test(x)))

  fs.writeFileSync(`${OUT}/raw/barrido.json`, JSON.stringify({ totalCambios: cambios.length, duros, detalle }, null, 2))
  console.log('\n=== BREAKPOINTS DUROS ===')
  duros.forEach((d) => console.log(`${d.ancho}px → ${d.difs.join(' ; ')}`))
  console.log(`\n(${cambios.length} cambios en total; el resto es reflow fluido)`)
})()
