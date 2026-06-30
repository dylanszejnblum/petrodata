'use client'

// Generic sortable, optionally-filterable project table with a staggered row
// entrance. Cells carry a `sort` scalar + a rendered `node`; the special column
// key "index" renders the post-sort/filter row number. Used by company &
// province pages.

import { useMemo, useRef, useState, useEffect } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { staggerIn, useInView } from '@/components/Petrodata/uranium/anim'
import { track } from '@/utilities/analytics'
import type { TableCol, TableFilter, TableRow } from './types'

export function SortableProjectsTable({
  columns,
  rows,
  initialSort,
  emptyLabel,
  filter,
  filterAllLabel,
}: {
  columns: TableCol[]
  rows: TableRow[]
  initialSort?: string
  emptyLabel: string
  filter?: TableFilter
  filterAllLabel?: string
}) {
  const firstSortable = columns.find((c) => c.sortable)?.key
  const [sortKey, setSortKey] = useState<string>(initialSort ?? firstSortable ?? columns[0].key)
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [active, setActive] = useState<string>('__all__')

  const { ref, inView } = useInView<HTMLTableSectionElement>()
  const played = useRef(false)

  const filtered = useMemo(() => {
    if (!filter || active === '__all__') return rows
    return rows.filter((r) => String(r.cells[filter.key]?.sort ?? '') === active)
  }, [rows, filter, active])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a.cells[sortKey]?.sort ?? ''
      const bv = b.cells[sortKey]?.sort ?? ''
      let cmp: number
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
      else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, dir])

  useEffect(() => {
    if (!inView || played.current) return
    played.current = true
    const root = ref.current
    if (!root) return
    const trs = root.querySelectorAll<HTMLTableRowElement>('.entity-row')
    if (trs.length) staggerIn(Array.from(trs), { step: 40, y: 12 })
  }, [inView, ref])

  const toggleSort = (key: string) => {
    track('projects_table_sort', { column: key })
    if (key === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('asc')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {filter && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip label={filterAllLabel ?? filter.allLabel} active={active === '__all__'} onClick={() => setActive('__all__')} />
          {filter.options.map((opt) => (
            <FilterChip key={opt} label={opt} active={active === opt} onClick={() => setActive(opt)} />
          ))}
        </div>
      )}

      <div className="overflow-x-auto border border-nd-border bg-nd-surface">
        <table className="w-full text-[12px] font-mono">
          <thead>
            <tr className="bg-nd-surface-raised text-nd-text-secondary text-[10px] uppercase tracking-[0.08em]">
              {columns.map((c) => {
                const isSorted = c.sortable && c.key === sortKey
                return (
                  <th
                    key={c.key}
                    className={`px-5 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                    aria-sort={isSorted ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-[0.08em] transition-colors hover:text-nd-text-display ${
                          c.align === 'right' ? 'flex-row-reverse' : ''
                        } ${isSorted ? 'text-nd-text-display' : ''}`}
                      >
                        {c.label}
                        {isSorted &&
                          (dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody ref={ref} className="divide-y divide-nd-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-nd-text-disabled">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={row.id} className="entity-row">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 ${c.align === 'right' ? 'text-right tabular-nums' : ''} text-nd-text-secondary`}
                    >
                      {c.key === 'index' ? i + 1 : (row.cells[c.key]?.node ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="border px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-mono transition-colors"
      style={{
        borderColor: active ? 'var(--nd-text-display)' : 'var(--nd-border)',
        backgroundColor: active ? 'var(--nd-text-display)' : 'transparent',
        color: active ? 'var(--nd-black)' : 'var(--nd-text-secondary)',
      }}
    >
      {label}
    </button>
  )
}
