'use client'

import { useState } from 'react'
import { cn } from '@/utilities/ui'

// Best-effort logo map for known Argentine oil & gas operators.
// Uses local static assets in /public/logos/ when available.
// Falls back to Google favicons, then first-letter avatar.
const LOGO_FILES: Record<string, string> = {
  ypf: '/logos/ypf.png',
  totalenergies: '/logos/totalenergies.svg',
  'total-austral': '/logos/totalenergies.svg',
  pae: '/logos/pae.png',
  'pan-american-energy': '/logos/pae.png',
  'pan-american': '/logos/pae.png',
  tecpetrol: '/logos/tecpetrol.png',
  pluspetrol: '/logos/pluspetrol.png',
  pampa: '/logos/pampa.png',
  'pampa-energia': '/logos/pampa.png',
  vista: '/logos/vista.png',
  'vista-oil-gas': '/logos/vista.png',
  chevron: '/logos/chevron.png',
  shell: '/logos/shell.png',
  'shell-argentina': '/logos/shell.png',
  qatarenergy: '/logos/qatarenergy.png',
  qp: '/logos/qatarenergy.png',
  equinor: '/logos/equinor.svg',
  petrobras: '/logos/petrobras.png',
}

// Google favicon fallback domains for operators without local assets
const FAVICON_DOMAINS: Record<string, string> = {
  exxonmobil: 'corporate.exxonmobil.com',
  'exxon-mobil': 'corporate.exxonmobil.com',
  capex: 'capex.com.ar',
  pcr: 'pcr.com.ar',
  cgc: 'cgc.com.ar',
  'compania-general-de-combustibles': 'cgc.com.ar',
  enap: 'enap.cl',
  'enap-sipetrol': 'enap.cl',
  'phoenix-global-resources': 'phoenix.com.ar',
  phoenix: 'phoenix.com.ar',
  oilstone: 'oilstone.com.ar',
  petrolera: 'aconcaguaenergia.com',
  aconcagua: 'aconcaguaenergia.com',
  'petrolera-aconcagua': 'aconcaguaenergia.com',
  bp: 'bp.com',
  wintershall: 'wintershalldea.com',
  'crown-point': 'crownpoint.com.ar',
  crown_point: 'crownpoint.com.ar',
}

function buildLogoUrl(slug: string): string | null {
  const key = slug.toLowerCase()
  // 1. Local static asset (high quality)
  if (LOGO_FILES[key]) return LOGO_FILES[key]
  // 2. Google favicon as fallback
  const domain = FAVICON_DOMAINS[key]
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null
}

function initials(name: string): string {
  const cleaned = name.replace(/\bS\.?A\.?\b/gi, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const sizeMap = {
  sm: { box: 'h-5 w-5', text: 'text-[9px]' },
  md: { box: 'h-7 w-7', text: 'text-[10px]' },
  lg: { box: 'h-9 w-9', text: 'text-[11px]' },
}

export function OperatorAvatar({
  slug,
  name,
  size = 'md',
  className,
}: {
  slug: string
  name: string
  size?: keyof typeof sizeMap
  className?: string
}) {
  const logoUrl = buildLogoUrl(slug)
  const [errored, setErrored] = useState(false)
  const { box, text } = sizeMap[size]

  if (logoUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={cn(box, 'rounded-full bg-nd-surface-raised object-contain', className)}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
      />
    )
  }

  return (
    <span
      aria-label={name}
      className={cn(
        box,
        'inline-flex items-center justify-center rounded-full border border-nd-border bg-nd-surface-raised tabular-nums',
        text,
        className,
      )}
      style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-text-display)' }}
    >
      {initials(name)}
    </span>
  )
}
