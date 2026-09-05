'use client'

import { useMemo, useState } from 'react'
import { EmptyState } from './empty-state'

/* DataTable — colapsa las 6 tablas de producción. Contrato de sort de
   SortableProjectsTable + a11y de UraniumProjectsTable + colapso responsive
   de ProjectsTable (priority 1 siempre visible; 2-3 se apilan, nunca se
   ocultan sin alternativa). */

export type Column<Row> = {
  key: string
  header: React.ReactNode
  cell: (row: Row) => React.ReactNode
  sort?: (row: Row) => number | string
  align?: 'left' | 'right'
  numeric?: boolean
  priority?: 1 | 2 | 3
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  defaultSort,
  caption,
  empty,
}: {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  caption: string
  empty?: React.ReactNode
}) {
  const [sort, setSort] = useState(defaultSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sort) return rows
    const get = col.sort
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es', { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const toggle = (key: string) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  if (rows.length === 0) return <>{empty ?? <EmptyState kind="empty" />}</>

  return (
    <div tabIndex={0} role="group" aria-label={caption} className="overflow-x-auto rounded-[10px] border bg-surface">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-raised">
            {columns.map((col) => {
              const active = sort?.key === col.key
              const ariaSort = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`px-5 py-2.5 type-label whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {col.sort ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-primary ${active ? 'text-primary' : ''}`}
                    >
                      {col.header}
                      <span aria-hidden className="tnums">{active ? (sort!.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-raised/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'px-5 py-3',
                    col.align === 'right' ? 'text-right' : 'text-left',
                    col.numeric ? 'tnums' : '',
                  ].join(' ')}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
