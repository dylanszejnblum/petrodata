import Link from 'next/link'
import { PageHero } from '@/ui/page-hero'
import { Surface } from '@/ui/surface'
import { Badge } from '@/ui/badge'
import { Stat } from '@/ui/stat'
import { EmptyState } from '@/ui/empty-state'
import { PROVINCES } from '@/fixtures/provinces'
import { applyEstado, readMock, type SearchParams } from '@/mock/state'
import { formatDecimal, formatInteger, formatUSDCompact } from '@/lib/format'

/* /provincias — grid federal. Neuquén lleva la jerarquía máxima (Surface photo,
   doble columna); el resto son cards flat interactivas. Datos reales de
   vacamuerta.io/provincias: pozos, exportaciones y participación exportadora. */

export default async function ProvinciasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { estado } = await readMock(searchParams)
  const provinces = applyEstado(estado, PROVINCES, 2)

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Provincias" title="La producción, provincia por provincia">
        Dónde se perfora, cuánto exporta y qué peso tiene cada jurisdicción en la matriz
        energética. Pozos y exportaciones reales de vacamuerta.io.
      </PageHero>

      {provinces === null ? (
        <EmptyState
          kind={estado === 'offline' ? 'offline' : 'error'}
          actionHref="/provincias"
          actionLabel="Reintentar"
        />
      ) : provinces.length === 0 ? (
        <EmptyState
          kind="empty"
          title="Sin provincias"
          detail="No hay jurisdicciones para mostrar con los datos actuales."
        />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {provinces.map((p, i) => {
            const featured = i === 0 && p.slug === 'neuquen'
            return (
              <li key={p.slug} className={featured ? 'sm:col-span-2' : ''}>
                <Link href={`/provincias/${p.slug}`} className="block h-full rounded-[10px]">
                  {featured ? (
                    <Surface variant="photo" padding="none" className="h-full">
                      <div className="flex h-full min-h-[18rem] flex-col justify-between gap-8 p-5 md:p-7">
                        <div className="flex items-center justify-between gap-3">
                          <Badge tone="on-dark">
                            {formatDecimal(p.expSharePct, 1)}% de las exportaciones
                          </Badge>
                        </div>
                        <div>
                          <p className="type-label !text-on-dark-3">{p.basin}</p>
                          <h2 className="type-card-title !text-white m-0 mt-1">{p.name}</h2>
                          <p className="mt-2 max-w-[34rem] text-[13.5px] text-on-dark-2">
                            {p.blurb}
                          </p>
                          <div className="mt-6 grid grid-cols-3 gap-4">
                            <Stat label="Pozos" value={p.wells} onDark />
                            <Stat
                              label="Exportaciones (US$)"
                              value={p.exportsMUSD * 1e6}
                              format="compact"
                              onDark
                            />
                            <Stat
                              label="Part. export."
                              value={p.expSharePct / 100}
                              format="percent"
                              onDark
                            />
                          </div>
                        </div>
                      </div>
                    </Surface>
                  ) : (
                    <Surface interactive className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="type-label">{p.basin}</p>
                          <h2 className="type-card-title m-0 mt-1">{p.name}</h2>
                        </div>
                      </div>
                      <p className="mt-2 text-[13px] text-secondary">{p.blurb}</p>
                      <dl className="mt-auto flex gap-6 pt-5">
                        <div className="min-w-0">
                          <dt className="type-label">Pozos</dt>
                          <dd className="m-0 mt-1 text-[13px] font-medium tnums">
                            {formatInteger(p.wells)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="type-label">Exportaciones</dt>
                          <dd className="m-0 mt-1 text-[13px] font-medium tnums">
                            {formatUSDCompact(p.exportsMUSD * 1e6)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="type-label">Part. export.</dt>
                          <dd className="m-0 mt-1 text-[13px] font-medium tnums">
                            {formatDecimal(p.expSharePct, 1)}%
                          </dd>
                        </div>
                      </dl>
                    </Surface>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
