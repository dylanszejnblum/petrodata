import { ImageResponse } from 'next/og'
import { loadDirectivos } from '@/lib/data/directivos'

/* La imagen del enlace compartido: puesto, nombre, cargo y puntos del día.
   SIN LA FOTO, a propósito: las caras de /directivos están generadas con IA y
   una imagen que circula fuera del sitio no puede llevar una cara inventada de
   una persona real. Va el monograma, como en la lista cuando no hay foto. */

export const alt = 'vacamuerta.io · Directivos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 300

const TINTA = '#f2f1ec'
const TINTA2 = '#a9a79f'
const FONDO = '#141413'
const ACENTO = '#d97757'

export default async function Imagen({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const en = locale === 'en'
  const { filas } = await loadDirectivos()
  const i = filas.findIndex((f) => f.slug === slug)
  const p = filas[i]
  const iniciales = p
    ? p.nombre.split(' ').filter(Boolean).map((x) => x[0]).filter((_, j, a) => j === 0 || j === a.length - 1).join('').toUpperCase()
    : ''

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: FONDO, color: TINTA }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: TINTA2 }}>
          <div style={{ width: 14, height: 14, background: ACENTO, transform: 'rotate(45deg)' }} />
          {`vacamuerta.io · ${en ? 'Executives' : 'Directivos'}`}
        </div>
        {p ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <div style={{ width: 180, height: 180, borderRadius: 24, background: '#262624', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: TINTA2 }}>
              {iniciales}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ fontSize: 30, color: ACENTO }}>
                {`#${String(i + 1).padStart(2, '0')} ${en ? 'of' : 'de'} ${filas.length}`}
              </div>
              <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>{p.nombre}</div>
              <div style={{ fontSize: 28, color: TINTA2 }}>
                {`${(p.cargo || '—').slice(0, 70)} · ${p.empresa}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 64, fontWeight: 700 }}>{en ? 'The ranking' : 'El ranking'}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: TINTA2 }}>
          <span>{`${en ? 'Points' : 'Puntos'}: ${p ? p.indice.toFixed(1) : '—'} / 100`}</span>
          <span>{en ? 'Vote on vacamuerta.io' : 'Votá en vacamuerta.io'}</span>
        </div>
      </div>
    ),
    size,
  )
}
