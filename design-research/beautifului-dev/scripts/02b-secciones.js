/* Captura de cada sección de componente (el 02 se cayó acá por CSS.escape,
   que no existe en Node: se usa el selector por atributo, siempre válido). */
const fs = require('fs')
const { OUT, abrir } = require('./lib')
const DIR = `${OUT}/screenshots`

;(async () => {
  const previo = fs.existsSync(`${DIR}/inventario.json`)
    ? JSON.parse(fs.readFileSync(`${DIR}/inventario.json`, 'utf8'))
    : []
  const inventario = previo.filter(Boolean)
  for (const tema of ['dark', 'light']) {
    const { browser, page } = await abrir({ width: 1280, height: 900, theme: tema })
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('section[id]')].map((s) => s.id).filter((i) => i && i !== '_R_'),
    )
    for (const id of ids) {
      const el = page.locator(`[id="${id}"]`).first()
      try {
        await el.scrollIntoViewIfNeeded()
        await page.waitForTimeout(600)
        const f = `${DIR}/seccion-${id}-${tema}.png`
        await el.screenshot({ path: f })
        inventario.push({ archivo: f.split('/').pop(), tipo: 'seccion', id, vp: '1280', tema })
      } catch (e) {
        console.log(`  !! ${id}: ${e.message.split('\n')[0]}`)
      }
    }
    console.log(`secciones ${tema}: ${ids.length}`)

    for (const [nombre, sel] of [['sidebar', 'aside'], ['header', 'header'], ['footer', 'footer']]) {
      const l = page.locator(sel).first()
      if (await l.count()) {
        try {
          await l.scrollIntoViewIfNeeded()
          await page.waitForTimeout(300)
          const f = `${DIR}/${nombre}-${tema}.png`
          await l.screenshot({ path: f })
          inventario.push({ archivo: f.split('/').pop(), tipo: 'chrome', id: nombre, tema })
        } catch {}
      }
    }
    await browser.close()
  }
  fs.writeFileSync(`${DIR}/inventario.json`, JSON.stringify(inventario, null, 2))
  console.log(`OK → ${inventario.length} capturas en total`)
})()
