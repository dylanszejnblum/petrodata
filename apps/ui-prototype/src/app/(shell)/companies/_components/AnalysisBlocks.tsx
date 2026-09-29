'use client'

import Link from 'next/link'
import { formatDecimal, formatInteger } from '@/lib/format'
import { RankedRow } from './RankedRow'
import { CompanyLogo } from '../_client/company-logo'
import { COTIZAN, PRODUCTIVIDAD, RANKED, RANK_BY_SLUG, STATS } from '../_lib/stats'

const OIL = 'var(--data-oil)'
const pct1 = (v: number) => `${formatDecimal(v, 1)}%`

/* ── 01 · Concentración ───────────────────────────────────────────────
   Las diez primeras con la receta 06: es el titular del sector y antes
   había que sumar 52 filas para verlo. */
export function ConcentrationBlock() {
  const top = RANKED.slice(0, 10)
  const max = top[0].pctNacional
  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="row-bleed mb-1 flex items-baseline justify-between gap-3 border-b pb-2">
        <span className="type-label">Empresa</span>
        <span className="type-label">Participación</span>
      </div>
      <div className="flex flex-col">
        {top.map((c, i) => (
          <RankedRow
            key={c.slug}
            rank={i + 1}
            name={c.name}
            website={c.website}
            logoUrl={c.logoUrl}
            index={i}
            leader={i === 0}
            pct={(c.pctNacional / max) * 100}
            right={
              <span
                className="font-semibold"
                style={{ color: i === 0 ? OIL : 'var(--text-primary)' }}
              >
                {pct1(c.pctNacional)}
              </span>
            }
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-tertiary">
        Participación en la producción nacional. La columna suma {pct1(STATS.baseNacional)} por
        redondeo a un decimal, no 100%.
      </p>
    </div>
  )
}

/* ── 02 · Pozos no es producción ──────────────────────────────────────
   Entre las grandes, el aporte por cada 100 pozos varía casi veinte
   veces: es la razón por la que el ranking no puede ordenarse por pozos. */
export function PerWellBlock() {
  const max = PRODUCTIVIDAD[0].por100
  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="row-bleed mb-1 flex items-baseline justify-between gap-3 border-b pb-2">
        <span className="type-label">Empresa</span>
        <span className="type-label">Pozos · aporte por 100</span>
      </div>
      <div className="flex flex-col">
        {PRODUCTIVIDAD.map((p, i) => (
          <RankedRow
            key={p.slug}
            rank={i + 1}
            name={p.name}
            website={p.website}
            logoUrl={p.logoUrl}
            index={i}
            leader={i === 0}
            pct={(p.por100 / max) * 100}
            right={
              <>
                {formatInteger(p.pozos)} pozos ·{' '}
                <span
                  className="font-semibold"
                  style={{ color: i === 0 ? OIL : 'var(--text-primary)' }}
                >
                  {formatDecimal(p.por100, 2)}
                </span>
              </>
            }
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-tertiary">
        Puntos de producción nacional por cada 100 pozos operados. Las {STATS.sinProduccion}{' '}
        empresas sin producción declarada operan {formatInteger(STATS.pozosSinProduccion)} pozos.
      </p>
    </div>
  )
}

/* ── 03 · Las que cotizan ─────────────────────────────────────────────
   Las ocho con precio público, hoy desparramadas en chips de 10px entre
   las filas 1, 11, 18, 19, 22, 24, 26 y 45. Acá el pill tintado del YoY
   sí corresponde: hay uno por fila y respira. */
export function ListedBlock() {
  const max = Math.max(...COTIZAN.map((c) => c.pctNacional))
  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="row-bleed mb-1 grid grid-cols-[1.5rem_minmax(0,1fr)_5rem_6rem] items-baseline gap-x-4 border-b pb-2">
        <span className="type-label">#</span>
        <span className="type-label">Empresa</span>
        <span className="type-label text-right">Precio</span>
        <span className="type-label text-right">Día</span>
      </div>
      <div className="flex flex-col">
        {COTIZAN.map((c, i) => {
          const up = (c.change ?? 0) >= 0
          const tone = up ? 'var(--status-positive)' : 'var(--status-negative)'
          return (
            <div
              key={c.slug}
              className="row-bleed grid grid-cols-[1.5rem_minmax(0,1fr)_5rem_6rem] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
            >
              <span className="text-[11px] tnums text-tertiary">
                {String(RANK_BY_SLUG[c.slug]).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 items-start gap-3">
                <CompanyLogo name={c.name} website={c.website} logoUrl={c.logoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/companies/${c.slug}`}
                      className="truncate text-sm text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-[10px] tnums text-tertiary">
                      {c.ticker} · {c.exchange}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.pctNacional / max) * 100}%`, background: OIL }}
                    />
                  </div>
                  <span className="mt-1 block text-[10px] tnums text-tertiary">
                    {pct1(c.pctNacional)} de la producción nacional
                  </span>
                </div>
              </div>
              <span className="text-right text-[13px] tnums text-primary">
                US$ {formatDecimal(c.price ?? 0, 2)}
              </span>
              <span className="flex justify-end">
                <span
                  className="tnums inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px]"
                  style={{ color: tone, background: `color-mix(in srgb, ${tone} 12%, transparent)` }}
                >
                  {up ? '+' : '−'}
                  {formatDecimal(Math.abs(c.change ?? 0), 1)}%
                </span>
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] text-tertiary">
        Cotizaciones del 11-08-2026. Entre las {STATS.cotizan} suman {pct1(STATS.pctCotizan)} de la
        producción y {pct1(STATS.pctValorCotizan)} del valor.
      </p>
    </div>
  )
}
