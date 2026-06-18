'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { FooterNewsletterForm } from './FooterNewsletterForm'

export function NothingFooter() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  return (
    <footer className="border-t border-nd-border">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.png" alt="Vaca Muerta" className="size-6 rounded-sm" />
              <span className="text-nd-text-display text-sm tracking-tight font-sans">
                vacamuerta<span style={{ color: 'var(--nd-success)' }}>.io</span>
              </span>
            </Link>
            <p className="text-nd-text-disabled text-xs max-w-xs font-sans">
              {t('tagline')}
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-12 md:gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase font-mono">
                {t('resources')}
              </span>
              <Link
                href="/"
                className="text-nd-text-secondary hover:text-nd-text-display text-sm transition-colors font-sans"
              >
                {tNav('dashboardFull')}
              </Link>
              <Link
                href="/map"
                className="text-nd-text-secondary hover:text-nd-text-display text-sm transition-colors font-sans"
              >
                {tNav('oilGasFull')}
              </Link>
              <Link
                href="/companies"
                className="text-nd-text-secondary hover:text-nd-text-display text-sm transition-colors font-sans"
              >
                {tNav('companiesFull')}
              </Link>
              <Link
                href="/provincias"
                className="text-nd-text-secondary hover:text-nd-text-display text-sm transition-colors font-sans"
              >
                {tNav('provincesFull')}
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase font-mono">
                {t('newsletter')}
              </span>
              <p className="text-nd-text-disabled text-xs max-w-[220px] font-sans">
                {t('newsletterBlurb')}
              </p>
              <div className="mt-1">
                <FooterNewsletterForm />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase font-mono">
                {t('status')}
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-nd-success" />
                <span className="text-nd-text-secondary text-sm font-mono">
                  {t('allSystemsOperational')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-nd-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-nd-text-disabled text-[11px] tracking-[0.08em] uppercase font-mono">
              &copy; {new Date().getFullYear()} vacamuerta.io
            </span>
            <span className="text-nd-text-disabled text-[11px] tracking-[0.04em] font-mono">
              Made by{' '}
              <a
                href="https://x.com/dylansz_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-nd-text-secondary hover:text-nd-text-display transition-colors"
              >
                @dylansz_
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: -1 }}
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </span>
          </div>
          <span className="text-nd-text-disabled text-[11px] font-sans">
            {t('contactTagline')}{' '}
            <a
              href="mailto:info@vacamuerta.io"
              className="text-nd-text-secondary hover:text-nd-text-display transition-colors"
            >
              info@vacamuerta.io
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
