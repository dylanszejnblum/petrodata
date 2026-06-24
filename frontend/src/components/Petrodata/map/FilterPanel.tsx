'use client'

import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OverlayCard, OverlayLabel } from './OverlayCard'

export type WellType = 'oil' | 'gas' | null

export type WellFilters = {
  formation: string | null
  operator: string | null
  basin: string | null
  province: string | null
  status: string | null
  wellType: WellType
  hideAbandoned: boolean
}

export const DEFAULT_FILTERS: WellFilters = {
  formation: null,
  operator: null,
  basin: null,
  province: null,
  status: null,
  wellType: null,
  hideAbandoned: true,
}

const ANY = '__any__'

export type FilterOption = { value: string; label: string }

export const FORMATION_OPTIONS: FilterOption[] = [
  { value: 'vaca_muerta', label: 'Vaca Muerta' },
  { value: 'grupo_chubut', label: 'Grupo Chubut' },
  { value: 'huitr_n', label: 'Huitrín' },
  { value: 'mulichinco', label: 'Mulichinco' },
  { value: 'quintuco', label: 'Quintuco' },
  { value: 'lajas', label: 'Lajas' },
]

export const BASIN_OPTIONS: FilterOption[] = [
  { value: 'NOROESTE', label: 'Noroeste' },
  { value: 'NEUQUINA', label: 'Neuquina' },
  { value: 'CUYANA', label: 'Cuyana' },
  { value: 'GOLFO SAN JORGE', label: 'Golfo San Jorge' },
  { value: 'AUSTRAL', label: 'Austral' },
]

// The `value` must stay as the raw SEN status string (it's matched against the
// API `status_code`); only the visible label is localized, via `statusOptions.*`.
export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'En Producción Efectiva', label: 'En Producción Efectiva' },
  { value: 'Parado Transitoriamente', label: 'Parado Transitoriamente' },
  { value: 'En Estudio', label: 'En Estudio' },
  { value: 'En Espera de Abandono', label: 'En Espera de Abandono' },
  { value: 'Abandono Definitivo', label: 'Abandono Definitivo' },
  { value: 'Pozo Inyector', label: 'Pozo Inyector' },
]

const STATUS_OPTION_KEY: Record<string, string> = {
  'En Producción Efectiva': 'producing',
  'Parado Transitoriamente': 'stopped',
  'En Estudio': 'study',
  'En Espera de Abandono': 'awaitingAbandonment',
  'Abandono Definitivo': 'abandoned',
  'Pozo Inyector': 'injector',
}

export const PROVINCE_OPTIONS: FilterOption[] = [
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'Salta', label: 'Salta' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Tucumán', label: 'Tucumán' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
]

export function FilterPanel({
  filters,
  setFilters,
  operatorOptions,
  resultCount,
  rawCount,
  resultCap,
  loading,
}: {
  filters: WellFilters
  setFilters: (next: WellFilters) => void
  operatorOptions: FilterOption[]
  resultCount: number
  rawCount: number
  resultCap: number
  loading: boolean
}) {
  const t = useTranslations('mapPage.filters')
  const anyLabel = t('any')
  // Localize the status labels while keeping each `value` as the raw API string.
  const statusOptions = STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`statusOptions.${STATUS_OPTION_KEY[o.value]}`),
  }))
  const update = (key: keyof WellFilters, value: string) => {
    setFilters({ ...filters, [key]: value === ANY ? null : value })
  }
  const setWellType = (next: WellType) => setFilters({ ...filters, wellType: next })
  const toggleHideAbandoned = () =>
    setFilters({ ...filters, hideAbandoned: !filters.hideAbandoned })
  const reset = () => setFilters(DEFAULT_FILTERS)
  const isCapped = rawCount >= resultCap

  return (
    <OverlayCard className="w-full rounded-none">
      <div className="flex items-center justify-between border-b border-nd-border px-5 py-3">
        <OverlayLabel>{t('title')}</OverlayLabel>
        <button
          type="button"
          onClick={reset}
          className="text-nd-text-secondary text-[10px] uppercase tracking-[0.08em] hover:text-nd-text-display transition-colors font-mono"
        >
          {t('reset')}
        </button>
      </div>
      <div className="grid gap-3 px-5 py-4">
        <div className="grid gap-1.5">
          <OverlayLabel>{t('resource')}</OverlayLabel>
          <Segmented
            value={filters.wellType}
            onChange={setWellType}
            options={[
              { value: null, label: t('resourceAll') },
              { value: 'oil', label: t('resourceOil') },
              { value: 'gas', label: t('resourceGas') },
            ]}
          />
        </div>
        <FilterRow
          label={t('formation')}
          value={filters.formation}
          options={FORMATION_OPTIONS}
          anyLabel={anyLabel}
          onChange={(v) => update('formation', v)}
        />
        <FilterRow
          label={t('operator')}
          value={filters.operator}
          options={operatorOptions}
          anyLabel={anyLabel}
          onChange={(v) => update('operator', v)}
        />
        <FilterRow
          label={t('basin')}
          value={filters.basin}
          options={BASIN_OPTIONS}
          anyLabel={anyLabel}
          onChange={(v) => update('basin', v)}
        />
        <FilterRow
          label={t('province')}
          value={filters.province}
          options={PROVINCE_OPTIONS}
          anyLabel={anyLabel}
          onChange={(v) => update('province', v)}
        />
        <FilterRow
          label={t('status')}
          value={filters.status}
          options={statusOptions}
          anyLabel={anyLabel}
          onChange={(v) => update('status', v)}
        />
        <label className="flex items-center justify-between gap-3 pt-1">
          <span
            className="text-nd-text-secondary text-[11px] font-mono"
          >
            {t('hideAbandoned')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.hideAbandoned}
            onClick={toggleHideAbandoned}
            className="relative h-5 w-9 rounded-full border border-nd-border transition-colors"
            style={{
              backgroundColor: filters.hideAbandoned
                ? 'var(--nd-success)'
                : 'var(--nd-surface-raised)',
            }}
          >
            <span
              className="absolute top-1/2 -translate-y-1/2 block size-3.5 rounded-full bg-nd-text-display transition-all"
              style={{ left: filters.hideAbandoned ? 'calc(100% - 18px)' : '2px' }}
            />
          </button>
        </label>
      </div>
      <div className="flex items-center justify-between border-t border-nd-border px-5 py-3">
        <span
          className="text-nd-text-secondary text-[11px] tabular-nums font-mono"
        >
          {t('wellsCount', { count: resultCount.toLocaleString('en-US') })}
          {isCapped && (
            <span className="text-nd-warning ml-1.5 uppercase text-[10px]">· {t('capped')}</span>
          )}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] font-mono"
        >
          {loading ? t('loading') : t('live')}
        </span>
      </div>
    </OverlayCard>
  )
}

function Segmented<T extends string | null>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr border border-nd-border bg-nd-surface-raised">
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className="h-8 text-[11px] uppercase tracking-[0.08em] transition-colors font-mono"
            style={{
              backgroundColor: isActive ? 'var(--nd-success)' : 'transparent',
              color: isActive ? 'var(--nd-black)' : 'var(--nd-text-secondary)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function FilterRow({
  label,
  value,
  options,
  anyLabel,
  onChange,
}: {
  label: string
  value: string | null
  options: FilterOption[]
  anyLabel: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <OverlayLabel>{label}</OverlayLabel>
      <Select value={value ?? ANY} onValueChange={onChange}>
        <SelectTrigger
          className="h-9 rounded-none border-nd-border bg-nd-surface-raised text-nd-text-display font-mono"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none border-nd-border bg-nd-surface">
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
