import type { Metadata } from 'next'
import { Section } from '@/ui/section'
import { EmptyState } from '@/ui/empty-state'
import { formatDecimal, formatInteger } from '@/lib/format'
import { readMock, applyEstado } from '@/mock/state'
import { CompanyList } from './_components/CompanyList'
import { ConcentrationBlock, ListedBlock, PerWellBlock } from './_components/AnalysisBlocks'
import { RANKED, STATS } from './_lib/stats'

/* EMPRESAS — nació como copia 1:1 de vacamuerta.io/companies (scrape del
   2026-08-11) y Mariano la pasó de directorio a página en Estrato: hero y
   cuatro secciones numeradas que explican la concentración de la cuenca,
   cerrando con el listado completo de las 52.
   Cada cifra sale de sumas sobre la fixture del ranking (_lib/stats.ts). */

const pct = (v: number) => `${formatDecimal(v, 1)}%`

export const metadata: Metadata = {
  title: 'Empresas de petróleo y gas',
  description:
    'Quiénes desarrollan la cuenca: las 52 operadoras del ranking nacional, su participación en la producción y en el valor, y los pozos que operan.',
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { estado } = await readMock(searchParams)
  const companies = applyEstado(estado, RANKED, 3)
  const s = STATS

  return (
    <div className="w-full flex-1 overflow-x-clip">
      {/* Hero — marca Estrato: rombo oil con pulso, Inter Tight, Schibsted */}
      <section className="mx-auto max-w-[80rem] border-b px-4 pb-6 pt-8 md:px-8 md:pt-12">
        <span className="type-label-md flex items-center gap-2.5 !tracking-[0.14em]">
          <span
            aria-hidden
            className="live-dot inline-block size-1.5 rotate-45"
            style={{ background: 'var(--data-oil)' }}
          />
          Directorio · Empresas
        </span>
        <h1 className="type-h1 mt-3 text-balance">Quiénes desarrollan la cuenca</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-secondary">
          Las {s.empresas} operadoras del ranking nacional de producción, con su participación en el
          crudo y el gas del país, el valor que capturan y los pozos que operan.
        </p>
      </section>

      {companies === null ? (
        <section className="mx-auto max-w-[80rem] px-4 py-16 md:px-8">
          <EmptyState
            kind={estado === 'offline' ? 'offline' : 'error'}
            actionHref="/companies"
            actionLabel="Reintentar"
          />
        </section>
      ) : (
        <>
          {/* 01 · Concentración */}
          <Section
            first
            index="01"
            title="La concentración de la producción"
            note={`Top 10 · ${pct(s.top10)}`}
            blurb={`${s.grandes} empresas explican el ${pct(s.pctGrandes)} de la producción nacional. Las otras ${s.cola} suman ${pct(s.pctCola)} repartido en ${formatInteger(s.pozosCola)} pozos.`}
          >
            <ConcentrationBlock />
          </Section>

          {/* 02 · Pozos vs producción */}
          <Section
            index="02"
            title="Más pozos no es más producción"
            note="Aporte por cada 100 pozos"
            blurb={`Entre las ${s.grandes} grandes, el aporte por pozo varía casi veinte veces: un pozo shale de Vaca Muerta produce lo que decenas de pozos convencionales maduros. Por eso el ranking se ordena por producción y no por cantidad de pozos.`}
          >
            <PerWellBlock />
          </Section>

          {/* 03 · Las que cotizan */}
          <Section
            index="03"
            title="Las que cotizan en bolsa"
            note={`${s.cotizan} de ${s.empresas}`}
            blurb={`Ocho operadoras tienen precio público todos los días y concentran el ${pct(s.pctCotizan)} de la producción: casi dos tercios de la cuenca se puede seguir desde una pantalla de mercado.`}
          >
            <ListedBlock />
          </Section>

          {/* 04 · El listado completo */}
          <Section
            index="04"
            title="El listado completo"
            note={`${s.empresas} empresas`}
            blurb="Todas las operadoras con pozos registrados, ordenadas por participación en la producción nacional."
          >
            <CompanyList companies={companies} />
          </Section>
        </>
      )}
    </div>
  )
}
