'use client'

/* "Valor de un día de Vaca Muerta" — card única Estrato, rediseño sin foto
   (iteración de Mariano, 2026-08-07).
   Composición: rótulo con rombo + hairline (la firma de las cards de
   noticias) → ancla | escenario (el escenario como PANEL INTERNO elevado:
   superficie sobre superficie, la zona interactiva se distingue sola) →
   fila de stats de la formación al pie (sin divisoria, solo aire).
   La lógica del slider es la misma del DayValueCard original. */

import Image from 'next/image'
import { useEffect, useId, useState } from 'react'
type DayValueInputs = {
  /** Barriles producidos en la ventana de contribución. */
  oilBbl: number
  /** Valor bruto publicado para esa ventana (petróleo + gas), en USD. */
  grossValueUsd: number
  /** Brent promedio que reporta el endpoint para la ventana. */
  brentAvgUsd: number
  /** Descuento por calidad sobre Brent, en USD/bbl. */
  oilDiscountUsd: number
  /** Meses de la ventana, para anualizar honestamente. */
  months: number
  gdpUsd: number | null
  gdpYear: number | null
  /** Brent vivo (default del slider). */
  brentSpotUsd: number | null
  breakevenUsd: number
}

const MIN = 30
const MAX = 130

/* Pool de fotos reales de la cuenca: la foto queda FIJA durante la
   lectura y cambia en cada visita (pedido de Mariano, 2026-08-10) —
   se recuerda la última vista para no repetirla. */
const PHOTOS = [
  '/images/vm-rig.jpg',
  '/images/news/news-produccion-rig.jpg',
  '/images/news/news-regulacion-pumpjacks.jpg',
  '/images/news/news-infraestructura-oleoducto.jpg',
  '/images/news/news-gnl-buque.jpg',
  '/images/news/news-empresas-refineria.jpg',
]
const PHOTO_KEY = 'vm-day-photo'

const nf = (v: number, decimals: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)

