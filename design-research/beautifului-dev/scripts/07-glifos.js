/* ¿Qué cambia realmente font-feature-settings:"cv11","ss01"?
   Se mide el ancho de avance de cada carácter con y sin las features,
   sobre la MISMA fuente Inter que sirve el sitio. */
const fs = require('fs')
const { abrir } = require('./lib')
const OUT = '/Users/macbookpro-1/Documents/VM-Repo/petrodata/design-research/beautifului-dev'

;(async () => {
  const { browser, page } = await abrir({ width: 1280, height: 900, theme: 'dark' })
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas')
    const ctx = cv.getContext('2d')
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?$@#%&*()[]{}/\\-_"\'`'.split('')
    const medir = (feat) => {
      const d = document.createElement('div')
      d.style.cssText = `position:absolute;left:-9999px;font-family:Inter,"Inter Fallback";font-size:100px;font-feature-settings:${feat};white-space:pre`
      document.body.appendChild(d)
      const out = {}
      for (const c of chars) { d.textContent = c; out[c] = d.getBoundingClientRect().width }
      // y una captura de forma: ancho de una cadena larga
      d.textContent = chars.join('')
      out['@total'] = d.getBoundingClientRect().width
      d.remove()
      return out
    }
    const sin = medir('normal')
    const con = medir('"cv11","ss01"')
    const soloCv11 = medir('"cv11"')
    const soloSs01 = medir('"ss01"')
    const dif = (a, b) => Object.keys(a).filter((k) => Math.abs(a[k] - b[k]) > 0.01).map((k) => `${k}: ${a[k].toFixed(2)} → ${b[k].toFixed(2)}`)
    return {
      cambian_con_ambas: dif(sin, con),
      cambian_solo_cv11: dif(sin, soloCv11),
      cambian_solo_ss01: dif(sin, soloSs01),
      nota: 'un cambio de ancho prueba sustitución de glifo; un glifo alterno del MISMO ancho no se detecta acá',
    }
  })

  // prueba visual: mismo texto con y sin features, recortado
  await page.evaluate(() => {
    document.body.innerHTML = `<div style="background:#fff;color:#000;padding:20px;font-family:Inter;font-size:44px;line-height:1.4">
      <div style="font-feature-settings:normal">sin: agl 0123456789 Ilj1</div>
      <div style="font-feature-settings:'cv11','ss01'">con: agl 0123456789 Ilj1</div>
    </div>`
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/screenshots/prueba-glifos.png`, clip: { x: 0, y: 0, width: 900, height: 180 } })
  await browser.close()
  fs.writeFileSync(`${OUT}/raw/glifos.json`, JSON.stringify(r, null, 2))
  console.log(JSON.stringify(r, null, 2))
})()
