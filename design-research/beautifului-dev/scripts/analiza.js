/* Analiza los datos crudos y produce analisis.json + tokens.json + theme.css.
   Todo lo que sale de acá está MEDIDO; lo inferido se marca aparte. */
const fs = require('fs')
const { hexRGB, aHex, oklchTxt, wcag, apca, nivelWCAG, apcaMinimo } = require('./color')

const OUT = '/Users/macbookpro-1/Documents/VM-Repo/petrodata/design-research/beautifului-dev'
const R = (f) => JSON.parse(fs.readFileSync(`${OUT}/raw/${f}`, 'utf8'))

const bloques = R('css-var-blocks.json')
const censo = R('censo.json')
const pares = R('pares-contraste.json')
const estados = R('estados.json')
const comp = R('componentes.json')
const barrido = R('barrido-ancho.json')

const blk = (sel) => Object.fromEntries(
  bloques.find((b) => b.sel === sel).props.map((p) => {
    const i = p.indexOf(':')
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()]
  }),
)
const light = blk(':root')
const dark = blk('.dark')
const tw = blk(':host,:root')

/* ── ROLES ────────────────────────────────────────────────────────── */
const ROL = {
  page: 'Fondo de la página (el nivel más bajo)',
  canvas: 'Fondo de zonas hundidas / segundo plano',
  surface: 'Superficie de card — el plano que sostiene contenido',
  inset: 'Superficie hundida dentro de una card',
  hover: 'Realce de fila/ítem al pasar el mouse',
  'hover-2': 'Realce más fuerte (presionado / activo)',
  ink: 'Texto primario',
  'ink-2': 'Texto secundario',
  'ink-3': 'Texto terciario / metadata',
  line: 'Borde por defecto',
  'line-strong': 'Borde de énfasis',
  field: 'Fondo de campo de formulario',
  stripe: 'Trama diagonal del fondo (color de la veta)',
  'stripe-bg': 'Fondo sobre el que se dibuja la trama',
  accent: 'Color de marca / acción primaria',
  'accent-ink': 'Variante del acento para texto o enlace',
  'accent-tint': 'Fondo teñido de acento',
  green: 'Estado positivo',
  'green-tint': 'Fondo teñido positivo',
  orange: 'Estado de atención',
  'orange-tint': 'Fondo teñido de atención',
  red: 'Estado negativo / destructivo',
  'red-tint': 'Fondo teñido negativo',
  'tooltip-bg': 'Fondo del tooltip',
  'tooltip-fg': 'Texto del tooltip',
  'tooltip-muted': 'Texto secundario del tooltip',
  'tooltip-border': 'Borde del tooltip',
}

