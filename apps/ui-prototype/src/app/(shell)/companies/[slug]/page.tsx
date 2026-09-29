import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Surface } from '@/ui/surface'
import { Badge } from '@/ui/badge'
import { Stat } from '@/ui/stat'
import { SectionLabel } from '@/ui/section-label'
import { EmptyState } from '@/ui/empty-state'
import { formatInteger } from '@/lib/format'
import { readMock } from '@/mock/state'
import { COMPANIES } from '@/fixtures/companies'
import { StockChart } from '../_client/stock-chart'

/* Ficha de compañía — campos reales del ranking: rank, cotización,
   % nacional, % del valor y proyectos; cotización solo si lista en bolsa.
   NOTA: la ficha equivalente de producción está caída (todas las URLs
   /companies/<slug> devuelven sólo el skeleton), así que esta pantalla
   NO es todavía un port 1:1 — sigue en composición Estrato hasta que
   podamos auditarla contra el sitio real. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const company = COMPANIES.find((c) => c.slug === slug)
  return { title: `${company?.name ?? 'Compañía'} · Estrato` }
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ slug }, { estado }] = await Promise.all([params, readMock(searchParams)])
  const company = COMPANIES.find((c) => c.slug === slug)
  if (!company) notFound()

  const listed = company.ticker != null && company.price != null
  /* la fixture guarda la cotización como en producción: bolsa (NYQ/BUE)
     y variación del día en puntos porcentuales */
  const listingLabel = company.exchange ?? 'Privada'

  return (
    <main className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      {/* Hero */}
      <div className="pb-10 pt-10">
        <Link href="/companies" className="type-label-md !text-secondary hover:!text-primary">
          ← Compañías
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-[40rem]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{listingLabel}</Badge>
              <Badge tone="neutral">{company.sector}</Badge>
            </div>
            <h1 className="type-display text-balance break-words text-[clamp(2.4rem,6vw,3.6rem)]">
              {company.name}
            </h1>
            <p className="type-label tnums m-0 mt-3">
              #{company.rank} del ranking nacional de producción
            </p>
          </div>
          {listed && (
            <Surface variant="inverse" className="min-w-[15rem]">
              <Stat
                label="Precio de la acción"
                value={company.price!}
                format="compact"
                unit="US$"
                delta={company.change != null ? company.change / 100 : null}
                footnote={`${company.ticker} · ${listingLabel}`}
                onDark
              />
            </Surface>
          )}
        </div>
      </div>

      {/* Cotización */}
      {listed && (
        <Surface variant="flat" className="mb-10">
          {estado === 'error' || estado === 'offline' ? (
            <EmptyState
              kind={estado === 'offline' ? 'offline' : 'error'}
              title="No pudimos cargar la cotización"
              detail="El histórico de precios no responde. El resto de la ficha sigue disponible."
            />
          ) : (
            <StockChart ticker={company.ticker!} price={company.price!} />
          )}
        </Surface>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Surface variant="flat">
          <Stat
            label="% Nacional"
            value={company.pctNacional}
            format="compact"
            unit="%"
            footnote="De la producción nacional"
          />
        </Surface>
        <Surface variant="flat">
          <Stat
            label="% Valor"
            value={company.pctValor}
            format="compact"
            unit="%"
            footnote="Del valor en US$"
          />
        </Surface>
        <Surface variant="flat" className="col-span-2 md:col-span-1">
          <Stat
            label="Proyectos"
            value={company.proyectos}
            format="integer"
            footnote={`#${company.rank} del ranking`}
          />
        </Surface>
      </div>

      {/* Perfil (solo si hay reseña) */}
      {company.blurb && (
        <section className="mt-14">
          <SectionLabel index="01" title="Perfil" />
          <p className="mt-6 max-w-[44rem] text-[14.5px] text-secondary">{company.blurb}</p>
          <p className="mt-4 text-[13px] text-tertiary">
            {formatInteger(company.proyectos)} proyectos registrados en el ranking nacional.
          </p>
        </section>
      )}
    </main>
  )
}
