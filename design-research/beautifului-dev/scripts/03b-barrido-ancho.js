/* Barrido de ancho con una firma MUCHO más ancha: muestrea ~80 elementos
   representativos (uno por sección, la nav, cards, botones, campos, tablas)
   y registra display/columnas/padding/fontSize/ocultamiento de cada uno.
   Así los quiebres aparecen aunque toquen partes que el 03 no miraba. */
const fs = require('fs')
const { OUT, chromium, SITE } = require('./lib')

const MARCAR = () => {
  const sels = []
  const marcar = (el, etq) => {
    if (!el || el.dataset.bp) return
    el.dataset.bp = etq
    sels.push(etq)
  }
  marcar(document.querySelector('main'), 'main')
  marcar(document.querySelector('aside'), 'aside')
  marcar(document.querySelector('header'), 'header')
  marcar(document.querySelector('footer'), 'footer')
  marcar(document.querySelector('h1'), 'h1')
  marcar(document.querySelector('nav'), 'nav')
  document.querySelectorAll('section[id]').forEach((s, i) => {
    marcar(s, `sec${i}`)
    marcar(s.querySelector('h2, h3'), `sech${i}`)
    marcar(s.firstElementChild, `secfirst${i}`)
    // el "cuadro" de demo de cada sección
    marcar(s.querySelector('div > div'), `secbox${i}`)
  })
  document.querySelectorAll('button').forEach((b, i) => { if (i < 8) marcar(b, `btn${i}`) })
  document.querySelectorAll('table').forEach((t, i) => { if (i < 4) marcar(t, `tabla${i}`) })
  document.querySelectorAll('input, textarea').forEach((f, i) => { if (i < 4) marcar(f, `campo${i}`) })
  document.querySelectorAll('p').forEach((p, i) => { if (i < 6) marcar(p, `p${i}`) })
  return sels
}

const FIRMA = (sels) => {
  const partes = []
  for (const s of sels) {
    const el = document.querySelector(`[data-bp="${s}"]`)
    if (!el) { partes.push(`${s}:AUSENTE`); continue }
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    partes.push([
      s,
      cs.display,
      cs.gridTemplateColumns === 'none' ? '' : cs.gridTemplateColumns,
      cs.flexDirection,
      cs.padding,
      cs.fontSize,
      cs.position,
      cs.maxWidth,
      cs.textAlign,
      Math.round(r.width),
      Math.round(r.height),
      cs.visibility,
    ].join(','))
  }
  return partes.join('||')
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 900 }, colorScheme: 'dark' })
  const page = await ctx.newPage()
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  const sels = await page.evaluate(MARCAR)
  console.log(`muestreando ${sels.length} elementos`)

  const cambios = []
  let previa = null
  for (let w = 320; w <= 1920; w += 1) {
    await page.setViewportSize({ width: w, height: 900 })
    const f = await page.evaluate(FIRMA, sels)
    if (previa !== null && f !== previa) {
      const a = previa.split('||'), d = f.split('||')
      const difs = []
      for (let i = 0; i < Math.max(a.length, d.length); i++) {
        if (a[i] !== d[i]) {
          const ca = (a[i] || '').split(','), cd = (d[i] || '').split(',')
          const CAMPOS = ['el', 'display', 'cols', 'flexDir', 'padding', 'fontSize', 'position', 'maxW', 'textAlign', 'w', 'h', 'visibility']
          const soloNoFluidos = CAMPOS.map((n, j) => (ca[j] !== cd[j] && n !== 'w' && n !== 'h' ? `${ca[0]}.${n}: ${ca[j]} → ${cd[j]}` : null)).filter(Boolean)
          if (soloNoFluidos.length) difs.push(...soloNoFluidos)
        }
      }
      if (difs.length) cambios.push({ ancho: w, difs })
    }
    previa = f
    if (w % 400 === 0) console.log(`  …${w}px`)
  }
  await browser.close()

  fs.writeFileSync(`${OUT}/raw/barrido-ancho.json`, JSON.stringify(cambios, null, 2))
  console.log('\n=== QUIEBRES REALES (cambio no-fluido) ===')
  for (const c of cambios) {
    console.log(`\n${c.ancho}px  (${c.difs.length} cambios)`)
    c.difs.slice(0, 14).forEach((d) => console.log('   ' + d))
    if (c.difs.length > 14) console.log(`   … y ${c.difs.length - 14} más`)
  }
})()
