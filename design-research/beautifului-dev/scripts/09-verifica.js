/* Mide la réplica con el MISMO método que el original y compara. */
const fs = require('fs')
const { chromium } = require('playwright')
const OUT = '/Users/macbookpro-1/Documents/VM-Repo/petrodata/design-research/beautifului-dev'

const MEDIR = () => {
  const g = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null }
  const caja = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` }
  const body = g('body')
  return {
    body_bg: body.backgroundColor,
    body_trama: body.backgroundImage.replace(/\s+/g, ' ').slice(0, 120),
    body_attachment: body.backgroundAttachment,
    body_size: body.fontSize, body_lh: body.lineHeight, body_ls: body.letterSpacing,
    seccion_pad: g('.seccion').padding,
    seccion_borde: `${g('.seccion').borderBottomWidth} ${g('.seccion').borderBottomStyle} ${g('.seccion').borderBottomColor}`,
    gaps_secciones: [...document.querySelectorAll('.seccion')].map((s, i, a) => {
      const n = a[i + 1]; if (!n) return null
      return Math.round(n.getBoundingClientRect().top - s.getBoundingClientRect().bottom)
    }).filter(x => x !== null),
    sidebar_w: caja('.sidebar'), sidebar_pos: g('.sidebar').position,
    sidebar_borde: `${g('.sidebar').borderRightWidth} ${g('.sidebar').borderRightStyle}`,
    shell_w: caja('.shell'),
    demo_radio: g('.demo').borderRadius, demo_bg: g('.demo').backgroundColor,
    demo_sombra: g('.demo').boxShadow, demo_minh: g('.demo').minHeight, demo_pad: g('.demo').padding,
    card_radio: g('.card').borderRadius, card_bg: g('.card').backgroundColor, card_sombra: g('.card').boxShadow,
    cardpad: g('.card-pad').padding,
    navitem: { pad: g('.nav-item').padding, radio: g('.nav-item').borderRadius, size: g('.nav-item').fontSize, color: g('.nav-item').color, caja: caja('.nav-item') },
    navactivo: { color: g('.nav-item[aria-current]').color, peso: g('.nav-item[aria-current]').fontWeight, bg: g('.nav-item[aria-current]').backgroundColor },
    secnum: { fam: g('.sec-num').fontFamily.split(',')[0], size: g('.sec-num').fontSize, color: g('.sec-num').color, num: g('.sec-num').fontVariantNumeric },
    sectitle: { size: g('.sec-title').fontSize, peso: g('.sec-title').fontWeight, color: g('.sec-title').color },
    secdesc: { size: g('.sec-desc').fontSize, lh: g('.sec-desc').lineHeight, color: g('.sec-desc').color, wrap: g('.sec-desc').textWrap },
    pill: { caja: caja('.btn-pill'), pad: g('.btn-pill').padding, radio: g('.btn-pill').borderRadius, bg: g('.btn-pill').backgroundColor, size: g('.btn-pill').fontSize, peso: g('.btn-pill').fontWeight, sombra: g('.btn-pill').boxShadow },
    icono: { caja: caja('.btn-icon'), radio: g('.btn-icon').borderRadius, color: g('.btn-icon').color },
    iconosm: { caja: caja('.btn-icon-sm'), radio: g('.btn-icon-sm').borderRadius },
    th: { pad: g('.tabla th').padding, size: g('.tabla th').fontSize, peso: g('.tabla th').fontWeight, color: g('.tabla th').color },
    td: { pad: g('.tabla td').padding, size: g('.tabla td').fontSize, peso: g('.tabla td').fontWeight, num: g('.tabla td').fontVariantNumeric },
    tr_borde: `${g('.tabla tbody tr').borderBottomWidth} ${g('.tabla tbody tr').borderBottomStyle}`,
    code: { fam: g('.code').fontFamily.split(',')[0], size: g('.code').fontSize, lh: g('.code').lineHeight, bg: g('.code').backgroundColor, pad: g('.code').padding },
    campo: { pad: g('.field').padding, radio: g('.field').borderRadius, borde: g('.field').borderTopColor },
    input: { size: g('.field input').fontSize, bg: g('.field input').backgroundColor },
    zmax: Math.max(...[...document.querySelectorAll('*')].map(e => parseInt(getComputedStyle(e).zIndex)).filter(n => !isNaN(n))),
    backdrop: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).backdropFilter !== 'none').length,
    tracking_pct: Math.round([...document.querySelectorAll('*')].filter(e => getComputedStyle(e).letterSpacing === '-0.14px').length / document.querySelectorAll('*').length * 100),
  }
}

;(async () => {
  const b = await chromium.launch()
  const salida = {}
  for (const tema of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
    const p = await ctx.newPage()
    await p.goto(`file://${OUT}/replica.html`, { waitUntil: 'networkidle' })
    if (tema === 'light') { await p.evaluate(() => window.tema('light', 0, 52)); await p.waitForTimeout(400) }
    await p.waitForTimeout(400)
    salida[tema] = await p.evaluate(MEDIR)
    await p.screenshot({ path: `${OUT}/screenshots/replica-1280-${tema}.png`, fullPage: true })
    await ctx.close()
  }
  // móvil
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(`file://${OUT}/replica.html`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${OUT}/screenshots/replica-375-dark.png`, fullPage: true })
  salida.movil = { shell: await p.evaluate(() => { const r = document.querySelector('.shell').getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` }), sidebar_pos: await p.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).position) }
  await b.close()
  fs.writeFileSync(`${OUT}/raw/replica-medida.json`, JSON.stringify(salida, null, 2))
  console.log(JSON.stringify(salida.dark, null, 1))
  console.log('\nmovil:', JSON.stringify(salida.movil))
})()
