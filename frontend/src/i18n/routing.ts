import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'] as const,
  defaultLocale: 'es',
  // Spanish at the root (no prefix), English under /en/...
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
