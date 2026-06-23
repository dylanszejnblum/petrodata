import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { FooterNewsletterForm } from '@/components/Nothing/FooterNewsletterForm'
import { buildAlternates } from '@/i18n/alternates'
import { fetchInversiones } from '@/api/inversiones'
import { KpiGrid } from '@/components/Petrodata/indicadores/KpiGrid'
import { RampChart } from '@/components/Petrodata/indicadores/RampChart'
import { OperatorLeaderboard } from '@/components/Petrodata/indicadores/OperatorLeaderboard'
import { BreakevenTrend } from '@/components/Petrodata/indicadores/BreakevenTrend'
import { ActividadChart } from '@/components/Petrodata/indicadores/ActividadChart'
import { CruceChart } from '@/components/Petrodata/indicadores/CruceChart'
import { WorldStage } from '@/components/Petrodata/indicadores/WorldStage'

// ISR: investment figures update ~monthly, so a 1h revalidate makes the page
// near-instant while staying fresh (the fetch is also tagged 'inversiones' for
// on-demand purge via revalidateTag).
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('indicadores')
  return { title: t('title'), description: t('blurb'), alternates: buildAlternates('/indicadores') }
}

export default async function IndicadoresPage() {
  const [t, data] = await Promise.all([getTranslations('indicadores'), fetchInversiones()])

  if (!data) {
    return (
      <>
        <NothingHeader />
        <main className="flex-1 w-full overflow-x-clip">
          <section className="container pt-12 pb-20 md:pt-20">
            <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
              {t('eyebrow')}
            </span>
            <h1 className="mt-4 text-balance text-4xl leading-none text-nd-text-display sm:text-5xl md:text-7xl font-display">
              {t('title')}
            </h1>
            <p className="mt-8 font-mono text-sm text-nd-text-disabled">{t('noData')}</p>
          </section>
        </main>
        <NothingFooter />
      </>
    )
  }

  return (
    <>
      <NothingHeader />
      <main className="flex-1 w-full overflow-x-clip">
        {/* Hero */}
        <section className="container pt-12 pb-8 md:pt-20">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
            <span
              className="nd-live-dot inline-block size-1.5 rounded-full"
              style={{ background: 'var(--nd-accent)' }}
              aria-hidden
            />
            {t('eyebrow')}
          </span>
          <h1 className="mt-4 text-balance text-4xl leading-none text-nd-text-display sm:text-5xl md:text-7xl font-display break-words">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans">
            {t('blurb')}
          </p>
          {/* accent rule */}
          <div className="relative mt-8 h-px w-full bg-nd-border">
            <div className="absolute inset-y-0 left-0 bg-nd-accent" style={{ width: '6rem' }} aria-hidden />
          </div>
        </section>

        {/* Headline + integrity framing */}
        <section className="container pb-10">
          <p className="max-w-3xl text-pretty text-2xl leading-snug text-nd-text-display md:text-3xl font-display">
            {data.headline}
          </p>
          {data.note ? (
            <p className="mt-4 max-w-2xl text-pretty font-mono text-[11px] leading-relaxed text-nd-text-disabled">
              {data.note}
            </p>
          ) : null}
          {data.asOf ? (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
              {t('asOf', { month: data.asOf })}
            </p>
          ) : null}
        </section>

        {/* KPI grid */}
        <section className="container pb-16">
          <KpiGrid kpis={data.kpis} />
        </section>

        {/* Breakeven headroom trend */}
        {data.breakeven ? (
          <section className="container pb-16">
            <h2 className="mb-5 flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
              <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">01</span>
              <span>{t('breakevenTitle')}</span>
            </h2>
            <BreakevenTrend breakeven={data.breakeven} />
          </section>
        ) : null}

        {/* Production ramp chart */}
        {data.serie && data.serie.points.length ? (
          <section className="container pb-16">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
                <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">02</span>
                <span>{data.serie.title}</span>
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {data.serie.unit}
              </span>
            </div>
            <RampChart points={data.serie.points} />
            <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
              {t('computedBy', { source: `${data.serie.source.label} · ${data.serie.source.asOf}` })}
            </span>
          </section>
        ) : null}

        {/* Activity momentum — new wells per month */}
        {data.actividad && data.actividad.points.length ? (
          <section className="container pb-16">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
                <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">03</span>
                <span>{t('actividadTitle')}</span>
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {data.actividad.unit}
              </span>
            </div>
            <ActividadChart actividad={data.actividad} />
            <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
              {t('computedBy', { source: `${data.actividad.source.label} · ${data.actividad.source.asOf}` })}
            </span>
          </section>
        ) : null}

        {/* Agro vs energy export crossover */}
        {data.cruce && data.cruce.points.length ? (
          <section className="container pb-16">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
                <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">04</span>
                <span>{data.cruce.title}</span>
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {data.cruce.unit}
              </span>
            </div>
            <p className="mb-5 max-w-2xl text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
              {t('cruceBlurb')}
            </p>
            <CruceChart cruce={data.cruce} />
            <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
              {t('computedBy', { source: `${data.cruce.source.label} · ${data.cruce.source.asOf}` })}
            </span>
          </section>
        ) : null}

        {/* Operator leaderboard */}
        {data.operadores.length ? (
          <section className="container pb-16">
            <h2 className="mb-5 flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
              <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">05</span>
              <span>{t('operatorsTitle')}</span>
            </h2>
            <OperatorLeaderboard operadores={data.operadores} />
          </section>
        ) : null}

        {/* Argentina en el mundo — the catapult section */}
        {data.mundo && data.mundo.rankings.length ? (
          <section className="container pb-16">
            <h2 className="mb-2 flex items-baseline gap-3 text-xl text-nd-text-display md:text-2xl font-display">
              <span className="font-mono text-[10px] tabular-nums text-nd-text-disabled">06</span>
              <span>Argentina en el mundo</span>
            </h2>
            <p className="mb-8 max-w-2xl text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
              Dónde está Argentina hoy entre los productores del mundo, y a dónde la lleva Vaca Muerta
              si la proyección se realiza. El salto en el ranking, con datos de la EIA.
            </p>
            <WorldStage mundo={data.mundo} />
          </section>
        ) : null}

        {/* CTA band */}
        <section className="border-t border-nd-border bg-nd-surface">
          <div className="container flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance text-2xl leading-snug text-nd-text-display md:text-3xl font-display">
                {t('ctaTitle')}
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
                {t('ctaBody')}
              </p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <a
                href="mailto:info@vacamuerta.io?subject=Inversiones%20Vaca%20Muerta"
                className="inline-flex w-fit items-center gap-2 bg-nd-text-display px-5 py-2.5 font-mono text-xs uppercase tracking-[0.06em] text-nd-surface transition-opacity hover:opacity-80"
              >
                {t('ctaContact')} →
              </a>
              <div>
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                  {t('ctaNewsletter')}
                </span>
                <FooterNewsletterForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
