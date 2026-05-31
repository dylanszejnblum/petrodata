'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useTheme } from '@/providers/Theme'
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerTooltip,
} from '@/components/ui/map'
import { formatCompactUSD } from '@/utilities/formatCompactUSD'
import { getCountryFlag } from '@/utilities/flags'

type CoinData = {
  id: string | number
  name?: string
  ticker?: string
  pegCurrency?: string
  marketCap?: number
  price?: number
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  country?: string | null
  flag?: string | null
  chain?: string[] | null
  backingType?: string | null
  region?: string | null
  logoURI?: string | null
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  latam: 'Latin America',
  europe: 'Europe',
  asia: 'Asia',
  mena: 'MENA',
  africa: 'Africa',
  oceania: 'Oceania',
}

const REGION_CENTERS: Record<string, { longitude: number; latitude: number }> = {
  north_america: { longitude: -95, latitude: 45 },
  latam: { longitude: -58, latitude: -15 },
  europe: { longitude: 10, latitude: 50 },
  asia: { longitude: 105, latitude: 30 },
  mena: { longitude: 40, latitude: 28 },
  africa: { longitude: 20, latitude: 0 },
  oceania: { longitude: 140, latitude: -28 },
}

function getStatusDot(status?: string | null): string {
  switch (status) {
    case 'active':
      return 'var(--nd-success)'
    case 'depegged':
      return 'var(--nd-accent)'
    case 'paused':
      return 'var(--nd-warning)'
    default:
      return 'var(--nd-text-disabled)'
  }
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 border text-[10px] tracking-[0.06em] uppercase transition-all duration-150"
      style={{
        fontFamily: 'var(--font-space-mono)',
        borderColor: active ? 'var(--nd-text-display)' : 'var(--nd-border-visible)',
        color: active ? 'var(--nd-text-display)' : 'var(--nd-text-disabled)',
        backgroundColor: active ? 'var(--nd-surface-raised)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function MapMarkerDot({
  isSelected,
  isLightMode,
  delay,
}: {
  isSelected: boolean
  isLightMode: boolean
  delay: number
}) {
  const [visible, setVisible] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t1)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    const t2 = setTimeout(() => setPulse(true), 400)
    return () => clearTimeout(t2)
  }, [visible])

  return (
    <div
      className="flex items-center justify-center cursor-pointer"
      style={{
        width: isSelected ? 32 : 20,
        height: isSelected ? 32 : 20,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
      }}
    >
      <div
        style={{
          width: isSelected ? 16 : 10,
          height: isSelected ? 16 : 10,
          borderRadius: '50%',
          backgroundColor: isSelected
            ? 'var(--nd-accent)'
            : isLightMode
              ? 'var(--nd-text-primary)'
              : 'var(--nd-text-display)',
          border: isSelected
            ? '2px solid rgba(255,255,255,0.95)'
            : isLightMode
              ? '2px solid rgba(255,255,255,0.95)'
              : '2px solid rgba(0,0,0,0.25)',
          boxShadow: isSelected
            ? '0 0 16px 6px rgba(215, 25, 33, 0.35)'
            : isLightMode
              ? '0 6px 18px rgba(17, 24, 39, 0.22)'
              : '0 0 10px 2px rgba(255, 255, 255, 0.22)',
          transition: 'all 200ms ease-out',
        }}
      />
      {pulse && !isSelected && (
        <div
          className="absolute"
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: isLightMode
              ? '1px solid rgba(17,24,39,0.18)'
              : '1px solid rgba(255,255,255,0.15)',
            animation: 'marker-pulse 3s ease-out infinite',
            animationDelay: `${delay + 600}ms`,
          }}
        />
      )}
    </div>
  )
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-nd-text-secondary block text-[10px] uppercase"
      style={{ fontFamily: 'var(--font-space-mono)' }}
    >
      {children}
    </span>
  )
}

