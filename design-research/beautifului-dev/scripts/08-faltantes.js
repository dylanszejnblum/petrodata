const fs = require('fs')
const { abrir } = require('./lib')
const OUT = '/Users/macbookpro-1/Documents/VM-Repo/petrodata/design-research/beautifului-dev'
;(async () => {
  const { browser, page } = await abrir({ width: 1280, height: 900, theme: 'dark' })
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight
    for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)) }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(900)
  const r = await page.evaluate(() => {
    const K = ['padding','border-radius','background-color','border-top-width','border-bottom-width','border-top-color','border-top-style','box-shadow','font-size','font-weight','color','gap','line-height','height','width','min-height','text-transform','letter-spacing','font-family','position','top','white-space','overflow']
    const est = (el) => { if (!el) return null; const cs = getComputedStyle(el); const o = {}
      K.forEach(p => { const v = cs.getPropertyValue(p); if (v && v!=='none' && v!=='normal' && v!=='0px' && v!=='auto' && v!=='rgba(0, 0, 0, 0)') o[p]=v })
      const b = el.getBoundingClientRect(); o['@caja']=`${Math.round(b.width)}×${Math.round(b.height)}`
      o['@clase']=(typeof el.className==='string'?el.className:'').slice(0,200); o['@tag']=el.tagName.toLowerCase(); return o }
    const q = (s) => est(document.querySelector(s))
    const qq = (s, n=3) => [...document.querySelectorAll(s)].slice(0,n).map(est)
    return {
      table: q('table'), thead: q('thead'), th: q('th'), td: q('td'), tr: q('tbody tr'),
      input: q('input'), textarea: q('textarea'), contenteditable: q('[contenteditable]'),
      chips: qq('[class*="rounded-full"]', 6),
      tooltip: q('[class*="tooltip"], [role="tooltip"]'),
      code: q('pre'), codeSpan: q('pre span'),
      navItem: qq('aside a', 3),
      navActivo: q('aside a[aria-current], aside a[class*="bg-"]'),
      botonPill: q('a[class*="rounded-full"][class*="px-"]'),
      logo: q('aside svg'),
      toggleTema: q('button[class*="rounded-full"]'),
      // radios personalizados que aparecen en el CSS
      radiosUsados: [...new Set([...document.querySelectorAll('*')].map(e=>getComputedStyle(e).borderRadius).filter(v=>v&&v!=='0px'))].slice(0,25),
    }
  })
  await browser.close()
  fs.writeFileSync(`${OUT}/raw/faltantes.json`, JSON.stringify(r, null, 2))
  const p = (n,o)=>{ if(!o){console.log(`\n--- ${n}: no existe en la página`); return}
    console.log(`\n--- ${n} <${o['@tag']}> ${o['@caja']}\n    ${o['@clase']}`)
    console.log('    '+Object.entries(o).filter(([k])=>!k.startsWith('@')).map(([k,v])=>`${k}=${v}`).join('  ')) }
  for (const [k,v] of Object.entries(r)) { if (Array.isArray(v)) v.forEach((x,i)=>p(`${k}[${i}]`,x)); else if (k!=='radiosUsados') p(k,v) }
  console.log('\nradios usados:', r.radiosUsados.join(', '))
})()
