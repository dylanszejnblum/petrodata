'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api, type ApiSchemas } from '@/api/client'
import { formatCompact, formatMonth } from '@/utilities/formatNumber'
import { OperatorAvatar } from './OperatorAvatar'

type WellProps = ApiSchemas['GeoWellPropertiesDto']
type WellDetail = ApiSchemas['WellDetailDto']

// Module-level cache so popup re-opens for the same well are instant.
const wellDetailCache = new Map<string, WellDetail>()

function useWellDetail(wellId: string): { detail: WellDetail | null; loading: boolean } {
  const [detail, setDetail] = useState<WellDetail | null>(
    () => wellDetailCache.get(wellId) ?? null,
  )
  const [loading, setLoading] = useState<boolean>(() => !wellDetailCache.has(wellId))

  useEffect(() => {
    const cached = wellDetailCache.get(wellId)
    if (cached) {
      setDetail(cached)
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    setLoading(true)
    setDetail(null)
    ;(async () => {
      try {
        const { data, error } = await api.GET('/api/v1/wells/{id}', {
          params: { path: { id: wellId } },
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        if (!error && data) {
          wellDetailCache.set(wellId, data.data)
          setDetail(data.data)
        }
      } catch {
        // aborted or network — popup keeps showing whatever it has
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [wellId])

  return { detail, loading }
}

type StatusKind = 'active' | 'injector' | 'stopped' | 'study' | 'abandoned' | 'unknown'

const STATUS_LABEL_KEYS: Record<StatusKind, 'active' | 'injector' | 'stopped' | 'underStudy' | 'abandoned' | 'unknown'> = {
  active: 'active',
  injector: 'injector',
  stopped: 'stopped',
  study: 'underStudy',
  abandoned: 'abandoned',
  unknown: 'unknown',
}

function classifyStatus(status: string | null | undefined): StatusKind {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s.includes('producción efectiva') || s.includes('produccion efectiva')) return 'active'
  if (s.includes('inyector')) return 'injector'
  if (s.includes('parado') || s.includes('transitorio')) return 'stopped'
  if (s.includes('estudio')) return 'study'
  if (/abandon/i.test(s)) return 'abandoned'
  return 'unknown'
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = useTranslations('wellPopup.status')
  const kind = classifyStatus(status)
  // For "unknown" with a non-null status, show the raw API string so the user
  // still sees the SEN classification rather than just "Unknown".
  const label = kind === 'unknown' && status ? status : t(STATUS_LABEL_KEYS[kind])
  const palette: Record<StatusKind, { bg: string; fg: string; ring: string }> = {
    active: { bg: 'var(--nd-success)', fg: 'var(--nd-black)', ring: 'transparent' },
    injector: { bg: 'var(--nd-accent)', fg: 'var(--nd-black)', ring: 'transparent' },
    stopped: { bg: 'var(--nd-warning)', fg: 'var(--nd-black)', ring: 'transparent' },
    study: { bg: 'transparent', fg: 'var(--nd-text-secondary)', ring: 'var(--nd-border)' },
    abandoned: {
      bg: 'transparent',
      fg: 'var(--nd-text-disabled)',
      ring: 'var(--nd-border)',
    },
    unknown: { bg: 'transparent', fg: 'var(--nd-text-disabled)', ring: 'var(--nd-border)' },
  }
  const p = palette[kind]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] uppercase"
      style={{
        fontFamily: 'var(--font-space-mono)',
        backgroundColor: p.bg,
        color: p.fg,
        boxShadow: p.ring === 'transparent' ? undefined : `inset 0 0 0 1px ${p.ring}`,
      }}
    >
      {label}
    </span>
  )
}

function ResourceChip({ wellType }: { wellType: string | null | undefined }) {
  const t = useTranslations('wellPopup.resource')
  if (!wellType) return null
  const s = wellType.toLowerCase()
  const isOil = s.includes('petrolífero') || s.includes('petrolifero')
  const isGas = s.includes('gasífero') || s.includes('gasifero')
  const label = isOil ? t('oil') : isGas ? t('gas') : wellType
  const dotColor = isOil ? 'var(--nd-success)' : isGas ? 'var(--nd-accent)' : 'var(--nd-text-disabled)'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-nd-border px-2 py-0.5 text-[10px] uppercase"
      style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-text-secondary)' }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  )
}

function VmBadge() {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] uppercase"
      style={{
        fontFamily: 'var(--font-space-mono)',
        backgroundColor: 'var(--nd-success)',
        color: 'var(--nd-black)',
      }}
    >
      VM
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <>
      <dt className="text-nd-text-disabled uppercase">{label}</dt>
      <dd className="text-nd-text-secondary">{value}</dd>
    </>
  )
}

export function WellPopup({ well }: { well: WellProps }) {
  const t = useTranslations('wellPopup')
  const { detail, loading } = useWellDetail(well.well_id)
  const isVm =
    well.formation_slug === 'vaca_muerta' || detail?.latest_production?.vm_combined === true

  const latest = detail?.latest_production ?? null
  const depthM = well.depth_m as unknown as number | null

  return (
    <div className="flex w-[20rem] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-nd-border px-4 pt-4 pb-3">
        <OperatorAvatar slug={well.operator_slug} name={well.operator_name} size="lg" />
        <div className="min-w-0 flex-1">
          <span
            className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {t('wellPrefix')} · {well.well_id}
          </span>
          <span
            className="mt-0.5 text-nd-text-display text-base leading-tight block truncate"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
            title={well.sigla}
          >
            {well.sigla}
          </span>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-nd-border px-4 py-2.5">
        <StatusBadge status={well.status_code} />
        <ResourceChip wellType={well.well_type} />
        {isVm && <VmBadge />}
      </div>

      {/* Latest production */}
      <div className="border-b border-nd-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span
            className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {t('latest')} · {latest ? formatMonth(latest.date_month) : loading ? '…' : t('noData')}
          </span>
          {loading && (
            <span
              className="text-nd-text-disabled text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('loading')}
            </span>
          )}
        </div>
        {latest ? (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <ProductionTile
              label={t('tiles.oil')}
              value={formatCompact(latest.oil_bbl_d)}
              unit="bbl/d"
            />
            <ProductionTile
              label={t('tiles.gas')}
              value={formatCompact(latest.gas_mmcf_d)}
              unit="MMcf/d"
            />
            <ProductionTile
              label={t('tiles.boe')}
              value={formatCompact(latest.boe)}
              unit=""
            />
          </div>
        ) : (
          <p
            className="mt-2 text-nd-text-disabled text-[11px]"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {loading ? t('fetchingProduction') : t('noProduction')}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <dl
        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 py-3 text-[11px]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        <MetaRow label={t('fields.operator')} value={well.operator_name} />
        <MetaRow label={t('fields.basin')} value={well.basin} />
        <MetaRow label={t('fields.province')} value={well.province} />
        <MetaRow label={t('fields.formation')} value={well.formation_slug} />
        <MetaRow label={t('fields.yacimiento')} value={well.yacimiento} />
        <MetaRow label={t('fields.concession')} value={well.concession} />
        {depthM != null && (
          <MetaRow
            label={t('fields.depth')}
            value={`${depthM.toLocaleString('en-US')} m`}
          />
        )}
      </dl>

      {/* Footer */}
      <div
        className="border-t border-nd-border px-4 py-2 text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {t('source')}
      </div>
    </div>
  )
}

function ProductionTile({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="border border-nd-border bg-nd-surface-raised px-2 py-2">
      <span
        className="text-nd-text-disabled text-[9px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="text-nd-text-display text-base tabular-nums leading-none"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-nd-text-disabled text-[9px] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
