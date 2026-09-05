/* Capturas de referencia: página completa por viewport × tema,
   y cada sección de componente a 1280 en los dos temas. */
const fs = require('fs')
const { OUT, VIEWPORTS, abrir } = require('./lib')

const DIR = `${OUT}/screenshots`

;(async () => {
  const inventario = []

  // 1) página completa por viewport × tema
  for (const vp of VIEWPORTS) {
    for (const tema of ['dark', 'light']) {
      const { browser, page } = await abrir({ width: vp.w, height: vp.h, theme: tema })
      const f = `${DIR}/pagina-${vp.name}-${tema}.png`
      await page.screenshot({ path: f, fullPage: true })
      // y el primer viewport sin scroll, que es lo que se ve al entrar
      const f2 = `${DIR}/inicio-${vp.name}-${tema}.png`
      await page.screenshot({ path: f2 })
      inventario.push({ archivo: f.split('/').pop(), tipo: 'pagina-completa', vp: vp.name, tema })
      inventario.push({ archivo: f2.split('/').pop(), tipo: 'primer-viewport', vp: vp.name, tema })
      console.log(`pagina ${vp.name}/${tema}`)
      await browser.close()
    }
  }

  // 2) cada sección a 1280, ambos temas
  for (const tema of ['dark', 'light']) {
    const { browser, page } = await abrir({ width: 1280, height: 900, theme: tema })
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('section[id]')].map((s) => s.id).filter((i) => i && i !== '_R_'),
    )
    for (const id of ids) {
      const el = page.locator(`#${CSS.escape ? id : id}`).first()
      try {
        await el.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        const f = `${DIR}/seccion-${id}-${tema}.png`
        await el.screenshot({ path: f })
        inventario.push({ archivo: f.split('/').pop(), tipo: 'seccion', id, vp: '1280', tema })
      } catch (e) {
        console.log(`  !! ${id}: ${e.message.split('\n')[0]}`)
      }
    }
    console.log(`secciones ${tema}: ${ids.length}`)

    // 3) sidebar y footer aparte
    for (const [nombre, sel] of [['sidebar', 'aside'], ['header', 'header'], ['footer', 'footer']]) {
      const l = page.locator(sel).first()
      if (await l.count()) {
        try {
          await l.scrollIntoViewIfNeeded()
          const f = `${DIR}/${nombre}-${tema}.png`
          await l.screenshot({ path: f })
          inventario.push({ archivo: f.split('/').pop(), tipo: 'chrome', id: nombre, tema })
        } catch {}
      }
    }
    await browser.close()
  }

  fs.writeFileSync(`${DIR}/inventario.json`, JSON.stringify(inventario, null, 2))
  console.log(`OK → ${inventario.length} capturas`)
})()
