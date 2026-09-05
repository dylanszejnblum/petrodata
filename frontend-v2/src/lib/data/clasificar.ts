/* Los tres clasificadores que traducen el vocabulario del backend al de la UI.
   Viven sueltos —sin importar el cliente de API— para que
   `scripts/check-clasificadores.ts` los pueda correr con
   `node --experimental-strip-types` y sin build. */

import type { WellResource, WellStatus } from '@/fixtures/wells'

/* EL VOCABULARIO DE ESTADO ES EL DE LA SECRETARÍA Y NO DICE «producción».
   Sobre la muestra de mil pozos VM los códigos que llegan son, por volumen:
   Extracción Efectiva (555), En Estudio (100), Parado Transitoriamente (98),
   Abandonado (82), A Abandonar (69), En Espera de Reparación (32), En Reserva
   de Gas (25), y una cola de nueve más.

   La versión anterior buscaba «producción» y «perforación» —ninguno de los dos
   existe en el dato— y mandaba TODO lo demás a 'abandonado': el 91% de la
   muestra quedaba marcado como abandonado y «Ocultar abandonados» vaciaba el
   mapa. Ahora abandonado es el que dice abandono, activo el que está en
   extracción o inyección efectiva, y el resto —parado, en estudio, en espera,
   en reserva— cae en el bucket intermedio, que es lo que son: pozos que hoy no
   producen y que nadie dio de baja. */
export function mapStatus(statusCode: string | null | undefined): WellStatus {
  const s = (statusCode ?? '').toLowerCase()
  if (s.includes('abandon')) return 'abandonado'
  if (s.includes('efectiva') || s.includes('situación activo') || s.includes('situacion activo'))
    return 'activo'
  return 'perforacion'
}

/** `well_type` de la Secretaría → el recurso que se filtra en el panel. */
export function mapWellType(wellType: string | null | undefined): WellResource {
  const s = (wellType ?? '').toLowerCase()
  if (s.startsWith('petrol')) return 'petroleo'
  if (s.startsWith('gas')) return 'gas'
  return 'otro'
}

/* El backend devuelve `operator_name === operator_slug` para diez de las
   ochenta y seis operadoras —tres con producción, phoenix entre ellas—, y así
   la lista del mes mostraba «phoenix_global_resources_sa» como nombre propio.
   Es un hueco del dato, no del render, pero mientras esté el hueco lo que se
   publica es un slug: se lo titula acá, en el único lugar por donde pasan los
   rankings, la ficha de provincia y los pozos del mapa. Si el backend arregla
   el nombre, esta función no toca nada porque sólo actúa cuando el nombre
   TIENE forma de slug. */
const FORMA_LEGAL: Record<string, string> = {
  sa: 'S.A.',
  sau: 'S.A.U.',
  srl: 'S.R.L.',
  sas: 'S.A.S.',
  saic: 'S.A.I.C.',
  ltd: 'Ltd.',
  inc: 'Inc.',
  llc: 'LLC',
  cia: 'Cía.',
  y: 'y',
  de: 'de',
  del: 'del',
}

export function nombreOperadora(slug: string, apiName?: string): string {
  /* `unknown` es la operadora del dato sin atribuir (18 pozos de la muestra VM
     llegan así, con el nombre vacío). Titularlo daría «Unknown», que parece
     una empresa. */
  if (slug === 'unknown') return 'Sin operadora'
  const nombre = apiName?.trim()
  if (nombre && nombre !== slug) return nombre
  return slug
    .split('_')
    .filter(Boolean)
    .map((w) => FORMA_LEGAL[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
