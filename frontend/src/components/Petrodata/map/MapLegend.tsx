'use client'

import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { OverlayCard } from './OverlayCard'

// Marker/overlay colours — kept in sync with the map layers:
//  - producing basins: BasinAreasLayer (#22c55e)
//  - exploration basins: ExplorationBasinsLayer (#94a3b8, dashed)
//  - well dots: MapExperience (active #22c55e, stopped #d4a843, gas "G")
//  - trunk pipelines: PipelinesLayer (gas #2f8fe0, oil #d6453d)
const GREEN = '#22c55e'
const AMBER = '#d4a843'
const SLATE = '#94a3b8'
const GAS_PIPE = '#2f8fe0'
const OIL_PIPE = '#d6453d'

function Row({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-4 shrink-0 place-items-center">{swatch}</span>
      <span className="text-[11px] text-nd-text-secondary">{label}</span>
    </div>
  )
}

function Dot({ color, children }: { color: string; children?: React.ReactNode }) {
  return (
    <span
      className="grid size-3 place-items-center rounded-full text-[7px] font-bold leading-none text-white"
      style={{ backgroundColor: color, boxShadow: '0 0 0 1.5px #fff' }}
    >
      {children}
    </span>
  )
}

function LineSwatch({ color }: { color: string }) {
  return (
    <span className="inline-block h-[3px] w-3.5 rounded-full" style={{ backgroundColor: color }} />
  )
}

function NodeSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 rounded-full bg-white"
      style={{ boxShadow: `0 0 0 1.5px ${color}` }}
    />
  )
}

export function MapLegend({
  showExploration,
  onToggleExploration,
  showPipelines,
  onTogglePipelines,
}: {
  showExploration: boolean
  onToggleExploration: () => void
  showPipelines: boolean
  onTogglePipelines: () => void
}) {
  const t = useTranslations('mapPage.legend')

  return (
    <OverlayCard className="w-full p-3 font-mono">
      <span className="block text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {t('title')}
      </span>

      <div className="mt-2 flex flex-col gap-1.5">
        <Row
          swatch={
            <span
              className="size-3.5 rounded-[2px]"
              style={{
                border: `1.5px solid ${GREEN}`,
                background: 'color-mix(in srgb, #22c55e 14%, transparent)',
              }}
            />
          }
          label={t('producing')}
        />
        <button
          type="button"
          onClick={onToggleExploration}
          aria-pressed={showExploration}
          title={showExploration ? t('hideExploration') : t('showExploration')}
          className="flex items-center gap-2 text-left transition-opacity hover:opacity-80"
          style={{ opacity: showExploration ? 1 : 0.45 }}
        >
          <span className="grid size-4 shrink-0 place-items-center">
            <span
              className="size-3.5 rounded-[2px]"
              style={{
                border: `1.5px dashed ${SLATE}`,
                background: 'color-mix(in srgb, #64748b 10%, transparent)',
              }}
            />
          </span>
          <span className="flex-1 text-[11px] text-nd-text-secondary">{t('exploration')}</span>
          {showExploration ? (
            <Eye size={12} className="shrink-0 text-nd-text-disabled" />
          ) : (
            <EyeOff size={12} className="shrink-0 text-nd-text-disabled" />
          )}
        </button>

        {/* Trunk pipelines — one toggle controls both gas + oil overlays. */}
        <div className="flex flex-col gap-1.5" style={{ opacity: showPipelines ? 1 : 0.45 }}>
          <button
            type="button"
            onClick={onTogglePipelines}
            aria-pressed={showPipelines}
            title={showPipelines ? t('hidePipelines') : t('showPipelines')}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-80"
          >
            <span className="grid size-4 shrink-0 place-items-center">
              <LineSwatch color={GAS_PIPE} />
            </span>
            <span className="flex-1 text-[11px] text-nd-text-secondary">{t('gasPipeline')}</span>
            {showPipelines ? (
              <Eye size={12} className="shrink-0 text-nd-text-disabled" />
            ) : (
              <EyeOff size={12} className="shrink-0 text-nd-text-disabled" />
            )}
          </button>
          <Row swatch={<LineSwatch color={OIL_PIPE} />} label={t('oilPipeline')} />
          <Row swatch={<NodeSwatch color={GAS_PIPE} />} label={t('compressorNode')} />
        </div>
      </div>

      <div className="my-2 h-px bg-nd-border" />

      <div className="flex flex-col gap-1.5">
        <Row swatch={<Dot color={GREEN} />} label={t('wellActive')} />
        <Row swatch={<Dot color={AMBER} />} label={t('wellStopped')} />
        <Row swatch={<Dot color={GREEN}>G</Dot>} label={t('gasWell')} />
      </div>
    </OverlayCard>
  )
}
