import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { FooterNewsletterForm } from '@/components/Nothing/FooterNewsletterForm'
import { buildAlternates } from '@/i18n/alternates'
import { fetchInversiones } from '@/api/inversiones'
import { KpiGrid } from '@/components/Petrodata/inversiones/KpiGrid'
import { RampChart } from '@/components/Petrodata/inversiones/RampChart'
import { OperatorLeaderboard } from '@/components/Petrodata/inversiones/OperatorLeaderboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('inversiones')
  return { title: t('title'), description: t('blurb'), alternates: buildAlternates('/inversiones') }
}

export default async function InversionesPage() {
  const [t, data] = await Promise.all([getTranslations('inversiones'), fetchInversiones()])

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
          <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-nd-text-secondary">
            {t('eyebrow')}
          </span>
          <h1 className="mt-4 text-balance text-4xl leading-none text-nd-text-display sm:text-5xl md:text-7xl font-display break-words">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-nd-text-secondary font-sans">
            {t('blurb')}
          </p>
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

        {/* Production ramp chart */}
        {data.serie && data.serie.points.length ? (
          <section className="container pb-16">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl text-nd-text-display md:text-2xl font-display">
                {data.serie.title}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                {data.serie.unit}
              </span>
            </div>
            <RampChart points={data.serie.points} />
            <a
              href={data.serie.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled transition-colors hover:text-nd-text-secondary"
            >
              {t('source')}: {data.serie.source.label} · {data.serie.source.asOf} ↗
            </a>
          </section>
        ) : null}

        {/* Operator leaderboard */}
        {data.operadores.length ? (
          <section className="container pb-16">
            <h2 className="mb-5 text-xl text-nd-text-display md:text-2xl font-display">
              {t('operatorsTitle')}
            </h2>
            <OperatorLeaderboard operadores={data.operadores} />
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
