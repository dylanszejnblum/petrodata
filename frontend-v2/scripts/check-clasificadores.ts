/* Chequeo de los clasificadores contra el dato REAL, que es donde fallaron.
   Los tres bugs que esto atrapa ya pasaron: `mapStatus` mandaba el 91% de la
   muestra a 'abandonado' porque buscaba palabras que el vocabulario de la
   Secretaría no usa; el filtro de recurso comparaba dos campos que el GeoJSON
   deja en cero; y el ranking del mes publicaba «phoenix_global_resources_sa»
   como nombre propio. Ninguno rompía el build ni el tipado: sólo se veían
   mirando la pantalla, o corriendo esto.

   Uso:  node --experimental-strip-types scripts/check-clasificadores.ts
   Env:  API=https://api.petrodata.dylansz.com (default: el de .env.local) */

import assert from 'node:assert/strict'
import { mapStatus, mapWellType, nombreOperadora } from '../src/lib/data/clasificar.ts'

/* ── 1. Las tablas de verdad, sin red ─────────────────────────────────── */
assert.equal(mapStatus('Extracción Efectiva'), 'activo')
assert.equal(mapStatus('En Inyección Efectiva'), 'activo')
assert.equal(mapStatus('Otras Situación Activo'), 'activo')
assert.equal(mapStatus('Abandonado'), 'abandonado')
assert.equal(mapStatus('A Abandonar'), 'abandonado')
assert.equal(mapStatus('Abandono Temporario'), 'abandonado')
assert.equal(mapStatus('Parado Transitoriamente'), 'perforacion')
assert.equal(mapStatus('En Estudio'), 'perforacion')
assert.equal(mapStatus(null), 'perforacion')

assert.equal(mapWellType('Petrolífero'), 'petroleo')
assert.equal(mapWellType('Gasífero'), 'gas')
assert.equal(mapWellType('Otro tipo'), 'otro')
assert.equal(mapWellType('Sumidero'), 'otro')

assert.equal(nombreOperadora('ypf', 'YPF S.A.'), 'YPF S.A.')
assert.equal(
  nombreOperadora('phoenix_global_resources_sa', 'phoenix_global_resources_sa'),
  'Phoenix Global Resources S.A.',
)
assert.equal(nombreOperadora('grecoil_y_cia_srl'), 'Grecoil y Cía. S.R.L.')
assert.equal(nombreOperadora('unknown', ''), 'Sin operadora')

/* ── 2. Contra la API, que es de donde salen los códigos ──────────────── */
const API = process.env.API ?? 'https://api.petrodata.dylansz.com'
const url = `${API}/api/v1/geo/wells?formation=vaca_muerta&limit=1000`
const res = await fetch(url)
assert.ok(res.ok, `${url} → ${res.status}`)
const fc = (await res.json()) as {
  features: { properties: { status_code: string; well_type: string } }[]
}
const pozos = fc.features
assert.ok(pozos.length > 100, `muestra chica: ${pozos.length} pozos`)

const cuenta = <T extends string>(f: (p: (typeof pozos)[number]['properties']) => T) => {
  const m: Record<string, number> = {}
  for (const p of pozos) m[f(p.properties)] = (m[f(p.properties)] ?? 0) + 1
  return m
}
const estados = cuenta((p) => mapStatus(p.status_code))
const recursos = cuenta((p) => mapWellType(p.well_type))
console.log('estados ', estados)
console.log('recursos', recursos)

/* Los umbrales son groseros a propósito: no fijan la mezcla exacta de la
   muestra —que cambia con cada ingesta—, sino que ninguna categoría se coma
   la población, que es exactamente la forma que tenía cada uno de los bugs. */
assert.ok(
  estados.abandonado / pozos.length < 0.3,
  `demasiados abandonados (${estados.abandonado}/${pozos.length}): revisá el vocabulario de status_code`,
)
assert.ok(estados.activo / pozos.length > 0.3, `pocos activos: ${estados.activo}/${pozos.length}`)
assert.ok(recursos.petroleo > 0 && recursos.gas > 0, 'el filtro de recurso dejaría el mapa vacío')

/* Ningún nombre publicable puede seguir teniendo forma de slug. */
const ops = (await (await fetch(`${API}/api/v1/operators?sort=boe`)).json()) as {
  data: { operator_slug: string; operator_name: string }[]
}
const feos = ops.data
  .map((o) => nombreOperadora(o.operator_slug, o.operator_name))
  .filter((n) => n.includes('_'))
assert.deepEqual(feos, [], `nombres sin titular: ${feos.join(', ')}`)

console.log(`ok — ${pozos.length} pozos, ${ops.data.length} operadoras`)
