import Link from 'next/link'
import { EmptyState } from '@/ui/empty-state'
import { formatDecimal, formatInteger } from '@/lib/format'
import { CompanyLogo } from '../_client/company-logo'
import { RANK_BY_SLUG } from '../_lib/stats'
import type { Company } from '@/fixtures/companies'

/* EL LISTADO COMPLETO — las 52 con la receta 06 de Indicadores.
   Decisiones de Mariano (2026-08-11): ordenado por participación en la
   producción (no por cantidad de pozos), sin toggle "Con pozos" (filtraba
   cero filas), sin la columna "Sector" (decía lo mismo 52 veces) y sin la
   barra de búsqueda ni el conteo.

   Sin filtros no queda estado en el cliente, así que esto es un componente
   de servidor; el único cliente que sobrevive es CompanyLogo, por el
   fallback del favicon. El puesto sale de RANK_BY_SLUG, calculado sobre el
   set completo: es de la empresa, no de la vista. */

const OIL = 'var(--data-oil)'

export function CompanyList({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return (
      <EmptyState
        kind="empty"
        title="Sin empresas"
        detail="Todavía no hay operadoras cargadas en el ranking."
      />
    )
  }

  const max = companies[0].pctNacional || 1

  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="row-bleed mb-1 grid grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_5.5rem] items-baseline gap-x-4 border-b pb-2">
        <span className="type-label">#</span>
        <span className="type-label">Empresa</span>
        <span className="type-label text-right">% Valor</span>
        <span className="type-label text-right">Pozos</span>
      </div>
      <div className="flex flex-col">
        {companies.map((c) => {
          const rank = RANK_BY_SLUG[c.slug]
          const leader = rank === 1
          return (
            <div
              key={c.slug}
              className="row-bleed grid grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_5.5rem] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
            >
              <span
                className="text-[11px] tnums"
                style={{ color: leader ? OIL : 'var(--text-tertiary)' }}
              >
                {String(rank).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 items-start gap-3">
                <CompanyLogo name={c.name} website={c.website} logoUrl={c.logoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/companies/${c.slug}`}
                      className="truncate text-sm text-primary hover:underline"
                      style={{ fontWeight: leader ? 600 : 400 }}
                    >
                      {c.name}
                    </Link>
                    <span
                      className="shrink-0 text-[11px] font-semibold tnums"
                      style={{ color: leader ? OIL : 'var(--text-primary)' }}
                    >
                      {formatDecimal(c.pctNacional, 1)}%
                    </span>
                  </div>
                  {c.exchange && c.price != null && (
                    <span className="mt-0.5 block text-[10px] tnums text-tertiary">
                      {c.exchange} · US$ {formatDecimal(c.price, 2)}
                      {c.change != null && (
                        <span
                          className="ml-1 font-semibold"
                          style={{
                            color:
                              c.change >= 0
                                ? 'var(--status-positive)'
                                : 'var(--status-negative)',
                          }}
                        >
                          {c.change >= 0 ? '+' : '−'}
                          {formatDecimal(Math.abs(c.change), 1)}%
                        </span>
                      )}
                    </span>
                  )}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.pctNacional / max) * 100}%`,
                        background: OIL,
                        opacity: leader ? 1 : 0.85,
                      }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-right text-[11px] tnums text-secondary">
                {formatDecimal(c.pctValor, 1)}%
              </span>
              <span className="text-right text-[11px] tnums text-secondary">
                {formatInteger(c.proyectos)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
