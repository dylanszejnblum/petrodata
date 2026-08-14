import type { Metadata } from 'next'
import {
  ASOF,
  BREAKEVEN,
  CONTRIBUTION,
  CRUCE,
  DAY_VALUE_INPUTS,
  KPIS,
  MUNDO,
  OPERADORES,
  SERIE,
  ACTIVIDAD,
} from '@/fixtures/inversiones'
import { useTranslations } from './_lib/messages'
import { buildKpiViz, kpiValue } from './_lib/kpiViz'
import { Section } from '@/ui/section'
import { DayValueCardEstrato } from './_components/DayValueCardEstrato'
import { KpiBento } from './_components/KpiBento'
import { BreakevenTrend } from './_components/BreakevenTrend'
import { RampChart } from './_components/RampChart'
import { ActividadChart } from './_components/ActividadChart'
import { CruceChart } from './_components/CruceChart'
import { OperatorLeaderboard } from './_components/OperatorLeaderboard'
import { ContributionTable } from './_components/ContributionTable'
import { TransportInfra } from './_components/TransportInfra'
import {
  ImpactoPanel,
  PoliticaMacro,
  RigiSection,
  WorldGrowth,
  WorldRankings,
} from './_components/WorldStage'

/* INDICADORES — nació como copia 1:1 de vacamuerta.io/indicadores (datos
   reales scrapeados 2026-08-07) y fue fine-tuneada sección por sección con
   Mariano hasta quedar 100% en el design system ESTRATO: tokens de color,
   Inter Tight para display/cifras, Schibsted para cuerpo/labels, cards con
   ancla animada + tooltips oscuros, y semántica oil/gas/status. */

export const metadata: Metadata = {
  title: 'Indicadores',
  description:
    'La oportunidad de Vaca Muerta en números: cada cifra se computa a partir de datos oficiales de producción y exportación, con su fuente y fecha de corte.',
}

export default function IndicadoresPage() {
  const t = useTranslations('indicadores')
  const kpiViz = buildKpiViz()

  return (
    <div className="w-full flex-1 overflow-x-clip">
      {/* Hero — tipografía y marca Estrato (rombo oil, Inter Tight, Schibsted) */}
      <section className="mx-auto max-w-[80rem] px-4 md:px-8 border-b pb-6 pt-8 md:pt-12">
        <span className="type-label-md flex items-center gap-2.5 !tracking-[0.14em]">
          <span
            aria-hidden
            className="live-dot inline-block size-1.5 rotate-45"
            style={{ background: 'var(--data-oil)' }}
          />
          {t('eyebrow')}
        </span>
        <h1 className="type-h1 mt-3 text-balance">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-secondary">
          {t('blurb')}
        </p>
      </section>

      {/* Cuánto vale un día + qué es Vaca Muerta dentro del país —
          card única Estrato compacta (ancla | escenario + banda de foto) */}
      <section className="mx-auto max-w-[80rem] px-4 md:px-8 pb-12 pt-8">
        <DayValueCardEstrato
          inputs={DAY_VALUE_INPUTS}
          oilSharePct={kpiValue('participacion_petroleo')}
          gasSharePct={kpiValue('participacion_gas')}
          wells={kpiValue('pozos_activos')}
        />
      </section>

      {/* La tesis en seis datos — bento oscuro Estrato */}
      <Section title={t('thesisLabel')} note={t('asOf', { month: ASOF })} blurb={t('thesisBlurb')}>
        <KpiBento kpis={KPIS.filter((k) => k.id !== 'produccion_nacional')} viz={kpiViz} />
      </Section>

      {/* 01 · Margen sobre el breakeven */}
      <Section index="01" title={t('breakevenTitle')} note="US$/BBL" blurb={t('breakevenBlurb')} card>
        <BreakevenTrend breakeven={BREAKEVEN} />
      </Section>

      {/* 02 · Rampa de producción */}
      <Section index="02" title={SERIE.title} note={SERIE.unit} blurb={t('serieBlurb')} card>
        <RampChart points={SERIE.points} />
      </Section>

      {/* 03 · Actividad: pozos nuevos por mes */}
      <Section index="03" title={t('actividadTitle')} note={ACTIVIDAD.unit} blurb={t('actividadBlurb')} card>
        <ActividadChart actividad={ACTIVIDAD} />
      </Section>

      {/* 04 · Cruce agro vs energía */}
      <Section index="04" title={CRUCE.title} note={CRUCE.unit} blurb={t('cruceBlurb')} card>
        <CruceChart cruce={CRUCE} />
      </Section>

      {/* 05 · Operadores principales */}
      <Section index="05" title={t('operatorsTitle')} blurb={t('operatorsBlurb')} card>
        <OperatorLeaderboard operadores={OPERADORES} />
      </Section>

      {/* 06 · Contribución económica por operadora */}
      <Section index="06" title={t('contribution.title')} blurb={t('contribution.blurb')} card>
        <ContributionTable data={CONTRIBUTION} />
      </Section>

      {/* 07 · Infraestructura de transporte — una sola card: encabezado
          de datos + barras (composición del 06) */}
      <Section index="07" title={t('transportTitle')} blurb={t('transportBlurb')} card>
        <TransportInfra />
      </Section>

      {/* 08 · Argentina en el mundo — rankings EIA (hoy vs proyectado) */}
      <Section
        index="08"
        title={t('worldTitle')}
        note={MUNDO.rankings[0] ? `EIA · ${MUNDO.rankings[0].year}` : undefined}
        blurb={t('worldBlurb')}
      >
        <WorldRankings mundo={MUNDO} />
      </Section>

      {/* 09 · Productores de mayor crecimiento */}
      <Section
        index="09"
        title={t('growthTitle')}
        note={
          MUNDO.fastestGrowing[0]
            ? `${MUNDO.fastestGrowing[0].sinceYear}–${MUNDO.fastestGrowing[0].toYear}`
            : undefined
        }
        blurb={t('growthSectionBlurb')}
      >
        <WorldGrowth mundo={MUNDO} />
      </Section>

      {/* 10 · Política económica — narrativa + charts macro */}
      <Section index="10" title={t('politicaTitle')} blurb={t('politicaBlurb')}>
        <PoliticaMacro politica={MUNDO.politica} />
      </Section>

      {/* 11 · RIGI — inversión comprometida (dataset propio) */}
      {MUNDO.politica?.rigi && MUNDO.politica.rigi.projects.length > 0 && (
        <Section
          index="11"
          title={t('rigiTitle')}
          note={`${MUNDO.politica.rigi.count} proyectos · US$ ${(
            MUNDO.politica.rigi.totalMusd / 1000
          ).toLocaleString('es-AR', { maximumFractionDigits: 1 })} B`}
          blurb={t('rigiBlurb')}
        >
          <RigiSection rigi={MUNDO.politica.rigi} />
        </Section>
      )}

      {/* 12 · Impacto proyectado — el cierre de la página */}
      {MUNDO.politica?.impacto && (
        <Section
          index="12"
          title={t('impactoTitle')}
          note={MUNDO.rankings[0] ? String(MUNDO.rankings[0].projected.year) : undefined}
          blurb={t('impactoBlurb')}
        >
          <ImpactoPanel impacto={MUNDO.politica.impacto} />
        </Section>
      )}
    </div>
  )
}
