/* Anatomía por componente: estructura, dimensiones y estilos computados
   de cada sección y de las piezas del chrome. También íconos, imágenes,
   pila de z-index, gradientes y bloques de código. */
const fs = require('fs')
const { OUT, abrir } = require('./lib')

const CLAVES = ['display', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'grid-template-columns', 'padding', 'margin', 'width', 'height', 'min-height', 'max-width',
  'background-color', 'background-image', 'border-radius', 'border-top-width', 'border-top-color',
  'border-top-style', 'box-shadow', 'color', 'font-family', 'font-size', 'font-weight',
  'line-height', 'letter-spacing', 'text-transform', 'opacity', 'overflow', 'position',
  'z-index', 'transition', 'backdrop-filter', 'font-variant-numeric', 'white-space']

const DUMP = (claves) => {
  const est = (el) => {
    const cs = getComputedStyle(el)
    const o = {}
    claves.forEach((p) => {
      const v = cs.getPropertyValue(p)
      if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') o[p] = v
    })
    const r = el.getBoundingClientRect()
    o['@caja'] = `${Math.round(r.width)}×${Math.round(r.height)}`
    return o
  }

  const arbol = (el, prof = 0, max = 4) => {
    if (prof > max) return null
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return null
    return {
      tag: el.tagName.toLowerCase(),
      clase: (typeof el.className === 'string' ? el.className : '').slice(0, 220),
      rol: el.getAttribute('role') || undefined,
      aria: [...el.attributes].filter((a) => a.name.startsWith('aria-')).map((a) => `${a.name}=${a.value}`).join(' ') || undefined,
      txt: (el.children.length === 0 ? el.textContent.trim().slice(0, 60) : undefined) || undefined,
      css: est(el),
      hijos: [...el.children].slice(0, 10).map((c) => arbol(c, prof + 1, max)).filter(Boolean),
    }
  }

  const secciones = [...document.querySelectorAll('section[id]')]
    .filter((s) => s.id && s.id !== '_R_')
    .map((s) => ({ id: s.id, arbol: arbol(s, 0, 4) }))

  const chrome = {}
  for (const [n, sel] of [['aside', 'aside'], ['header', 'header'], ['footer', 'footer'], ['nav', 'nav']]) {
    const el = document.querySelector(sel)
    if (el) chrome[n] = arbol(el, 0, 5)
  }

  // íconos: todos los svg y sus atributos de trazo
  const iconos = [...document.querySelectorAll('svg')].map((s) => {
    const cs = getComputedStyle(s)
    const r = s.getBoundingClientRect()
    return {
      viewBox: s.getAttribute('viewBox'),
      caja: `${Math.round(r.width)}×${Math.round(r.height)}`,
      w: s.getAttribute('width'), h: s.getAttribute('height'),
      stroke: s.getAttribute('stroke') || cs.stroke,
      strokeWidth: s.getAttribute('stroke-width') || cs.strokeWidth,
      linecap: s.getAttribute('stroke-linecap'), linejoin: s.getAttribute('stroke-linejoin'),
      fill: s.getAttribute('fill') || cs.fill,
      clase: (s.getAttribute('class') || '').slice(0, 90),
      paths: s.querySelectorAll('path,circle,rect,line,polyline').length,
      d0: (s.querySelector('path')?.getAttribute('d') || '').slice(0, 70),
    }
  })

  // imágenes
  const imagenes = [...document.querySelectorAll('img')].map((i) => {
    const cs = getComputedStyle(i)
    const r = i.getBoundingClientRect()
    return { src: i.currentSrc || i.src, alt: i.alt, loading: i.loading, decoding: i.decoding,
      caja: `${Math.round(r.width)}×${Math.round(r.height)}`, natural: `${i.naturalWidth}×${i.naturalHeight}`,
      radius: cs.borderRadius, fit: cs.objectFit, ratio: cs.aspectRatio, filtro: cs.filter }
  })

  // pila de z-index
  const zstack = [...document.querySelectorAll('*')]
    .map((el) => ({ el, cs: getComputedStyle(el) }))
    .filter(({ cs }) => cs.zIndex !== 'auto' && cs.zIndex !== '0')
    .map(({ el, cs }) => ({ z: parseInt(cs.zIndex), pos: cs.position, tag: el.tagName.toLowerCase(), clase: (typeof el.className === 'string' ? el.className : '').slice(0, 90) }))
    .sort((a, b) => b.z - a.z)

  // gradientes y fondos con imagen
  const gradientes = [...new Set([...document.querySelectorAll('*')]
    .map((el) => getComputedStyle(el).backgroundImage)
    .filter((v) => v && v !== 'none'))]

  // bloques de código / mono
  const mono = [...document.querySelectorAll('*')]
    .filter((el) => getComputedStyle(el).fontFamily.toLowerCase().includes('mono') && el.children.length === 0 && el.textContent.trim())
    .slice(0, 25)
    .map((el) => {
      const cs = getComputedStyle(el)
      return { tag: el.tagName.toLowerCase(), clase: (typeof el.className === 'string' ? el.className : '').slice(0, 90),
        size: cs.fontSize, weight: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight, color: cs.color,
        txt: el.textContent.trim().slice(0, 40) }
    })

  return { secciones, chrome, iconos, imagenes, zstack, gradientes, mono, alto: document.documentElement.scrollHeight }
}

;(async () => {
  const salida = {}
  for (const tema of ['dark', 'light']) {
    const { browser, page } = await abrir({ width: 1280, height: 900, theme: tema })
    // hacer scroll por toda la página para que todo lo perezoso se monte
    await page.evaluate(async () => {
      const alto = document.documentElement.scrollHeight
      for (let y = 0; y < alto; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)) }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1200)
    salida[tema] = await page.evaluate(DUMP, CLAVES)
    console.log(`${tema}: ${salida[tema].secciones.length} secciones, ${salida[tema].iconos.length} svg, ${salida[tema].zstack.length} con z-index, ${salida[tema].gradientes.length} gradientes`)
    await browser.close()
  }
  fs.writeFileSync(`${OUT}/raw/componentes.json`, JSON.stringify(salida, null, 2))
  console.log('OK → raw/componentes.json')
})()