/* ── FRECUENCIA DE USO ────────────────────────────────────────────── */
const rgbTxt = ({ r, g, b, a }) => (a < 1 ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})` : `rgb(${r}, ${g}, ${b})`)

function frecuenciaColor(tema, hex) {
  const c = hexRGB(hex)
  const t = censo[`1280-${tema}`].tally
  const buscado = rgbTxt(c)
  let n = 0
  for (const prop of ['color', 'background-color', 'border-color']) {
    const tabla = t[prop] || {}
    for (const [v, k] of Object.entries(tabla)) {
      if (v === buscado || v.split(' ').every((x) => x === buscado)) n += k
    }
  }
  return n
}

/* ── COLOR ────────────────────────────────────────────────────────── */
const colores = Object.keys(light)
  .filter((k) => !k.startsWith('--shadow'))
  .map((k) => {
    const nombre = k.replace('--', '')
    const vl = light[k], vd = dark[k]
    const cl = hexRGB(vl), cd = hexRGB(vd)
    return {
      token: nombre,
      rol: ROL[nombre] || '(sin rol asignado)',
      claro: { hex: vl, rgb: rgbTxt(cl), oklch: oklchTxt(cl), alpha: cl.a, usos: frecuenciaColor('light', vl) },
      oscuro: { hex: vd, rgb: rgbTxt(cd), oklch: oklchTxt(cd), alpha: cd.a, usos: frecuenciaColor('dark', vd) },
    }
  })

/* ── CONTRASTES ───────────────────────────────────────────────────── */
function tablaContraste(tema) {
  return pares[tema].map((p) => {
    const fg = hexRGB(p.fg), bg = hexRGB(p.bg)
    const px = parseFloat(p.size)
    const ratio = wcag(fg, bg)
    const lc = apca(fg, bg)
    const niv = nivelWCAG(ratio, px, p.weight)
    const min = apcaMinimo(px, p.weight)
    return {
      fg: p.fg, bg: p.bg, px, weight: p.weight, usos: p.n,
      wcag: +ratio.toFixed(2), aa: niv.aa, aaa: niv.aaa, umbralAA: niv.umbralAA,
      apca: +lc.toFixed(1), apcaMin: min, apcaPasa: Math.abs(lc) >= min,
      ejemplo: p.ejemplos[0],
    }
  }).sort((a, b) => b.usos - a.usos)
}
const contraste = { light: tablaContraste('light'), dark: tablaContraste('dark') }

/* ── TIPOGRAFÍA ───────────────────────────────────────────────────── */
const orden = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1])
const t1280 = censo['1280-dark'].tally

const tipografia = {
  familias: orden(t1280['font-family']).map(([v, n]) => ({ valor: v, usos: n })),
  tamanos: orden(t1280['font-size']).map(([v, n]) => ({ valor: v, px: parseFloat(v), usos: n })),
  pesos: orden(t1280['font-weight']).map(([v, n]) => ({ valor: v, usos: n })),
  interlineado: orden(t1280['line-height']).map(([v, n]) => ({ valor: v, usos: n })),
  tracking: orden(t1280['letter-spacing']).map(([v, n]) => ({ valor: v, usos: n })),
  transform: orden(t1280['text-transform']).map(([v, n]) => ({ valor: v, usos: n })),
  numeric: orden(t1280['font-variant-numeric']).map(([v, n]) => ({ valor: v, usos: n })),
  wrap: orden(t1280['text-wrap']).map(([v, n]) => ({ valor: v, usos: n })),
  // ¿cambian los tamaños entre viewports? (⇒ escala fluida o no)
  porViewport: Object.fromEntries(['375', '768', '1280', '1920'].map((w) => [
    w, orden(censo[`${w}-dark`].tally['font-size']).slice(0, 12).map(([v, n]) => `${v}×${n}`),
  ])),
  measure: censo['1280-dark'].cuerpoTexto,
  measurePorViewport: Object.fromEntries(['375', '768', '1280', '1920'].map((w) => [w, censo[`${w}-dark`].cuerpoTexto.slice(0, 4)])),
}

/* ── ESPACIADO ────────────────────────────────────────────────────── */
const numeros = (entradas) => {
  const acc = {}
  entradas.forEach(([v, n]) => {
    v.split(' ').forEach((x) => {
      const px = parseFloat(x)
      if (!isNaN(px) && px > 0 && x.endsWith('px')) acc[px] = (acc[px] || 0) + n
    })
  })
  return Object.entries(acc).map(([px, n]) => ({ px: +px, usos: n })).sort((a, b) => a.px - b.px)
}
const espaciado = {
  padding: numeros(orden(t1280['padding'])),
  gap: numeros([...orden(t1280['gap']), ...orden(t1280['row-gap']), ...orden(t1280['column-gap'])]),
  marginTop: numeros(orden(t1280['margin-top'])),
  marginBottom: numeros(orden(t1280['margin-bottom'])),
  gapsEntreSecciones: censo['1280-dark'].gaps,
  gapsPorViewport: Object.fromEntries(['375', '768', '1280', '1920'].map((w) => [w, censo[`${w}-dark`].gaps])),
  unidadTailwind: tw['--spacing'],
}

/* ── FORMA Y PROFUNDIDAD ──────────────────────────────────────────── */
const forma = {
  radios: numeros(orden(t1280['border-radius'])),
  radiosCrudos: orden(t1280['border-radius']).map(([v, n]) => ({ valor: v, usos: n })),
  radiosToken: Object.fromEntries(Object.entries(tw).filter(([k]) => k.startsWith('--radius'))),
  bordes: orden(t1280['border-top-width']).map(([v, n]) => ({ valor: v, usos: n })),
  sombras: orden(t1280['box-shadow']).map(([v, n]) => ({ valor: v, usos: n })),
  sombrasToken: { claro: Object.fromEntries(Object.entries(light).filter(([k]) => k.startsWith('--shadow'))), oscuro: Object.fromEntries(Object.entries(dark).filter(([k]) => k.startsWith('--shadow'))) },
  blur: orden(t1280['backdrop-filter']).map(([v, n]) => ({ valor: v, usos: n })),
  gradientes: comp.dark.gradientes,
  opacidades: orden(t1280['opacity']).map(([v, n]) => ({ valor: v, usos: n })),
}

/* ── MOVIMIENTO ───────────────────────────────────────────────────── */
const movimiento = {
  duraciones: orden(t1280['transition-duration']).map(([v, n]) => ({ valor: v, usos: n })),
  easings: orden(t1280['transition-timing-function']).map(([v, n]) => ({ valor: v, usos: n })),
  transiciones: orden(t1280['transition']).slice(0, 25).map(([v, n]) => ({ valor: v, usos: n })),
  easingsToken: Object.fromEntries(Object.entries(tw).filter(([k]) => k.includes('ease') || k.includes('transition'))),
  ...estados.movimiento,
}

/* ── LAYOUT ───────────────────────────────────────────────────────── */
const layout = {
  breakpointsEnCSS: ['40rem/640px', '48rem/768px', '64rem/1024px', '80rem/1280px', '96rem/1536px', 'max-width:640px'],
  breakpointsQueRealmenteCambianAlgo: barrido.map((b) => ({ ancho: b.ancho, cambios: b.difs })),
  maxWidth: orden(t1280['max-width']).map(([v, n]) => ({ valor: v, usos: n })),
  grid: orden(t1280['grid-template-columns']).map(([v, n]) => ({ valor: v, usos: n })),
  display: orden(t1280['display']).map(([v, n]) => ({ valor: v, usos: n })),
  zstack: comp.dark.zstack,
  sticky: estados.sticky,
  scroll: estados.scroll,
  anchoMainPorViewport: Object.fromEntries(['375', '768', '1280', '1920'].map((w) => [w, censo[`${w}-dark`].main])),
  contenedoresTailwind: Object.fromEntries(Object.entries(tw).filter(([k]) => k.startsWith('--container'))),
}

/* ── ICONOS E IMÁGENES ────────────────────────────────────────────── */
const contar = (arr, f) => {
  const c = {}
  arr.forEach((x) => { const k = f(x); c[k] = (c[k] || 0) + 1 })
  return Object.entries(c).sort((a, b) => b[1] - a[1])
}
const iconografia = {
  total: comp.dark.iconos.length,
  viewBox: contar(comp.dark.iconos, (i) => i.viewBox || '(sin viewBox)'),
  cajas: contar(comp.dark.iconos, (i) => i.caja),
  strokeWidth: contar(comp.dark.iconos, (i) => String(i.strokeWidth)),
  linecap: contar(comp.dark.iconos, (i) => String(i.linecap)),
  linejoin: contar(comp.dark.iconos, (i) => String(i.linejoin)),
  fill: contar(comp.dark.iconos, (i) => String(i.fill)),
  muestraD: [...new Set(comp.dark.iconos.map((i) => i.d0).filter(Boolean))].slice(0, 12),
  imagenes: comp.dark.imagenes,
}

/* ── SALIDA ───────────────────────────────────────────────────────── */
const analisis = { colores, contraste, tipografia, espaciado, forma, movimiento, layout, iconografia,
  mono: comp.dark.mono, controles: estados.controles, tailwindTheme: tw,
  bodyBg: { claro: censo['1280-light'].bodyBg, oscuro: censo['1280-dark'].bodyBg },
  fuentesCargadas: censo['1280-dark'].fonts }

fs.writeFileSync(`${OUT}/raw/analisis.json`, JSON.stringify(analisis, null, 2))

/* tokens.json en formato W3C-ish */
const grupoColor = {}
colores.forEach((c) => {
  grupoColor[c.token] = {
    $type: 'color',
    $value: c.claro.hex,
    $extensions: {
      'dev.beautifului.theme': { light: c.claro.hex, dark: c.oscuro.hex },
      'dev.beautifului.oklch': { light: c.claro.oklch, dark: c.oscuro.oklch },
      'dev.beautifului.usos': { light: c.claro.usos, dark: c.oscuro.usos },
    },
    $description: c.rol,
  }
})
const tokens = {
  $schema: 'https://tr.designtokens.org/format/',
  $description: 'Tokens extraídos por medición directa de https://www.beautifului.dev/ (auditoría 2026-08-14).',
  color: grupoColor,
  font: {
    sans: { $type: 'fontFamily', $value: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    mono: { $type: 'fontFamily', $value: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'monospace'] },
  },
  fontSize: Object.fromEntries(tipografia.tamanos.filter((t) => t.usos >= 3).map((t) => [
    `s${String(t.px).replace('.', '_')}`, { $type: 'dimension', $value: t.valor, $extensions: { usos: t.usos } },
  ])),
  fontWeight: Object.fromEntries(tipografia.pesos.map((p) => [`w${p.valor}`, { $type: 'fontWeight', $value: Number(p.valor), $extensions: { usos: p.usos } }])),
  radius: Object.fromEntries(Object.entries(forma.radiosToken).map(([k, v]) => [k.replace('--radius-', ''), { $type: 'dimension', $value: v }])),
  shadow: Object.fromEntries(Object.keys(forma.sombrasToken.claro).map((k) => [
    k.replace('--shadow-', ''),
    { $type: 'shadow', $value: forma.sombrasToken.claro[k], $extensions: { 'dev.beautifului.theme': { light: forma.sombrasToken.claro[k], dark: forma.sombrasToken.oscuro[k] } } },
  ])),
  spacing: Object.fromEntries(espaciado.padding.filter((p) => p.usos >= 4).map((p) => [`s${p.px}`, { $type: 'dimension', $value: `${p.px}px`, $extensions: { usos: p.usos } }])),
  easing: Object.fromEntries(Object.entries(tw).filter(([k]) => k.startsWith('--ease')).map(([k, v]) => [k.replace('--ease-', ''), { $type: 'cubicBezier', $value: v }])),
}
fs.writeFileSync(`${OUT}/tokens.json`, JSON.stringify(tokens, null, 2))

console.log('colores:', colores.length)
console.log('pares de contraste claro/oscuro:', contraste.light.length, '/', contraste.dark.length)
console.log('tamaños de fuente distintos:', tipografia.tamanos.length)
console.log('radios distintos:', forma.radiosCrudos.length)
console.log('sombras distintas:', forma.sombras.length)
console.log('OK → raw/analisis.json + tokens.json')
