/* Estados interactivos: default / hover / focus-visible / active / disabled,
   aria-expanded, sticky al scrollear, y prefers-reduced-motion. */
const fs = require('fs')
const { OUT, abrir } = require('./lib')

const LEER = (el) => {
  const cs = getComputedStyle(el)
  const props = ['color', 'background-color', 'background-image', 'border-color', 'border-top-width',
    'box-shadow', 'opacity', 'outline', 'outline-offset', 'transform', 'text-decoration-line',
    'border-radius', 'padding', 'font-size', 'font-weight', 'letter-spacing', 'transition',
    'filter', 'backdrop-filter']
  const o = {}
  props.forEach((p) => {
    const v = cs.getPropertyValue(p)
    if (v && v !== 'none' && v !== 'normal') o[p] = v
  })
  const r = el.getBoundingClientRect()
  o['@caja'] = `${Math.round(r.width)}x${Math.round(r.height)}`
  return o
}

function diff(a, b) {
  const d = {}
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[k] !== b[k]) d[k] = `${a[k] ?? '—'} → ${b[k] ?? '—'}`
  }
  return d
}

;(async () => {
  const { browser, page } = await abrir({ width: 1280, height: 900, theme: 'dark' })
  await page.addScriptTag({ content: `window.__leer = ${LEER.toString()}` })

  // candidatos: cada tipo de control interactivo que exista
  const objetivos = await page.evaluate(() => {
    const vistos = new Set()
    const out = []
    const push = (el, rol) => {
      if (!el) return
      const firma = rol + '|' + el.className
      if (vistos.has(firma)) return
      vistos.add(firma)
      el.setAttribute('data-audit', `a${out.length}`)
      out.push({ ref: `a${out.length}`, rol, tag: el.tagName.toLowerCase(), clase: el.className.slice(0, 160), txt: el.textContent.trim().slice(0, 40) })
    }
    document.querySelectorAll('button').forEach((b) => push(b, 'button'))
    document.querySelectorAll('a[href]').forEach((a) => push(a, 'link'))
    document.querySelectorAll('input, textarea, select').forEach((i) => push(i, 'field'))
    document.querySelectorAll('[role="tab"], [role="switch"], [role="checkbox"]').forEach((i) => push(i, 'widget'))
    return out.slice(0, 60)
  })

  const res = []
  for (const o of objetivos) {
    const sel = `[data-audit="${o.ref}"]`
    const el = page.locator(sel)
    try {
      if (!(await el.isVisible())) continue
      const base = await page.$eval(sel, (e) => window.__leer(e))

      await el.hover({ timeout: 2000 })
      await page.waitForTimeout(260)
      const hover = await page.$eval(sel, (e) => window.__leer(e))

      // focus-visible: sólo se activa por teclado
      await page.$eval(sel, (e) => e.blur())
      await page.keyboard.press('Tab') // ruido, para marcar navegación por teclado
      await page.$eval(sel, (e) => e.focus())
      await page.waitForTimeout(160)
      const focus = await page.$eval(sel, (e) => window.__leer(e))

      await page.mouse.move(5, 5)
      await page.waitForTimeout(200)

      res.push({
        ...o,
        base,
        hover: diff(base, hover),
        focus: diff(base, focus),
        deshabilitado: await page.$eval(sel, (e) => e.disabled ?? e.getAttribute('aria-disabled') ?? null),
        expandido: await page.$eval(sel, (e) => e.getAttribute('aria-expanded')),
      })
    } catch (e) {
      res.push({ ...o, error: e.message.split('\n')[0] })
    }
  }
  await browser.close()

  // sticky / scrolled
  const { browser: b2, page: p2 } = await abrir({ width: 1280, height: 900, theme: 'dark' })
  const sticky = await p2.evaluate(() => {
    const out = []
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el)
      if (cs.position === 'sticky' || cs.position === 'fixed') {
        const r = el.getBoundingClientRect()
        out.push({
          tag: el.tagName.toLowerCase(), clase: el.className.slice(0, 120), pos: cs.position,
          top: cs.top, z: cs.zIndex, caja: `${Math.round(r.width)}x${Math.round(r.height)}`,
          bg: cs.backgroundColor, blur: cs.backdropFilter, borde: cs.borderBottomWidth + ' ' + cs.borderBottomColor,
        })
      }
    })
    return out
  })
  const antesScroll = await p2.evaluate(() => {
    const h = document.querySelector('header') || document.querySelector('aside')
    return h ? { bg: getComputedStyle(h).backgroundColor, shadow: getComputedStyle(h).boxShadow, blur: getComputedStyle(h).backdropFilter, borde: getComputedStyle(h).borderBottomColor } : null
  })
  await p2.evaluate(() => window.scrollTo(0, 1200))
  await p2.waitForTimeout(700)
  const despuesScroll = await p2.evaluate(() => {
    const h = document.querySelector('header') || document.querySelector('aside')
    return h ? { bg: getComputedStyle(h).backgroundColor, shadow: getComputedStyle(h).boxShadow, blur: getComputedStyle(h).backdropFilter, borde: getComputedStyle(h).borderBottomColor } : null
  })
  await b2.close()

  // reduced motion
  const { browser: b3, page: p3 } = await abrir({ width: 1280, height: 900, theme: 'dark', reducedMotion: 'reduce' })
  const rm = await p3.evaluate(() => ({
    animaciones: document.getAnimations().length,
    corriendo: document.getAnimations().filter((a) => a.playState === 'running').length,
    nombres: [...new Set(document.getAnimations().map((a) => a.animationName).filter(Boolean))].slice(0, 20),
    transiciones: [...document.querySelectorAll('*')].filter((e) => {
      const d = getComputedStyle(e).transitionDuration
      return d && d !== '0s'
    }).length,
  }))
  await b3.close()

  const { browser: b4, page: p4 } = await abrir({ width: 1280, height: 900, theme: 'dark' })
  const normal = await p4.evaluate(() => ({
    animaciones: document.getAnimations().length,
    corriendo: document.getAnimations().filter((a) => a.playState === 'running').length,
    nombres: [...new Set(document.getAnimations().map((a) => a.animationName).filter(Boolean))].slice(0, 20),
    transiciones: [...document.querySelectorAll('*')].filter((e) => {
      const d = getComputedStyle(e).transitionDuration
      return d && d !== '0s'
    }).length,
  }))
  await b4.close()

  fs.writeFileSync(`${OUT}/raw/estados.json`, JSON.stringify({ controles: res, sticky, scroll: { antesScroll, despuesScroll }, movimiento: { normal, reducido: rm } }, null, 2))
  console.log(`OK → ${res.length} controles, ${sticky.length} sticky/fixed`)
  console.log('movimiento normal:', JSON.stringify(normal))
  console.log('movimiento reducido:', JSON.stringify(rm))
})()
