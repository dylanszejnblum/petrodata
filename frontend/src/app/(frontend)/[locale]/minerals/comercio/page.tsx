import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NothingHeader } from '@/components/Nothing/Header'
import { NothingFooter } from '@/components/Nothing/Footer'
import { api, type ApiSchemas } from '@/api/client'
import { buildAlternates } from '@/i18n/alternates'
import { TradeFlowExplorer } from '@/components/Petrodata/entities/TradeFlowExplorer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TradeFlowDto = ApiSchemas['TradeFlowDto']

const MINERALS = ['Uranio', 'Litio', 'Oro', 'Plata', 'Cobre', 'Plomo', 'Zinc']

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('trade')
  return {
    title: `${t('title')} — Argentina`,
    alternates: buildAlternates('/minerals/comercio'),
  }
}

async function getFlow(): Promise<TradeFlowDto | null> {
  try {
    const { data, error } = await api.GET('/api/v2/minerals/trade/flow', { cache: 'no-store' })
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

export default async function ComercioPage() {
  const [t, flow] = await Promise.all([getTranslations('trade'), getFlow()])

  if (!flow) {
    const tCommon = await getTranslations('common')
    return (
      <>
        <NothingHeader />
        <main className="flex flex-1 items-center justify-center font-mono text-sm text-nd-text-disabled">
          {tCommon('backendOffline', {
            url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
          })}
        </main>
        <NothingFooter />
      </>
    )
  }

  return (
    <>
      <NothingHeader />
      <main className="w-full flex-1">
        <section className="container pb-10 pt-12 md:pt-16">
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {t('eyebrow')}
          </span>
          <h1 className="mt-3 text-balance font-display text-4xl leading-none text-nd-text-display md:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty font-sans text-nd-text-secondary">
            {t('blurb')}
          </p>
        </section>

        <section className="container pb-16">
          <TradeFlowExplorer initial={flow} minerals={MINERALS} />
        </section>
      </main>
      <NothingFooter />
    </>
  )
}
