'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { NewsFacets } from '@/api/news'

type ChipGroupProps = {
  label: string
  param: string
  active: string | null
  options: { value: string; count: number }[]
  onToggle: (param: string, value: string) => void
}

function ChipGroup({ label, param, active, options, onToggle }: ChipGroupProps) {
  if (!options.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {label}
      </span>
      {options.map((o) => {
        const isActive = active === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(param, o.value)}
            aria-pressed={isActive}
            className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors"
            style={{
              borderColor: isActive ? 'var(--nd-accent)' : 'var(--nd-border)',
              color: isActive ? 'var(--nd-accent)' : 'var(--nd-text-secondary)',
              background: isActive ? 'color-mix(in srgb, var(--nd-accent) 12%, transparent)' : 'transparent',
            }}
          >
            {o.value}
            <span className="ml-1 text-nd-text-disabled">{o.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function NewsFilters({ facets }: { facets: NewsFacets }) {
  const t = useTranslations('noticias')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const get = useCallback((k: string) => searchParams.get(k), [searchParams])

  // Recent is the default (no `sort` param); importance is the explicit opt-in.
  const sort = get('sort') === 'importance' ? 'importance' : 'recent'

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      mutate(params)
      params.delete('page') // any filter change resets pagination
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const toggle = useCallback(
    (param: string, value: string) => {
      pushParams((p) => {
        if (p.get(param) === value) p.delete(param)
        else p.set(param, value)
      })
    },
    [pushParams],
  )

  const setSort = useCallback(
    (value: 'importance' | 'recent') => {
      pushParams((p) => {
        if (value === 'recent') p.delete('sort')
        else p.set('sort', value)
      })
    },
    [pushParams],
  )

  const clearAll = useCallback(() => {
    router.push(pathname)
    setOpen(false)
  }, [pathname, router])

  const activeCount = useMemo(
    () => ['family', 'topic', 'entity', 'region'].filter((k) => get(k)).length,
    [get],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filters dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          className="inline-flex items-center gap-2 border border-nd-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-nd-text-secondary transition-colors hover:text-nd-text-display"
        >
          {t('filtersButton')}
          {activeCount ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--nd-accent)_15%,transparent)] px-1.5 text-nd-accent">
              {activeCount}
            </span>
          ) : null}
          <span aria-hidden className="text-nd-text-disabled">
            ▾
          </span>
        </button>

        {open ? (
          <div className="absolute left-0 z-20 mt-1 flex w-[min(90vw,340px)] flex-col gap-3 border border-nd-border bg-nd-surface p-4 shadow-lg">
            <ChipGroup label={t('filterFamily')} param="family" active={get('family')} options={facets.families} onToggle={toggle} />
            <ChipGroup label={t('filterTopic')} param="topic" active={get('topic')} options={facets.topics.slice(0, 14)} onToggle={toggle} />
            <ChipGroup label={t('filterRegion')} param="region" active={get('region')} options={facets.regions} onToggle={toggle} />
            <ChipGroup label={t('filterEntity')} param="entity" active={get('entity')} options={facets.entities.slice(0, 14)} onToggle={toggle} />
            {activeCount ? (
              <button
                type="button"
                onClick={clearAll}
                className="self-start font-mono text-[11px] uppercase tracking-[0.06em] text-nd-text-disabled transition-colors hover:text-nd-text-display"
              >
                {t('clearFilters')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Sort toggle */}
      <div className="inline-flex border border-nd-border" role="group" aria-label={t('sortLabel')}>
        {(['importance', 'recent'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSort(value)}
            aria-pressed={sort === value}
            className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors"
            style={{
              color: sort === value ? 'var(--nd-text-display)' : 'var(--nd-text-disabled)',
              background: sort === value ? 'var(--nd-surface-raised)' : 'transparent',
            }}
          >
            {value === 'importance' ? t('sortImportance') : t('sortRecent')}
          </button>
        ))}
      </div>
    </div>
  )
}
