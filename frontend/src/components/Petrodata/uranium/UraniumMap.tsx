'use client'

// Uranium projects map. Renders project points as monochrome teal-accented
// markers over a Carto basemap, with a bordered legend of the lifecycle stages
// present. Markers pop in north→south after mount. Compositor-only animation,
// reduced-motion safe via the shared ./anim helpers.

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
  MapPopup,
} from '@/components/ui/map'
import { useTheme } from '@/providers/Theme'
import { popIn, utils } from './anim'
import { uraniumStatusColor } from './theme'
import type { ProjectPoint } from './types'
import { CompanyLink } from '@/components/Petrodata/entities/CompanyLink'

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'

const transformRequest = (url: string) => {
  if (url.startsWith(CARTO_FONTS_PREFIX)) {
    return { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
  }
  return { url }
}

/**
 * Markers live INSIDE <Map> so they only mount once the map instance exists and
 * the marker DOM is portaled in. The pop-in then runs after two frames, by which
 * point every `.uranium-marker` is attached to the document — the previous
 * (parent-level) effect ran before any marker existed, so nothing animated in
 * and the points stayed invisible.
 */
function Markers({ plotted }: { plotted: ProjectPoint[] }) {
  const [selected, setSelected] = useState<ProjectPoint | null>(null)
  const handleClose = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf2 = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        popIn('.uranium-marker', { startDelay: 200, step: 80 })
      })
    })
    // Safety net: once every marker's pop-in has had time to finish, force any
    // straggler visible so a points-never-appear regression is impossible.
    const settle = window.setTimeout(() => {
      utils.set('.uranium-marker', { opacity: 1, scale: 1 })
    }, 3000)
    return () => {
      window.cancelAnimationFrame(raf1)
      window.cancelAnimationFrame(raf2)
      window.clearTimeout(settle)
    }
  }, [plotted.length])

  return (
    <>
      {plotted.map((p, i) => (
        <MapMarker
          key={`${p.name}-${i}`}
          longitude={p.lng}
          latitude={p.lat}
          onClick={() => setSelected(p)}
        >
          <MarkerContent>
            <div className="uranium-marker relative grid cursor-pointer place-items-center opacity-0">
              <span
                className="size-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: uraniumStatusColor(p.statusCode || p.statusLabel) }}
              />
            </div>
          </MarkerContent>
          <MarkerTooltip className="!rounded-none border border-nd-border !bg-nd-surface !text-nd-text-primary font-mono text-[11px]">
            <div>{p.name}</div>
            <div className="text-nd-text-secondary">
              {p.company} · {p.statusLabel}
            </div>
          </MarkerTooltip>
        </MapMarker>
      ))}

      {selected && (
        <MapPopup
          longitude={selected.lng}
          latitude={selected.lat}
          offset={20}
          onClose={handleClose}
          closeButton
          maxWidth="20rem"
          className="!rounded-none !p-0 border-nd-border !bg-nd-surface !text-nd-text-primary"
        >
          <UraniumPopupBody p={selected} />
        </MapPopup>
      )}
    </>
  )
}

function UraniumPopupBody({ p }: { p: ProjectPoint }) {
  const t = useTranslations('uraniumHub.table.columns')
  const color = uraniumStatusColor(p.statusCode || p.statusLabel)
  return (
    <div className="flex w-[18rem] flex-col">
      <div className="flex items-start gap-3 border-b border-nd-border px-4 pt-4 pb-3 pr-8">
        <span
          className="mt-1 inline-block size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
            {t('project')}
          </span>
          <span className="mt-0.5 block truncate font-sans text-base leading-tight text-nd-text-display" title={p.name}>
            {p.name}
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-4 py-3 font-mono text-[11px]">
        <PopupRow label={t('status')} value={p.statusLabel} dot={color} />
        <PopupRow label={t('province')} value={p.province} />
        {p.company && p.company !== '—' && (
          <>
            <dt className="uppercase text-nd-text-disabled">{t('company')}</dt>
            <dd className="text-nd-text-secondary">
              <CompanyLink name={p.company} className="hover:underline" />
            </dd>
          </>
        )}
        <PopupRow label={t('origin')} value={p.origin} />
      </dl>
    </div>
  )
}

function PopupRow({ label, value, dot }: { label: string; value: string | null | undefined; dot?: string }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <>
      <dt className="uppercase text-nd-text-disabled">{label}</dt>
      <dd className="inline-flex items-center gap-1.5 text-nd-text-secondary">
        {dot && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />}
        {value}
      </dd>
    </>
  )
}

function isPlottable(p: ProjectPoint): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    !(p.lat === 0 && p.lng === 0)
  )
}

export function UraniumMap({
  projects,
  legendLabel,
}: {
  projects: ProjectPoint[]
  legendLabel: string
}) {
  const { theme } = useTheme()

  // Filter to plottable points and sort a COPY north→south so the pop-in flows
  // from the top of the country downward.
  const plotted = projects.filter(isPlottable).slice().sort((a, b) => b.lat - a.lat)

  // Unique lifecycle stages present, in encounter order, for the legend.
  const legendStages: { label: string; color: string }[] = []
  const seen = new Set<string>()
  for (const p of plotted) {
    const key = p.statusLabel || p.statusCode
    if (!key || seen.has(key)) continue
    seen.add(key)
    legendStages.push({ label: p.statusLabel, color: uraniumStatusColor(p.statusCode || p.statusLabel) })
  }

  return (
    <div className="relative h-full w-full">
      <Map
        theme={theme === 'dark' ? 'dark' : 'light'}
        viewport={{ center: [-65.5, -40], zoom: 3.6 }}
        renderWorldCopies={false}
        transformRequest={transformRequest}
        className="h-full w-full"
      >
        <MapControls position="bottom-right" showZoom />
        <Markers plotted={plotted} />
      </Map>

      {legendStages.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-nd-surface/90 border border-nd-border p-3 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled font-mono">
            {legendLabel}
          </div>
          <ul className="mt-2 space-y-1">
            {legendStages.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] text-nd-text-secondary">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
