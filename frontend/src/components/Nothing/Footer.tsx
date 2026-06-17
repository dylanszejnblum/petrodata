'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import React from 'react'
import { FooterNewsletterForm } from './FooterNewsletterForm'

function NonUsdMark() {
  return (
    <div
      className="relative flex size-6 items-center justify-center rounded-full border border-nd-border-visible bg-nd-surface-raised"
      aria-hidden="true"
    >
      <div className="absolute inset-[0.18rem] rounded-full border border-nd-border" />
      <svg
        aria-hidden="true"
        className="text-nd-text-display"
        viewBox="0 0 24 24"
        style={{
          width: '0.95rem',
          height: '0.95rem',
        }}
      >
        <path
          d="M14.8 7.2c-.7-.8-1.8-1.2-3.1-1.2-2.3 0-3.8 1.1-3.8 2.9 0 4.3 7.1 1.8 7.1 5.3 0 1.4-1.2 2.4-3.2 2.4-1.5 0-2.8-.5-3.9-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="M12 4.8v14.4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
      <span
        className="absolute w-4 rounded-full bg-nd-text-display"
        style={{ transform: 'rotate(-34deg)', height: '1.5px' }}
      />
      <span
        className="absolute size-[0.16rem] rounded-full bg-nd-accent"
        style={{ right: '0.22rem', top: '0.26rem' }}
      />
    </div>
  )
}

export function NothingFooter() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  return (
    <footer className="border-t border-nd-border">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3">
              <NonUsdMark />
              <span className="text-nd-text-display text-sm tracking-tight font-sans">
                vacamuerta<span style={{ color: 'var(--nd-success)' }}>.io</span>
              </span>
            </Link>
            <p className="text-nd-text-disabled text-xs max-w-xs font-sans">
              {t('tagline')}
            </p>
          </div>

          <div className="flex gap-16">
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
          <div className="flex items-center gap-4">
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
