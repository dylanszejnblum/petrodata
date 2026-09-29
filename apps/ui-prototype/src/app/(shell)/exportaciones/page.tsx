import { PageHero } from '@/ui/page-hero'
import { Surface } from '@/ui/surface'
import { Stat } from '@/ui/stat'
import { SectionLabel } from '@/ui/section-label'
import { EmptyState } from '@/ui/empty-state'
import { Alert } from '@/ui/alert'
import { ProportionBarList } from '@/ui/proportion-list'
import { EXPORTS_SUMMARY } from '@/fixtures/indicadores'
import { PROVINCES } from '@/fixtures/provinces'
import { applyEstado, readMock, type SearchParams } from '@/mock/state'
import { formatDecimal } from '@/lib/format'
import { ProvinceExportsTable } from './_client'

/* /exportaciones — total real de vacamuerta.io (US$ 17,1B, año móvil),
   desglose por sector y tabla por provincia. */

const SECTOR_COLOR: Record<string, string> = {
  Petróleo: 'var(--data-oil)',
  Gas: 'var(--data-gas)',
  Minería: 'var(--status-caution)',
}

export default async function ExportacionesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { estado } = await readMock(searchParams)
  const sectors = applyEstado(estado, EXPORTS_SUMMARY.sectors, 2)
  const provinces = applyEstado(estado, PROVINCES, 2)

  const failed = sectors === null || provinces === null

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Exportaciones" title="Cuánto exporta la energía argentina">
        Valor exportado del complejo energético y minero, por sector y por provincia. Datos
        reales de vacamuerta.io/exportaciones.
      </PageHero>

      {failed ? (
        <EmptyState
          kind={estado === 'offline' ? 'offline' : 'error'}
          actionHref="/exportaciones"
          actionLabel="Reintentar"
        />
      ) : (
        <>
          {/* Total exportado — nivel 2 de jerarquía */}
          <Surface variant="inverse" className="py-8 md:py-10">
            <div className="mx-auto max-w-[36rem] text-center">
              <Stat
                label="Total exportado (año móvil)"
                value={EXPORTS_SUMMARY.totalBUSD}
                format="compact"
                unit="B US$"
                footnote="petróleo, gas y minería"
                size="lg"
                animate
                onDark
              />
            </div>
          </Surface>

          {/* 01 · Por sector */}
          <section className="mt-12">
            <SectionLabel index="01" title="Por sector" note={`${sectors.length} sectores`} />
            <Surface className="mt-5">
              {sectors.length === 0 ? (
                <EmptyState
                  kind="empty"
                  title="Sin sectores"
                  detail="No hay desglose sectorial para mostrar."
                />
              ) : (
                <ProportionBarList
                  items={sectors.map((s) => ({
                    key: s.name,
                    label: s.name,
                    value: s.busd,
                    display: `US$ ${formatDecimal(s.busd, 1)}B · ${formatDecimal(s.sharePct, 1)}%`,
                    color: SECTOR_COLOR[s.name],
                  }))}
                />
              )}
            </Surface>
          </section>

          {/* 02 · Por provincia */}
          <section className="mt-12">
            <SectionLabel index="02" title="Por provincia" note="US$, año móvil" />
            <div className="mt-5">
              <ProvinceExportsTable
                rows={provinces.map((p) => ({
                  name: p.name,
                  exportsMUSD: p.exportsMUSD,
                  expSharePct: p.expSharePct,
                }))}
              />
            </div>
          </section>

          <div className="mt-12">
            <Alert tone="info" title="Nota metodológica">
              Totales y desgloses de vacamuerta.io/exportaciones (año móvil). Incluye minería.
            </Alert>
          </div>
        </>
      )}
    </div>
  )
}
