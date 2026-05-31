import type { Metadata } from 'next'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { cn } from '@/utilities/ui'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { NewsletterModalLoader } from '@/components/Nothing/NewsletterModalLoader'
import { Providers } from '@/providers'
import { defaultTheme, themeLocalStorageKey } from '@/providers/Theme/shared'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { Space_Grotesk, Space_Mono } from 'next/font/google'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { getSocialImageURL } from '@/utilities/getSocialImageURL'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      className={cn(spaceGrotesk.variable, spaceMono.variable)}
      lang={locale}
      suppressHydrationWarning={true}
    >
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function getImplicitPreference() {
                  var mediaQuery = '(prefers-color-scheme: dark)'
                  var mql = window.matchMedia(mediaQuery)
                  var hasImplicitPreference = typeof mql.matches === 'boolean'

                  if (hasImplicitPreference) {
                    return mql.matches ? 'dark' : 'light'
                  }

                  return null
                }

                function themeIsValid(theme) {
                  return theme === 'light' || theme === 'dark'
                }

                var themeToSet = '${defaultTheme}'
                var preference = window.localStorage.getItem('${themeLocalStorageKey}')

                if (themeIsValid(preference)) {
                  themeToSet = preference
                } else {
                  var implicitPreference = getImplicitPreference()

                  if (implicitPreference) {
                    themeToSet = implicitPreference
                  }
                }

                document.documentElement.setAttribute('data-theme', themeToSet)
              })();
            `,
          }}
        />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />
            {children}
            <NewsletterModalLoader />
          </Providers>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Petrodata — Argentina oil, gas, minerals & rare-earths tracker',
    template: '%s | Petrodata',
  },
  description:
    'Petrodata — tracking Argentina’s oil, gas, minerals and rare-earths projects. Production, reserves, operators, and geography in one place.',
  keywords: [
    'Argentina',
    'mining',
    'minería',
    'oil and gas',
    'petróleo',
    'gas',
    'lithium',
    'litio',
    'uranium',
    'uranio',
    'rare earths',
    'tierras raras',
    'gold',
    'silver',
    'copper',
    'Vaca Muerta',
  ],
  authors: [{ name: 'Petrodata', url: getServerSideURL() }],
  creator: 'Petrodata',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    title: 'Petrodata — Argentina oil, gas, minerals & rare-earths tracker',
    description:
      'Production, reserves, operators, and geography for Argentina’s oil, gas, minerals and rare-earths projects.',
    images: [
      { url: getSocialImageURL(), width: 1200, height: 630, alt: 'Petrodata homepage' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: getServerSideURL(),
  },
}
