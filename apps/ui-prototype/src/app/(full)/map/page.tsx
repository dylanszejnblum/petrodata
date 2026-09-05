import type { Metadata } from 'next'
import { EmptyState } from '@/ui/empty-state'
import { readMock, applyEstado, type SearchParams } from '@/mock/state'
import { WELLS } from '@/fixtures/wells'
import { MapExperience } from './_client/MapExperience'

export const metadata: Metadata = {
  title: 'Mapa de pozos',
  description: 'Mapa interactivo de pozos de la cuenca Neuquina, con filtros por estado, recurso y operadora.',
}

/* /map — vista de aplicación: vive en el grupo (full), sin footer y a
   alto de viewport, para que sea todo mapa (pedido de Mariano,
   2026-08-12). Sin hero visible; el h1 se conserva para lectores de
   pantalla, porque sin él la ruta queda sin encabezado. */

export default async function MapPage({ searchParams }: { searchParams: SearchParams }) {
  const { estado } = await readMock(searchParams)
  const wells = applyEstado(estado, WELLS, 40)
  const sp = await searchParams
  const initialOperator = typeof sp.operator === 'string' ? sp.operator : null

  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">Mapa de pozos de la cuenca Neuquina</h1>

      {wells === null ? (
        <div className="mx-auto max-w-[80rem] px-4 py-16 md:px-8">
          <EmptyState kind="offline" actionHref="/map" actionLabel="Reintentar" />
        </div>
      ) : (
        <MapExperience wells={wells} initialOperator={initialOperator} />
      )}
    </div>
  )
}
