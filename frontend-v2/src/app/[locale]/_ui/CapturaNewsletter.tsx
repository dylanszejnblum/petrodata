'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/api/client'

/* CAPTURA DE NEWSLETTER — POST /api/v1/newsletter, el mismo endpoint que el
   pie de la v1 (FooterNewsletterForm). Va en el pie del índice, debajo del
   bloque de datos: es el lugar del "qué es este sitio", y la suscripción es
   el acto de querer seguirlo.

   Sin modal y sin campo obligatorio en dos pasos: UN campo y un botón. El
   sistema no tiene formulario de suscripción, así que las piezas son las de
   siempre — el campo de .s-buscador (transparente, quien dibuja el estado es
   el contenedor con :focus-within) y .s-boton, que ya existe para el modal de
   reporte. */

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function CapturaNewsletter() {
  const t = useTranslations('v2.indice.newsletter')
  const [correo, setCorreo] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')

  async function suscribir(e: React.FormEvent) {
    e.preventDefault()
    if (!CORREO_OK.test(correo.trim()) || estado === 'enviando') return
    setEstado('enviando')
    try {
      const { response } = await api.POST('/api/v1/newsletter', {
        /* El enum del spec sólo tiene los tres sources de la v1; el pie de
           ésta usa el mismo 'footer'. */
        body: { email: correo.trim(), source: 'footer' },
      })
      if (response.ok) {
        setEstado('ok')
        setCorreo('')
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  return (
    <form onSubmit={suscribir} className="mt-6 shrink-0">
      <p className="s-etq m-0">{t('titulo')}</p>
      <p className="s-desc m-0 mt-0.5">{t('bajada')}</p>
      <label className="s-buscador mt-2">
        <input
          type="email"
          value={correo}
          onChange={(e) => {
            setCorreo(e.target.value)
            if (estado !== 'idle') setEstado('idle')
          }}
          placeholder={t('placeholder')}
          aria-label={t('titulo')}
          disabled={estado === 'enviando'}
          autoComplete="email"
        />
        <button
          type="submit"
          className="s-boton shrink-0"
          disabled={estado === 'enviando' || !CORREO_OK.test(correo.trim())}
          style={{ height: 24, padding: '0 10px', fontSize: 11 }}
        >
          {estado === 'enviando' ? t('enviando') : t('accion')}
        </button>
      </label>
      {/* El resultado se dice abajo del campo y no en un toast: el sistema no
          tiene toasts, y un mensaje que desaparece solo no le sirve a quien
          quiere saber si quedó anotado. */}
      {estado === 'ok' && (
        <p className="s-micro m-0 mt-1.5" style={{ color: 'var(--green)' }}>
          {t('ok')}
        </p>
      )}
      {estado === 'error' && (
        <p className="s-micro m-0 mt-1.5" style={{ color: 'var(--red)' }}>
          {t('error')}
        </p>
      )}
    </form>
  )
}
