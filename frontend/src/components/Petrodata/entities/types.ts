// Shared prop contracts for the company / province / trade entity UIs. Server
// pages normalise the (nullable) DTO fields once and pass these clean shapes to
// the reusable client components below.

import type { ReactNode } from 'react'

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** One animated KPI counter. */
export type StatItem = {
  label: string
  value: number
  /** "int" → 1,234 ; "compact" → 1.2K. Default "int". */
  format?: 'int' | 'compact'
}

/** A plottable project point for the auto-fitting EntityMap. */
export type MapPoint = {
  name: string
  lat: number
  lng: number
  color: string
  line1?: string
  line2?: string
}

export type MapLegendItem = { label: string; color: string }

/* ---- Generic sortable table ---- */

export type TableCol = {
  key: string
  label: string
  align?: 'left' | 'right'
  sortable?: boolean
}

export type TableCell = {
  /** Value used for sorting this cell. */
  sort: string | number
  /** Rendered content (dots, links, plain text). */
  node: ReactNode
}

export type TableRow = {
  id: string
  cells: Record<string, TableCell>
}

/** Optional single-select filter rail above a table. */
export type TableFilter = {
  /** Column key whose cell `sort` value the filter matches against. */
  key: string
  allLabel: string
  options: string[]
}

/** A project lifecycle stage for the timeline. */
export type TimelineStage = { stage: string; date: string | null }

/** One commodity bar in a province/company breakdown. */
export type BreakdownItem = { name: string; count: number; color: string }
