'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useTheme } from '../../providers/Theme'
import { LanguageSwitcher } from './LanguageSwitcher'

type NavItem = {
  href?: '/' | '/map' | '/companies' | '/provincias' | '/noticias' | '/indicadores'
  labelKey:
    | 'dashboard'
    | 'oilGas'
    | 'companies'
    | 'provinces'
    | 'news'
    | 'indicators'
  shortLabelKey: NavItem['labelKey']
  match?: (pathname: string) => boolean
  comingSoon?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    labelKey: 'dashboard',
    shortLabelKey: 'dashboard',
    match: (p) => p === '/',
  },
  {
    href: '/map',
    labelKey: 'oilGas',
    shortLabelKey: 'oilGas',
    match: (p) => p === '/map' || p.startsWith('/map/'),
  },
  {
    href: '/companies',
    labelKey: 'companies',
    shortLabelKey: 'companies',
    match: (p) => p === '/companies' || p.startsWith('/companies/'),
  },
  {
    href: '/provincias',
    labelKey: 'provinces',
    shortLabelKey: 'provinces',
    match: (p) => p === '/provincias' || p.startsWith('/provincias/'),
  },
  {
    href: '/noticias',
    labelKey: 'news',
    shortLabelKey: 'news',
    match: (p) => p === '/noticias' || p.startsWith('/noticias/'),
  },
  {
    href: '/indicadores',
    labelKey: 'indicators',
    shortLabelKey: 'indicators',
    match: (p) => p === '/indicadores' || p.startsWith('/indicadores/'),
  },
]

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function NothingHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const resolvedTheme = mounted ? theme : undefined
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const t = useTranslations('nav')
  const themeToggleLabel = t('switchTheme')

  return (
    <header
      className="w-full border-b border-nd-border"
      style={{
        animation: 'header-slide 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes header-slide {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes header-nav-item {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobile-menu-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes mobile-menu-overlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mobile-nav-item {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <span className="text-nd-text-display font-sans text-lg tracking-tight">
              vacamuerta<span style={{ color: 'var(--nd-success)' }}>.io</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setTheme(nextTheme)}
              className="text-nd-text-secondary hover:text-nd-text-display transition-colors p-1"
              aria-label={themeToggleLabel}
            >
              {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 text-nd-text-secondary transition-colors hover:text-nd-text-display md:hidden"
              aria-label={t('openMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        <nav className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-2">
          {NAV_ITEMS.map((item, i) => {
            const animation = `header-nav-item 400ms cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 80}ms both`
            if (item.comingSoon) {
              return (
                <span
                  key={item.labelKey}
                  className="relative inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] uppercase text-nd-text-disabled cursor-default"
                  style={{ animation }}
                >
                  {t(item.shortLabelKey)}
                  <span className="rounded-full border border-nd-border bg-nd-surface-raised px-1.5 py-px text-[9px] tracking-[0.04em] text-nd-text-secondary normal-case">
                    {t('comingSoon')}
                  </span>
                </span>
              )
            }
            const isActive = item.match?.(pathname) ?? false
            return (
              <Link
                key={item.labelKey}
                href={item.href!}
                className="relative font-mono text-[11px] tracking-[0.08em] uppercase transition-colors"
                style={{
                  color: isActive ? 'var(--nd-text-display)' : 'var(--nd-text-disabled)',
                  animation,
                }}
              >
                {t(item.shortLabelKey)}
                {isActive && (
                  <span className="absolute -bottom-4 left-0 h-px w-full bg-nd-accent" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] md:hidden"
            style={{ animation: 'mobile-menu-overlay 250ms ease-out both' }}
          >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="mobile-nav"
            className="absolute right-0 top-0 flex h-dvh w-[min(22rem,88vw)] flex-col border-l border-nd-border bg-nd-surface"
            aria-label="Mobile navigation"
            style={{ animation: 'mobile-menu-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            <div className="flex items-center justify-between border-b border-nd-border px-5 py-4">
              <span className="text-sm uppercase text-nd-text-secondary font-mono">
                {t('menu')}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-nd-text-secondary transition-colors hover:text-nd-text-display"
                aria-label={t('closeMenu')}
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex flex-1 flex-col px-5 py-5">
              {NAV_ITEMS.map((item) => {
                const labelKey = `${item.labelKey}Full` as
                  | 'dashboardFull'
                  | 'oilGasFull'
                  | 'companiesFull'
                  | 'provincesFull'
                  | 'newsFull'
                  | 'indicatorsFull'
                if (item.comingSoon) {
                  return (
                    <span
                      key={item.labelKey}
                      className="flex items-center justify-between gap-2 border-b border-nd-border py-4 text-sm uppercase font-mono text-nd-text-disabled"
                    >
                      {t(labelKey)}
                      <span className="rounded-full border border-nd-border bg-nd-surface-raised px-1.5 py-px text-[9px] tracking-[0.04em] text-nd-text-secondary normal-case">
                        {t('comingSoon')}
                      </span>
                    </span>
                  )
                }
                const isActive = item.match?.(pathname) ?? false
                return (
                  <Link
                    key={item.labelKey}
                    href={item.href!}
                    className="border-b border-nd-border py-4 text-sm uppercase font-mono"
                    style={{
                      color: isActive ? 'var(--nd-text-display)' : 'var(--nd-text-secondary)',
                    }}
                  >
                    {t(labelKey)}
                  </Link>
                )
              })}
            </nav>
          </aside>
          </div>,
          document.body,
        )}
    </header>
  )
}
