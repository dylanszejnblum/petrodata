'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useTheme } from '../../providers/Theme'
import { LanguageSwitcher } from './LanguageSwitcher'

type NavItem = {
  href: '/' | '/map' | '/minerals' | '/minerals/uranium' | '/research'
  labelKey:
    | 'dashboard'
    | 'oilGas'
    | 'minerals'
    | 'uranium'
    | 'research'
  shortLabelKey: NavItem['labelKey']
  match: (pathname: string) => boolean
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
    href: '/minerals',
    labelKey: 'minerals',
    shortLabelKey: 'minerals',
    match: (p) =>
      (p === '/minerals' || p.startsWith('/minerals/')) && !p.startsWith('/minerals/uranium'),
  },
  {
    href: '/minerals/uranium',
    labelKey: 'uranium',
    shortLabelKey: 'uranium',
    match: (p) => p === '/minerals/uranium' || p.startsWith('/minerals/uranium/'),
  },
  {
    href: '/research',
    labelKey: 'research',
    shortLabelKey: 'research',
    match: (p) => p === '/research' || p.startsWith('/research/'),
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

function NonUsdMark({ small = false }: { small?: boolean }) {
  const strokeWidth = small ? 1.7 : 1.9

  return (
    <div
      className="relative flex items-center justify-center rounded-full border border-nd-border-visible bg-nd-surface-raised"
      style={{
        width: small ? '1.5rem' : '2rem',
        height: small ? '1.5rem' : '2rem',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute rounded-full border border-nd-border"
        style={{
          inset: small ? '0.18rem' : '0.22rem',
        }}
      />
      <svg
        aria-hidden="true"
        className="text-nd-text-display"
        viewBox="0 0 24 24"
        style={{
          width: small ? '0.95rem' : '1.05rem',
          height: small ? '0.95rem' : '1.05rem',
        }}
      >
        <path
          d="M14.8 7.2c-.7-.8-1.8-1.2-3.1-1.2-2.3 0-3.8 1.1-3.8 2.9 0 4.3 7.1 1.8 7.1 5.3 0 1.4-1.2 2.4-3.2 2.4-1.5 0-2.8-.5-3.9-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <path
          d="M12 4.8v14.4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      <span
        className="absolute bg-nd-text-display"
        style={{
          width: small ? '0.9rem' : '1.1rem',
          height: small ? '1.5px' : '2px',
          transform: 'rotate(-34deg)',
          borderRadius: '999px',
        }}
      />
      <span
        className="absolute rounded-full bg-nd-accent"
        style={{
          width: small ? '0.16rem' : '0.18rem',
          height: small ? '0.16rem' : '0.18rem',
          right: small ? '0.22rem' : '0.28rem',
          top: small ? '0.26rem' : '0.3rem',
        }}
      />
    </div>
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
          <Link href="/" className="flex items-center gap-3">
            <NonUsdMark />
            <span
              className="text-nd-text-display font-sans text-lg tracking-tight"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              petrodata
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

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative font-mono text-[11px] tracking-[0.08em] uppercase transition-colors"
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  color: isActive ? 'var(--nd-text-display)' : 'var(--nd-text-disabled)',
                  animation: `header-nav-item 400ms cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 80}ms both`,
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

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
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
              <span
                className="text-sm uppercase text-nd-text-secondary"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
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
                  | 'mineralsFull'
                  | 'uraniumFull'
                  | 'researchFull'
                const isActive = item.match(pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-b border-nd-border py-4 text-sm uppercase"
                    style={{
                      fontFamily: 'var(--font-space-mono)',
                      color: isActive ? 'var(--nd-text-display)' : 'var(--nd-text-secondary)',
                    }}
                  >
                    {t(labelKey)}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </header>
  )
}
