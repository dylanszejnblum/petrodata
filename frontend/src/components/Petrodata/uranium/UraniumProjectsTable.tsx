'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { staggerIn, useInView } from './anim'
import { URANIUM, uraniumStatusColor } from './theme'
import type { ProjectPoint } from './types'
import { CompanyLink } from '@/components/Petrodata/entities/CompanyLink'

type SortKey = 'project' | 'province' | 'status' | 'company' | 'origin'
type SortState = { key: SortKey; dir: 'asc' | 'desc' }

const ALL = '__all__'

function fieldFor(p: ProjectPoint, key: SortKey): string {
  switch (key) {
    case 'project':
      return p.name
    case 'province':
      return p.province
    case 'status':
      return p.statusLabel
    case 'company':
      return p.company
    case 'origin':
      return p.origin
  }
}

export function UraniumProjectsTable({ projects }: { projects: ProjectPoint[] }) {
  const t = useTranslations('uraniumHub')
  const [sort, setSort] = useState<SortState>({ key: 'project', dir: 'asc' })
  const [statusFilter, setStatusFilter] = useState<string>(ALL)

  const { ref: inViewRef, inView } = useInView<HTMLTableSectionElement>()
  const animatedRef = useRef(false)

  // Run the staggered entrance exactly once, the first time the tbody enters
  // the viewport. Re-running on sort/filter would re-fade rows, so guard it.
  if (inView && !animatedRef.current && inViewRef.current) {
    animatedRef.current = true
    staggerIn(Array.from(inViewRef.current.querySelectorAll('.uranium-row')), { step: 50 })
  }

  const statusOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const p of projects) {
      if (p.statusLabel && !seen.has(p.statusLabel)) {
        seen.add(p.statusLabel)
        out.push(p.statusLabel)
      }
    }
    return out
  }, [projects])

  const rows = useMemo(() => {
    const filtered =
      statusFilter === ALL ? projects : projects.filter((p) => p.statusLabel === statusFilter)
    const sorted = [...filtered].sort((a, b) => {
      const cmp = fieldFor(a, sort.key).localeCompare(fieldFor(b, sort.key), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [projects, statusFilter, sort])

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  const columns = {
    index: t('table.columns.index'),
    project: t('table.columns.project'),
    province: t('table.columns.province'),
    status: t('table.columns.status'),
    company: t('table.columns.company'),
    origin: t('table.columns.origin'),
  }

  const sortableCols: { key: SortKey; label: string }[] = [
    { key: 'project', label: columns.project },
    { key: 'province', label: columns.province },
    { key: 'status', label: columns.status },
    { key: 'company', label: columns.company },
    { key: 'origin', label: columns.origin },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
          {columns.status}
        </span>
        <div className="flex flex-wrap gap-px bg-nd-border border border-nd-border">
          <FilterButton
            active={statusFilter === ALL}
            onClick={() => setStatusFilter(ALL)}
            label={t('table.filterAll')}
          />
          {statusOptions.map((opt) => (
            <FilterButton
              key={opt}
              active={statusFilter === opt}
              onClick={() => setStatusFilter(opt)}
              label={opt}
            />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-nd-border bg-nd-surface">
        <table className="w-full text-[12px] font-mono">
          <thead>
            <tr className="bg-nd-surface-raised text-nd-text-secondary text-[10px] uppercase tracking-[0.08em]">
              <th scope="col" className="px-5 py-3 text-left font-normal w-px whitespace-nowrap">
                {columns.index}
              </th>
              {sortableCols.map((col) => {
                const isActive = sort.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-5 py-3 text-left font-normal"
                    aria-sort={isActive ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em] text-nd-text-secondary transition-colors hover:text-nd-text-display"
                    >
                      <span>{col.label}</span>
                      <span aria-hidden className="text-nd-text-disabled">
                        {isActive ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody ref={inViewRef} className="divide-y divide-nd-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-nd-text-disabled font-sans"
                >
                  {t('table.noResults')}
                </td>
              </tr>
            ) : (
              rows.map((p, i) => (
                <tr key={`${p.name}-${i}`} className="uranium-row">
                  <td className="px-5 py-3 text-nd-text-disabled tabular-nums whitespace-nowrap">
                    {i + 1}
                  </td>
                  <td className="px-5 py-3 text-nd-text-display">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="inline-block size-2 shrink-0"
                        style={{ backgroundColor: URANIUM.teal }}
                        aria-hidden
                      />
                      <span>{p.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-nd-text-secondary">{p.province || '—'}</td>
                  <td className="px-5 py-3 text-nd-text-secondary">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="inline-block size-2 shrink-0"
                        style={{ backgroundColor: uraniumStatusColor(p.statusCode || p.statusLabel) }}
                        aria-hidden
                      />
                      <span>{p.statusLabel || '—'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-nd-text-secondary">
                    <CompanyLink name={p.company} />
                  </td>
                  <td className="px-5 py-3 text-nd-text-secondary">{p.origin || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] font-mono transition-colors ${
        active
          ? 'bg-nd-surface-raised text-nd-text-display'
          : 'bg-nd-surface text-nd-text-disabled hover:text-nd-text-secondary'
      }`}
      style={active ? { borderBottom: `1px solid ${URANIUM.teal}` } : undefined}
    >
      {label}
    </button>
  )
}
