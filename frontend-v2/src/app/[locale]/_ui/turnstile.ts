/* Cloudflare Turnstile para el voto. Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no hace
   nada y el voto sale sin token, que es lo que el backend acepta mientras no
   tenga TURNSTILE_SECRET. Las dos variables van juntas.

   El widget se monta recién al votar y se saca apenas da el token: con
   `interaction-only` sólo se deja ver si Cloudflare duda, y entonces aparece
   abajo a la derecha. El token es de un solo uso, por eso uno por voto. */

type Turnstile = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
let carga: Promise<Turnstile> | null = null

function cargar(): Promise<Turnstile> {
  carga ??= new Promise((ok, mal) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => (window.turnstile ? ok(window.turnstile) : mal(new Error('turnstile')))
    s.onerror = () => {
      carga = null
      mal(new Error('turnstile'))
    }
    document.head.appendChild(s)
  })
  return carga
}

export async function tokenTurnstile(): Promise<string | undefined> {
  if (!SITE_KEY) return undefined
  const ts = await cargar()
  return new Promise((ok, mal) => {
    const caja = document.createElement('div')
    caja.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:60'
    document.body.appendChild(caja)
    let id = ''
    const fin = () => setTimeout(() => {
      ts.remove(id)
      caja.remove()
    })
    id = ts.render(caja, {
      sitekey: SITE_KEY,
      appearance: 'interaction-only',
      callback: (t: string) => {
        ok(t)
        fin()
      },
      'error-callback': () => {
        mal(new Error('turnstile'))
        fin()
      },
    })
  })
}
