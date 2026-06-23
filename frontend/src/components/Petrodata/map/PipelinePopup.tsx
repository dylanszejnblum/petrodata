'use client'

import { useTranslations } from 'next-intl'

// Properties carried by each feature in /data/ar-pipelines.geojson (built by
// scripts/build-pipelines.py from the Secretaría de Energía / ENARGAS datasets).
export interface PipelineProps {
  kind: 'gas' | 'oil'
  name: string
  tramo: string | null
  operator: string | null
  operator_full: string | null
  subtype: string
  diameter_in: number | null
  length_km: number
}

// Compressor-plant node features (kind: 'node') — points along the gas network.
export interface PipelineNodeProps {
  kind: 'node'
  name: string
  gasoducto: string | null
  tramo: string | null
  operator: string | null
  operator_full: string | null
}

// Pipeline line colours — kept in sync with PipelinesLayer + the legend.
//  gas → interactive blue, oil → accent red. Distinct from the green well dots.
export const GAS_COLOR = '#2f8fe0'
export const OIL_COLOR = '#d6453d'

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <>
      <dt className="text-nd-text-disabled uppercase">{label}</dt>
      <dd className="text-nd-text-secondary">{value}</dd>
    </>
  )
}

export function PipelinePopup({ pipeline }: { pipeline: PipelineProps }) {
  const t = useTranslations('pipelinePopup')
  const isGas = pipeline.kind === 'gas'
  const color = isGas ? GAS_COLOR : OIL_COLOR
  const lengthLabel =
    pipeline.length_km != null
      ? `${pipeline.length_km.toLocaleString('es-AR', { maximumFractionDigits: 0 })} km`
      : null
  const diameterLabel =
    pipeline.diameter_in != null
      ? `${pipeline.diameter_in.toLocaleString('es-AR', { maximumFractionDigits: 1 })}″`
      : null

  return (
    <div className="flex w-[19rem] flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-nd-border px-4 pt-4 pb-3">
        <span
          className="mt-1 inline-block size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.25)' }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {isGas ? t('gas') : t('oil')}
          </span>
          <span
            className="mt-0.5 block truncate font-sans text-base leading-tight text-nd-text-display"
            title={pipeline.name}
          >
            {pipeline.name}
          </span>
        </div>
      </div>

      {/* Meta grid */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 py-3 text-[11px] font-mono">
        <MetaRow label={t('fields.operator')} value={pipeline.operator_full ?? pipeline.operator} />
        <MetaRow label={t('fields.type')} value={pipeline.subtype} />
        <MetaRow label={t('fields.tramo')} value={pipeline.tramo} />
        <MetaRow label={t('fields.diameter')} value={diameterLabel} />
        <MetaRow label={t('fields.length')} value={lengthLabel} />
      </dl>

      {/* Footer — source attribution */}
      <div className="border-t border-nd-border px-4 py-2.5">
        <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {t('source')}
        </span>
      </div>
    </div>
  )
}

export function PipelineNodePopup({ node }: { node: PipelineNodeProps }) {
  const t = useTranslations('pipelinePopup')
  return (
    <div className="flex w-[19rem] flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-nd-border px-4 pt-4 pb-3">
        <span
          className="mt-1 inline-block size-2.5 shrink-0 rounded-full bg-white"
          style={{ boxShadow: `0 0 0 1.75px ${GAS_COLOR}` }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {t('node')}
          </span>
          <span
            className="mt-0.5 block truncate font-sans text-base leading-tight text-nd-text-display"
            title={node.name}
          >
            {node.name}
          </span>
        </div>
      </div>

      {/* Meta grid */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 py-3 text-[11px] font-mono">
        <MetaRow label={t('fields.gasoducto')} value={node.gasoducto} />
        <MetaRow label={t('fields.tramo')} value={node.tramo} />
        <MetaRow label={t('fields.operator')} value={node.operator_full ?? node.operator} />
      </dl>

      {/* Footer — source attribution */}
      <div className="border-t border-nd-border px-4 py-2.5">
        <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {t('source')}
        </span>
      </div>
    </div>
  )
}