export function DayValueCardEstrato({
  inputs,
  oilSharePct,
  gasSharePct,
  wells,
}: {
  inputs: DayValueInputs
  oilSharePct: number | null
  gasSharePct: number | null
  wells: number | null
}) {
  const {
    oilBbl,
    grossValueUsd,
    brentAvgUsd,
    oilDiscountUsd,
    months,
    gdpUsd,
    gdpYear,
    brentSpotUsd,
    breakevenUsd,
  } = inputs

  const spot = brentSpotUsd != null ? Math.min(MAX, Math.max(MIN, brentSpotUsd)) : null
  const [price, setPrice] = useState(spot ?? Math.min(MAX, Math.max(MIN, brentAvgUsd)))
  const sliderId = useId()

  /* Foto: estática, al azar en cada visita (elegida post-mount para no
     romper la hidratación); se evita repetir la de la visita anterior. */
  const [photoIdx, setPhotoIdx] = useState<number | null>(null)
  useEffect(() => {
    let prev: number | null = null
    try {
      const raw = localStorage.getItem(PHOTO_KEY)
      prev = raw == null ? null : Number(raw)
      if (!Number.isFinite(prev)) prev = null
    } catch {
      /* localStorage bloqueado → random puro */
    }
    let idx = Math.floor(Math.random() * PHOTOS.length)
    if (prev != null && PHOTOS.length > 1 && idx === prev) idx = (idx + 1) % PHOTOS.length
    try {
      localStorage.setItem(PHOTO_KEY, String(idx))
    } catch {
      /* sin persistencia no hay anti-repetición, nada que hacer */
    }
    setPhotoIdx(idx)
  }, [])

  // Base publicada, anualizada con la ventana real
  const annualUsd = grossValueUsd * (12 / (months || 12))

  /* La recaudación se actualiza SOLA con el precio (pedido de Mariano):
     al valor publicado se le re-precia únicamente la pata del petróleo
     contra el promedio de la ventana (el gas no se puede repreciar
     client-side). Con el slider en el promedio, da exacto el publicado;
     con el slider en el Brent de hoy (default), da el valor a precio de hoy. */
  const adjustedAnnualUsd = annualUsd + oilBbl * (price - brentAvgUsd) * (12 / (months || 12))
  const perDay = adjustedAnnualUsd / 365 / 1_000_000
  const perYear = adjustedAnnualUsd / 1_000_000_000
  const gdpPct = gdpUsd ? (adjustedAnnualUsd / gdpUsd) * 100 : null

  // Escenario — sólo el petróleo, al precio elegido
  const scenarioAnnualUsd = oilBbl * (price - oilDiscountUsd) * (12 / (months || 12))
  const scenarioPerYear = scenarioAnnualUsd / 1_000_000_000
  const scenarioPerDay = scenarioAnnualUsd / 365 / 1_000_000
  const margin = price - breakevenUsd
  const isToday = spot != null && Math.abs(price - spot) < 0.5

  return (
    <div className="relative overflow-hidden rounded-[10px] border-4 border-black bg-inverse p-5 md:p-6">
      {/* Foto de la visita a la derecha: cuenca en B&N oscurecido, fundida
          en diagonal con el negro (patrón del footer). Una sola imagen —
          la elegida para esta visita — nada rota mientras se lee. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[70%] [mask-image:linear-gradient(100deg,transparent_12%,black_55%)] sm:w-[50%]"
      >
        {photoIdx != null && (
          <Image
            src={PHOTOS[photoIdx]}
            alt=""
            fill
            sizes="(min-width: 1024px) 40rem, 70vw"
            className="object-cover grayscale brightness-[.68]"
          />
        )}
      </div>

      {/* Rótulo: rombo oil + label + hairline (firma de las cards de noticias) */}
      <div className="relative flex items-center gap-2.5">
        <span aria-hidden className="size-2 rotate-45" style={{ background: 'var(--data-oil)' }} />
        <span className="type-label-md whitespace-nowrap font-semibold !tracking-[0.14em] !text-white">
          Valor de un día de Vaca Muerta
        </span>
        <span aria-hidden className="h-px flex-1 bg-white/10" />
      </div>

      {/* Cuerpo en una sola columna: ancla → slider directo bajo el subcopy
          (simplificación de Mariano, 2026-08-07) */}
      <div className="relative mt-5 max-w-[36rem]">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="type-kpi text-[2.4rem] !text-white sm:text-[2.8rem]">
            US$ {nf(perDay, 1)} M
          </span>
          <span className="text-sm text-on-dark-3">por día</span>
        </div>
        <p className="tnums mt-3 text-sm text-on-dark-2">
          ≈ US$ {nf(perYear, 1)}B <span className="text-on-dark-3">al año</span>
          {gdpPct != null && (
            <>
              {' · '}
              <span className="text-on-dark">≈ {nf(gdpPct, 1)}%</span>{' '}
              <span className="text-on-dark-3">del PBI{gdpYear ? ` ${gdpYear}` : ''}</span>
            </>
          )}
          {' · '}
          <span className="text-on-dark-3">Brent</span>{' '}
          <span className="font-semibold" style={{ color: 'var(--data-oil)' }}>
            US$ {nf(price, 1)}
          </span>
          {isToday && (
            <span className="type-label ml-1 !text-[9px] !text-on-dark-3">
              hoy
            </span>
          )}
        </p>

        {/* Escenario, directo bajo el subcopy (el precio vive en el subcopy) */}
        <div className="mt-5 flex items-baseline justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <label htmlFor={sliderId} className="type-label !text-on-dark-3">
              Escenario: precio del Brent
            </label>
            {/* Metodología como tooltip: hover + foco */}
            <span className="group relative inline-flex">
              <button
                type="button"
                aria-label="Metodología del escenario"
                className="grid size-4 place-items-center rounded-full border border-white/25 text-[9px] leading-none text-on-dark-3 transition-colors duration-150 hover:border-white/50 hover:text-on-dark"
              >
                i
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-[8px] border border-white/15 bg-[#04060a] p-3 text-[10px] font-normal normal-case leading-relaxed tracking-normal text-on-dark-2 opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                Valor bruto de producción de los últimos {months} meses (petróleo a Brent menos
                US$ {nf(oilDiscountUsd, 0)}/bbl por calidad + gas a PIST), re-preciando la pata del
                petróleo al Brent elegido — promedio del período: US$ {nf(brentAvgUsd, 1)}. No
                descuenta costos ni impuestos. Breakeven de referencia: US$ {nf(breakevenUsd, 0)}
                /bbl (YPF).
              </span>
            </span>
          </span>
          <span className="tnums text-base font-semibold" style={{ color: 'var(--data-oil)' }}>
            US$ {nf(price, 1)}
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={MIN}
          max={MAX}
          step={0.5}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-2.5 w-full cursor-pointer"
          style={{ accentColor: 'var(--data-oil)' }}
        />
        <p className="tnums mt-3 text-xs leading-relaxed text-on-dark-2">
          <span className="text-on-dark-3">Sólo el petróleo:</span>{' '}
          <span className="font-semibold text-on-dark">US$ {nf(scenarioPerYear, 1)}B</span>{' '}
          <span className="text-on-dark-3">al año · US$ {nf(scenarioPerDay, 1)}M por día</span>
          {' · '}
          <span className="text-on-dark-3">margen s/breakeven:</span>{' '}
          <span
            className="font-semibold"
            /* la card es SIEMPRE oscura: van los status vivos del tema dark */
            style={{ color: margin >= 0 ? '#2fe0a4' : '#ff6d5f' }}
          >
            US$ {nf(margin, 1)}/bbl
          </span>
        </p>
      </div>

      {/* Pie: la formación en cifras (chico y en línea, valores en blanco);
          sin divisoria (pedido de Mariano) — el aire solo separa */}
      <div className="relative mt-7">
        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {oilSharePct != null && (
            <Figure value={`${nf(oilSharePct, 1)}%`} label="del petróleo nacional" />
          )}
          {gasSharePct != null && <Figure value={`${nf(gasSharePct, 1)}%`} label="del gas nacional" />}
          {wells != null && <Figure value={nf(wells, 0)} label="pozos activos" />}
        </dl>
      </div>
    </div>
  )
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="tnums m-0 text-[13px] font-semibold text-on-dark">{value}</dd>
      <dt className="type-label m-0 !text-on-dark-3">{label}</dt>
    </div>
  )
}

