/* Censo de estilos computados + variables + gaps + fuentes,
   por viewport × tema. Todo MEDIDO, nada estimado. */
const fs = require('fs')
const { OUT, VIEWPORTS, abrir } = require('./lib')

const CENSO = () => {
  const props = ['color', 'background-color', 'background-image', 'font-family', 'font-size',
    'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'margin-top', 'margin-bottom',
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'gap', 'row-gap', 'column-gap',
    'border-radius', 'border-top-width', 'border-color', 'box-shadow', 'opacity',
    'backdrop-filter', 'transition', 'transition-duration', 'transition-timing-function',
    'max-width', 'display', 'grid-template-columns', 'z-index', 'position', 'font-feature-settings',
    'font-variant-numeric', 'text-wrap', 'overflow', 'aspect-ratio', 'object-fit', 'filter', 'mix-blend-mode']

  const tally = {}
  const nodos = document.querySelectorAll('*')
  nodos.forEach((el) => {
    const cs = getComputedStyle(el)
    props.forEach((p) => {
      const v = cs.getPropertyValue(p)
      if (!v || v === 'none' || v === 'normal' || v === '0px' || v === 'auto' || v === 'rgba(0, 0, 0, 0)' || v === '0s' || v === 'visible' || v === 'static') return
      tally[p] ??= {}
      tally[p][v] = (tally[p][v] || 0) + 1
    })
  })

  // variables resueltas en :root y en .dark
  const rootCS = getComputedStyle(document.documentElement)
  const vars = {}
  for (const hoja of document.styleSheets) {
    let reglas
    try { reglas = hoja.cssRules } catch { continue }
    for (const r of reglas) {
      if (!r.style) continue
      for (const p of r.style) {
        if (p.startsWith('--')) vars[p] = rootCS.getPropertyValue(p).trim()
      }
    }
  }

  // distancias reales entre hermanos
  const gaps = []
  document.querySelectorAll('section, main > *, [class*="container"] > *, article').forEach((el) => {
    const a = el.getBoundingClientRect()
    const n = el.nextElementSibling
    if (!n) return
    const d = Math.round(n.getBoundingClientRect().top - a.bottom)
    if (d >= 0 && d < 400) gaps.push(d)
  })

  const fonts = [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.style}|${f.status}`)

  // medidas de layout
  const main = document.querySelector('main')
  const cuerpoTexto = [...document.querySelectorAll('p')]
    .filter((p) => p.textContent.trim().length > 60)
    .slice(0, 12)
    .map((p) => {
      const cs = getComputedStyle(p)
      const chAprox = parseFloat(cs.fontSize) * 0.5
      return {
        ancho: Math.round(p.getBoundingClientRect().width),
        fontSize: cs.fontSize,
        measure_ch: Math.round(p.getBoundingClientRect().width / chAprox),
      }
    })

  return {
    w: innerWidth,
    tema: document.documentElement.className,
    tally,
    vars,
    gaps,
    fonts: [...new Set(fonts)],
    nodos: nodos.length,
    main: main ? { ancho: Math.round(main.getBoundingClientRect().width), pad: getComputedStyle(main).padding } : null,
    cuerpoTexto,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
  }
}

;(async () => {
  const res = {}
  for (const vp of VIEWPORTS) {
    for (const tema of ['dark', 'light']) {
      const { browser, page } = await abrir({ width: vp.w, height: vp.h, theme: tema })
      const datos = await page.evaluate(CENSO)
      res[`${vp.name}-${tema}`] = datos
      console.log(`${vp.name}/${tema}: ${datos.nodos} nodos, ${datos.gaps.length} gaps, bg ${datos.bodyBg}`)
      await browser.close()
    }
  }
  fs.writeFileSync(`${OUT}/raw/censo.json`, JSON.stringify(res, null, 2))
  console.log('OK → raw/censo.json')
})()
