'use client'

import { useTheme } from '@/providers/Theme'
import { Map, MapControls, MapMarker, MarkerContent, type MapViewport } from '@/components/ui/map'

const CARTO_FONTS_PREFIX = 'https://tiles.basemaps.cartocdn.com/fonts/'
const transformRequest = (url: string) => {
  if (url.startsWith(CARTO_FONTS_PREFIX)) {
    return { url: `/carto-fonts/${url.slice(CARTO_FONTS_PREFIX.length)}` }
  }
  return { url }
}

export function ProjectLocationMap({
  latitude,
  longitude,
  color,
}: {
  latitude: number
  longitude: number
  color: string
}) {
  const { theme } = useTheme()
  const viewport: Partial<MapViewport> = {
    center: [longitude, latitude],
    zoom: 6,
  }

  return (
    <Map
      className="h-full w-full"
      theme={theme === 'dark' ? 'dark' : 'light'}
      viewport={viewport}
      renderWorldCopies={false}
      transformRequest={transformRequest}
    >
      <MapControls position="bottom-right" showZoom />
      <MapMarker longitude={longitude} latitude={latitude}>
        <MarkerContent>
          <div className="relative grid place-items-center">
            <span
              className="absolute inline-block h-6 w-6 rounded-full animate-ping"
              style={{ backgroundColor: color, opacity: 0.4 }}
              aria-hidden
            />
            <span
              className="relative inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          </div>
        </MarkerContent>
      </MapMarker>
    </Map>
  )
}