function CoinSidebarItem({ coin }: { coin: CoinData }) {
  return (
    <div className="py-4 border-b border-nd-border">
      <Link
        href={`/coins/${coin.ticker}`}
        className="flex items-center justify-between mb-2 gap-2 group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {coin.logoURI ? (
            <img
              src={coin.logoURI}
              alt={coin.name || ''}
              className="w-6 h-6 rounded-full flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <span className="text-base leading-none flex-shrink-0">
              {getCountryFlag(coin.country, coin.flag)}
            </span>
          )}
          <span
            className="text-nd-text-display text-base truncate group-hover:text-nd-accent transition-colors"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {coin.name}
          </span>
        </div>
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: getStatusDot(coin.status) }}
        />
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.06em] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {coin.ticker}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] px-1.5 py-0.5 border border-nd-border"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {coin.pegCurrency}
        </span>
        {coin.backingType && (
          <span
            className="text-nd-text-disabled text-[10px] px-1.5 py-0.5 border border-nd-border"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {coin.backingType.toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <span
            className="text-nd-text-disabled text-[10px] tracking-[0.06em] uppercase block"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            PRICE
          </span>
          <span
            className="text-nd-text-primary text-sm"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {coin.price?.toFixed(4) ?? '--'}
          </span>
        </div>
        <div>
          <span
            className="text-nd-text-disabled text-[10px] tracking-[0.06em] uppercase block"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            MKT CAP
          </span>
          <span
            className="text-nd-text-primary text-sm"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {coin.marketCap ? formatCompactUSD(coin.marketCap) : '--'}
          </span>
        </div>
        {coin.chain && coin.chain.length > 0 && (
          <div>
            <span
              className="text-nd-text-disabled text-[10px] tracking-[0.06em] uppercase block"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              CHAINS
            </span>
            <span
              className="text-nd-text-secondary text-[11px]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {coin.chain.length}
            </span>
          </div>
        )}
      </div>

      <Link
        href={`/coins/${coin.ticker}`}
        className="inline-block mt-3 text-[10px] tracking-[0.06em] uppercase text-nd-text-disabled hover:text-nd-accent transition-colors"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        View more &rarr;
      </Link>
    </div>
  )
}

export function GlobeMap({ coins }: { coins: CoinData[] }) {
  const { theme } = useTheme()
  const mapRef = useRef<MapLibreMap | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [chainFilter, setChainFilter] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const isLightMode = theme === 'light'

  const allChains = useMemo(() => [...new Set(coins.flatMap((c) => c.chain || []))], [coins])

  const filteredCoins = useMemo(() => {
    let result = coins
    if (regionFilter) result = result.filter((c) => c.region === regionFilter)
    if (chainFilter) result = result.filter((c) => c.chain?.includes(chainFilter))
    return result
  }, [coins, regionFilter, chainFilter])

  const coinsWithCoords = filteredCoins.filter(
    (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number',
  )

  const countriesWithCoins = coinsWithCoords.reduce(
    (acc, coin) => {
      const country = coin.country || 'Unknown'
      if (!acc[country]) acc[country] = []
      acc[country].push(coin)
      return acc
    },
    {} as Record<string, CoinData[]>,
  )

  const uniqueCountryCoords = Object.entries(countriesWithCoins).map(([country, countryCoins]) => ({
    country,
    coins: countryCoins,
    flag: getCountryFlag(country, countryCoins[0]?.flag),
    latitude: countryCoins[0].latitude!,
    longitude: countryCoins[0].longitude!,
  }))

  const regionGroups = useMemo(() => {
    const groups: Record<string, CoinData[]> = {}
    for (const coin of filteredCoins) {
      const region = coin.region || 'other'
      if (!groups[region]) groups[region] = []
      groups[region].push(coin)
    }
    return Object.entries(groups)
      .map(([region, regionCoins]) => ({
        region,
        label: REGION_LABELS[region] || region,
        coins: regionCoins,
        center: REGION_CENTERS[region],
      }))
      .sort((a, b) => b.coins.length - a.coins.length)
  }, [filteredCoins])

  const activeRegion = selectedRegion ?? regionFilter
  const selectedRegionCoins = selectedRegion
    ? filteredCoins.filter((c) => c.region === selectedRegion)
    : []

  const selectedCountryData = selectedCountry
    ? (uniqueCountryCoords.find((c) => c.country === selectedCountry) ?? null)
    : null
  const selectedCountryCoins = selectedCountryData?.coins ?? []

  const handleRegionClick = useCallback((region: string) => {
    setSelectedCountry(null)
    setSelectedRegion((prev) => {
      const next = prev === region ? null : region
      setRegionFilter(next)
      return next
    })
    setMobileSidebarOpen(true)
  }, [])

  const handleCountryClick = useCallback((country: string) => {
    setSelectedCountry((prev) => (prev === country ? null : country))
    setSelectedRegion(null)
    setRegionFilter(null)
    setMobileSidebarOpen(true)
  }, [])

  const hasActiveFilters = regionFilter || chainFilter

  const clearFilters = useCallback(() => {
    setSelectedRegion(null)
    setSelectedCountry(null)
    setRegionFilter(null)
    setChainFilter(null)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedRegion(null)
    setSelectedCountry(null)
    setRegionFilter(null)
    setMobileSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (selectedCountry && !uniqueCountryCoords.find((c) => c.country === selectedCountry)) {
      setSelectedCountry(null)
    }
  }, [uniqueCountryCoords, selectedCountry])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (selectedCountry) {
      const countryData = uniqueCountryCoords.find((c) => c.country === selectedCountry)
      if (countryData) {
        map.flyTo({
          center: [countryData.longitude, countryData.latitude],
          zoom: 5,
          pitch: 30,
          duration: 1200,
          essential: true,
        })
        return
      }
    }

    if (!activeRegion) {
      map.flyTo({
        center: [10, 20],
        zoom: 1.8,
        pitch: 15,
        duration: 1200,
        essential: true,
      })
      return
    }

    const center = REGION_CENTERS[activeRegion]
    if (!center) return

    map.flyTo({
      center: [center.longitude, center.latitude],
      zoom: 3.6,
      pitch: 22,
      duration: 1200,
      essential: true,
    })
  }, [activeRegion, selectedCountry, uniqueCountryCoords])

  const sidebarContent =
    !selectedRegion && !selectedCountry ? (
      <div className="p-4 md:p-6">
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase block mb-4"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          REGIONS
        </span>
        {regionGroups.length === 0 ? (
          <div className="py-12 text-center">
            <span
              className="text-nd-text-disabled text-[11px] tracking-[0.06em] uppercase"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              [NO GEOLOCATED DATA]
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            {regionGroups.map(({ region, label, coins: regionCoins }) => (
              <button
                key={region}
                onClick={() => handleRegionClick(region)}
                className="flex items-center justify-between py-3 px-4 border-b border-nd-border hover:bg-nd-surface-raised transition-colors text-left w-full"
                style={{
                  backgroundColor:
                    activeRegion === region ? 'var(--nd-surface-raised)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--nd-text-display)' }}
                  />
                  <span
                    className="text-nd-text-primary text-sm"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className="text-nd-text-disabled text-[11px]"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  {regionCoins.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    ) : selectedCountry ? (
      <div className="p-4 md:p-6">
        <button
          onClick={resetSelection}
          className="flex items-center gap-2 text-nd-text-secondary hover:text-nd-text-display transition-colors mb-6"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 1L3 6L8 11" />
          </svg>
          <span
            className="text-[11px] tracking-[0.06em] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            ALL REGIONS
          </span>
        </button>

        <span
          className="text-nd-text-display text-xl md:text-2xl tracking-tight block mb-1"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        >
          {selectedCountryData?.flag} {selectedCountry}
        </span>
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.06em] uppercase block mb-6"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {selectedCountryCoins.length} STABLECOIN{selectedCountryCoins.length !== 1 ? 'S' : ''}
        </span>

        <div className="flex flex-col">
          {selectedCountryCoins.map((coin) => (
            <CoinSidebarItem key={coin.id} coin={coin} />
          ))}
        </div>
      </div>
    ) : (
      <div className="p-4 md:p-6">
        <button
          onClick={resetSelection}
          className="flex items-center gap-2 text-nd-text-secondary hover:text-nd-text-display transition-colors mb-6"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 1L3 6L8 11" />
          </svg>
          <span
            className="text-[11px] tracking-[0.06em] uppercase"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            ALL REGIONS
          </span>
        </button>

        <span
          className="text-nd-text-display text-xl md:text-2xl tracking-tight block mb-1"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        >
          {REGION_LABELS[selectedRegion!] || selectedRegion}
        </span>
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.06em] uppercase block mb-6"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {selectedRegionCoins.length} STABLECOIN{selectedRegionCoins.length !== 1 ? 'S' : ''}
        </span>

        <div className="flex flex-col">
          {selectedRegionCoins.map((coin) => (
            <CoinSidebarItem key={coin.id} coin={coin} />
          ))}
        </div>
      </div>
    )

  const summaryPanel = (
    <div className="border border-nd-border bg-nd-surface p-4">
      <span
        className="text-nd-text-secondary block text-[11px] uppercase"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        Global Distribution
      </span>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--nd-text-display)' }} />
          <span
            className="text-nd-text-disabled text-[10px]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--nd-accent)' }} />
          <span
            className="text-nd-text-disabled text-[10px]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            SELECTED
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-nd-border pt-3">
        <span
          className="text-nd-text-disabled text-[11px]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {regionGroups.length} REGIONS
        </span>
        {hasActiveFilters && (
          <span
            className="text-[10px]"
            style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-accent)' }}
          >
            FILTERED
          </span>
        )}
      </div>
    </div>
  )

  const filtersPanel = (
    <div className="border border-nd-border bg-nd-surface">
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: hasActiveFilters ? 'var(--nd-accent)' : 'var(--nd-text-secondary)',
            }}
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span
            className="text-[11px] uppercase"
            style={{
              fontFamily: 'var(--font-space-mono)',
              color: hasActiveFilters ? 'var(--nd-text-display)' : 'var(--nd-text-secondary)',
            }}
          >
            Filters
          </span>
          {hasActiveFilters && (
            <span
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-accent)' }}
            >
              [{filteredCoins.length}]
            </span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            color: 'var(--nd-text-secondary)',
            transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-out',
          }}
        >
          <path d="M2 4L6 8L10 4" />
        </svg>
      </button>

      {filtersOpen && (
        <div className="border-t border-nd-border p-4">
          <div className="flex flex-col gap-4">
            {regionGroups.length > 0 && (
              <div>
                <PanelHeading>Region</PanelHeading>
                <div className="mt-2 flex flex-wrap gap-1">
                  {regionGroups.map(({ region, label }) => (
                    <FilterChip
                      key={region}
                      label={label}
                      active={regionFilter === region}
                      onClick={() => {
                        const nextRegion = regionFilter === region ? null : region
                        setRegionFilter(nextRegion)
                        setSelectedRegion(nextRegion)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {allChains.length > 0 && (
              <div>
                <PanelHeading>Chain</PanelHeading>
                <div className="mt-2 flex flex-wrap gap-1">
                  {allChains.map((chain) => (
                    <FilterChip
                      key={chain}
                      label={chain}
                      active={chainFilter === chain}
                      onClick={() => setChainFilter(chainFilter === chain ? null : chain)}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="self-start text-[10px] uppercase text-nd-accent transition-colors hover:text-nd-text-display"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                [CLEAR ALL]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col lg:h-full lg:flex-row">
      <div className="flex flex-col lg:min-h-0 lg:flex-1">
        <div className="flex flex-col gap-3 p-3 lg:hidden">
          {summaryPanel}
          {filtersPanel}
        </div>

        <div className="relative h-[320px] md:h-[440px] lg:h-full">
          <style>{`
            @keyframes marker-pulse {
              0% { transform: scale(0.5); opacity: 0.6; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          `}</style>

          <Map
            ref={mapRef}
            center={[10, 20]}
            zoom={1.8}
            projection={{ type: 'globe' }}
            pitch={15}
            minZoom={1.2}
            maxZoom={8}
            className="h-full w-full"
          >
            <MapControls position="bottom-right" showZoom />
            {uniqueCountryCoords.map(
              ({ country, flag, latitude, longitude, coins: countryCoins }, i) => {
                const isRegionHighlighted =
                  !!activeRegion && countryCoins.some((c) => c.region === activeRegion)
                const isCountrySelected = selectedCountry === country
                return (
                  <MapMarker
                    key={country}
                    longitude={longitude}
                    latitude={latitude}
                    onClick={() => handleCountryClick(country)}
                  >
                    <MarkerTooltip>
                      <span className="font-bold">
                        {flag} {country}
                      </span>
                      <br />
                      <span className="text-xs opacity-70">
                        {countryCoins.length} stablecoin
                        {countryCoins.length !== 1 ? 's' : ''}
                      </span>
                    </MarkerTooltip>
                    <MarkerContent>
                      <button
                        type="button"
                        onClick={() => handleCountryClick(country)}
                        className="relative flex items-center justify-center bg-transparent p-0"
                        aria-label={`Focus ${country}`}
                      >
                        <MapMarkerDot
                          isSelected={isCountrySelected || isRegionHighlighted}
                          isLightMode={isLightMode}
                          delay={i * 60}
                        />
                        {(isCountrySelected || (isRegionHighlighted && !selectedCountry)) && (
                          <MarkerLabel
                            className="rounded-full border border-nd-border bg-nd-surface px-2 py-0.5 text-[10px] tracking-[0.06em] uppercase shadow-sm"
                            position="bottom"
                          >
                            {flag} {country}
                          </MarkerLabel>
                        )}
                      </button>
                    </MarkerContent>
                  </MapMarker>
                )
              },
            )}
          </Map>

          <div className="absolute left-4 top-4 z-10 hidden w-[260px] flex-col gap-2 lg:flex">
            {summaryPanel}
            {filtersPanel}
          </div>

          {(selectedRegion || selectedCountry) && (
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-nd-surface border border-nd-border px-4 py-2 flex items-center gap-2 hover:bg-nd-surface-raised transition-colors"
            >
              <span
                className="text-[11px] tracking-[0.06em] uppercase"
                style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--nd-text-display)' }}
              >
                {selectedCountry || REGION_LABELS[selectedRegion!] || 'Details'}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{
                  color: 'var(--nd-text-secondary)',
                  transform: mobileSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms',
                }}
              >
                <path d="M2 4L6 8L10 4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden lg:block lg:w-[380px] border-t lg:border-t-0 lg:border-l border-nd-border bg-nd-surface overflow-y-auto"
        style={{ maxHeight: '100%' }}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar: slide-up sheet */}
      <div
        className="lg:hidden border-t border-nd-border bg-nd-surface overflow-y-auto transition-all duration-300 ease-out"
        style={{
          maxHeight: mobileSidebarOpen ? '60vh' : 0,
          opacity: mobileSidebarOpen ? 1 : 0,
        }}
      >
        {sidebarContent}
      </div>
    </div>
  )
}
