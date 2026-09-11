/* Conversión de color y métricas de contraste.
   OKLCH: sRGB → linear → LMS → OKLab → OKLCH (Björn Ottosson).
   WCAG 2.1: luminancia relativa, (L1+.05)/(L2+.05).
   APCA: W3 0.1.9 / 0.98G-4g, las constantes son las publicadas. */

const hexRGB = (h) => {
  h = h.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 8) {
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: parseInt(h.slice(6, 8), 16) / 255 }
  }
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }
}

const aHex = ({ r, g, b }) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')

/** sRGB 0-255 → canal lineal */
const lin = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function oklch({ r, g, b }) {
  const R = lin(r), G = lin(g), B = lin(b)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + Bb * Bb)
  let H = (Math.atan2(Bb, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { L, C, H }
}

const oklchTxt = (c) => {
  const o = oklch(c)
  return `oklch(${(o.L * 100).toFixed(1)}% ${o.C.toFixed(4)} ${o.H.toFixed(1)})`
}

/** luminancia relativa WCAG */
const lumWCAG = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

function wcag(fg, bg) {
  const a = lumWCAG(fg), b = lumWCAG(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/* ---- APCA W3 0.1.9 (0.98G-4g) ---- */
const A = {
  trc: 2.4, Rco: 0.2126729, Gco: 0.7151522, Bco: 0.0721750,
  normBG: 0.56, normTXT: 0.57, revTXT: 0.62, revBG: 0.65,
  blkThrs: 0.022, blkClmp: 1.414, scaleBoW: 1.14, scaleWoB: 1.14,
  loBoWoffset: 0.027, loWoBoffset: 0.027, deltaYmin: 0.0005, loClip: 0.1,
}

const Yapca = ({ r, g, b }) =>
  A.Rco * Math.pow(r / 255, A.trc) + A.Gco * Math.pow(g / 255, A.trc) + A.Bco * Math.pow(b / 255, A.trc)

function apca(fgC, bgC) {
  let Ytxt = Yapca(fgC), Ybg = Yapca(bgC)
  Ytxt = Ytxt > A.blkThrs ? Ytxt : Ytxt + Math.pow(A.blkThrs - Ytxt, A.blkClmp)
  Ybg = Ybg > A.blkThrs ? Ybg : Ybg + Math.pow(A.blkThrs - Ybg, A.blkClmp)
  if (Math.abs(Ybg - Ytxt) < A.deltaYmin) return 0
  let S, C
  if (Ybg > Ytxt) {
    S = (Math.pow(Ybg, A.normBG) - Math.pow(Ytxt, A.normTXT)) * A.scaleBoW
    C = S < A.loClip ? 0 : S - A.loBoWoffset
  } else {
    S = (Math.pow(Ybg, A.revBG) - Math.pow(Ytxt, A.revTXT)) * A.scaleWoB
    C = S > -A.loClip ? 0 : S + A.loWoBoffset
  }
  return C * 100
}

/** nivel WCAG 2.1 según tamaño/peso */
function nivelWCAG(ratio, px, weight) {
  const grande = px >= 24 || (px >= 18.66 && Number(weight) >= 700)
  const aa = grande ? 3 : 4.5
  const aaa = grande ? 4.5 : 7
  return { grande, aa: ratio >= aa, aaa: ratio >= aaa, umbralAA: aa, umbralAAA: aaa }
}

/** Lc mínimo recomendado por APCA según tamaño/peso (tabla de fuentes, lectura conservadora) */
function apcaMinimo(px, weight) {
  const w = Number(weight) || 400
  if (px >= 36) return 45
  if (px >= 24) return w >= 600 ? 45 : 60
  if (px >= 18) return w >= 600 ? 60 : 75
  if (px >= 16) return w >= 600 ? 68 : 75
  if (px >= 14) return w >= 600 ? 75 : 90
  return 90
}

module.exports = { hexRGB, aHex, oklch, oklchTxt, wcag, apca, nivelWCAG, apcaMinimo, lumWCAG }
