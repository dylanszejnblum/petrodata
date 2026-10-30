'use client'

import { useTranslations } from 'next-intl'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('v2.error')
  return (
    <div className="mx-auto grid max-w-[42rem] place-items-center px-4 py-24">
      <div className="w-full max-w-[30rem] text-center">
        <p className="s-desc">{t('titulo')}</p>
        <button type="button" onClick={reset} className="s-pill mt-6">
          {t('reintentar')} <span aria-hidden>↻</span>
        </button>
      </div>
    </div>
  )
}
