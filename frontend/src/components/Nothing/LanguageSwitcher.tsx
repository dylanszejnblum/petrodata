'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

export function LanguageSwitcher() {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const setLocale = (next: Locale) => {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      role="group"
      aria-label={t('switchLanguage')}
      className="inline-flex items-center border border-nd-border rounded-full overflow-hidden"
      style={{ fontFamily: 'var(--font-space-mono)' }}
    >
      {routing.locales.map((l) => {
        const isActive = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={isActive}
            className="px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] transition-colors"
            style={{
              backgroundColor: isActive ? 'var(--nd-text-display)' : 'transparent',
              color: isActive ? 'var(--nd-black)' : 'var(--nd-text-secondary)',
            }}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}
