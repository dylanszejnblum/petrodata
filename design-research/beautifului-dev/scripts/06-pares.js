/* Pares texto/fondo REALES: para cada elemento con texto propio resuelve el
   fondo efectivo subiendo por los ancestros hasta encontrar uno opaco, y
   registra tamaño y peso. Sale con frecuencia de uso. */
const fs = require('fs')
const { OUT, abrir } = require('./lib')

const PARES = () => {
  const aRGB = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const mezclar = (fg, bg) => ({
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  })
  const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, '0')).join('')

  /** fondo efectivo: sube hasta juntar alfa 1 */
  const fondoDe = (el) => {
    let acc = null
    let n = el
    while (n && n !== document.documentElement.parentNode) {
      const c = aRGB(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0) {
        acc = acc === null ? c : mezclar(acc, c)
        if (acc.a >= 0.999) return acc
      }
      n = n.parentElement
    }
    // último recurso: el fondo del documento
    const doc = aRGB(getComputedStyle(document.documentElement).backgroundColor)
    return acc ? mezclar(acc, doc || { r: 255, g: 255, b: 255, a: 1 }) : doc || { r: 255, g: 255, b: 255, a: 1 }
  }

  const cuenta = {}
  document.querySelectorAll('*').forEach((el) => {
    // sólo elementos con texto PROPIO
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)
    if (!propio) return
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return

    const fgRaw = aRGB(cs.color)
    if (!fgRaw) return
    const bg = fondoDe(el)
    const fg = fgRaw.a < 1 ? mezclar(fgRaw, bg) : fgRaw

    const clave = `${hex(fg)}|${hex(bg)}|${cs.fontSize}|${cs.fontWeight}`
    cuenta[clave] ??= { fg: hex(fg), bg: hex(bg), size: cs.fontSize, weight: cs.fontWeight, n: 0, ejemplos: [] }
    cuenta[clave].n++
    if (cuenta[clave].ejemplos.length < 2) {
      cuenta[clave].ejemplos.push({
        tag: el.tagName.toLowerCase(),
        clase: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        txt: el.textContent.trim().slice(0, 34),
      })
    }
  })
  return Object.values(cuenta).sort((a, b) => b.n - a.n)
}

;(async () => {
  const out = {}
  for (const tema of ['dark', 'light']) {
    const { browser, page } = await abrir({ width: 1280, height: 900, theme: tema })
    await page.evaluate(async () => {
      const alto = document.documentElement.scrollHeight
      for (let y = 0; y < alto; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)) }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1000)
    out[tema] = await page.evaluate(PARES)
    console.log(`${tema}: ${out[tema].length} pares distintos, ${out[tema].reduce((s, p) => s + p.n, 0)} elementos`)
    await browser.close()
  }
  fs.writeFileSync(`${OUT}/raw/pares-contraste.json`, JSON.stringify(out, null, 2))
  console.log('OK → raw/pares-contraste.json')
})()
