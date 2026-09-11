import { Badge } from '@/ui/badge'
import { MapLegend } from '@/ui/map-shell'
import { PageHero } from '@/ui/page-hero'
import { SectionLabel } from '@/ui/section-label'
import { Stat } from '@/ui/stat'
import { Surface } from '@/ui/surface'
import { TablaFiltrosDemo } from '../_client/tabla-filtros-demo'

/* Catálogo · 03 — composiciones reales con los componentes del sistema.
   Jerarquía de superficies (D3): clara = base, oscura = énfasis,
   foto = protagonismo. */

function Patron({
  idx,
  title,
  note,
  cuando,
  children,
}: {
  idx: string
  title: string
  note?: string
  cuando: string
  children: React.ReactNode
}) {
  return (
    <section className="pt-14">
      <SectionLabel index={idx} title={title} note={note} />
      <div className="mt-6">{children}</div>
      <p className="mt-4 max-w-[46rem] text-[13px] text-secondary">
        <span className="type-label !text-primary mr-2">Cuándo</span>
        {cuando}
      </p>
    </section>
  )
}

export default function Patrones() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero eyebrow="Catálogo · 03" title="Patrones">
        Composiciones reales armadas solo con componentes del catálogo. La regla de fondo es
        la jerarquía de superficies: la clara es la base, la oscura marca énfasis y la foto
        se reserva para el protagonista de la pantalla.
      </PageHero>

      {/* ················· 01 · Card de noticia ················· */}
      <Patron
        idx="01"
        title="Card de noticia"
        note="Surface flat"
        cuando="Para todo el caudal editorial: listados de noticias, resultados de búsqueda, grillas. Es la superficie clara base — puede repetirse N veces sin cansar. El label arriba clasifica, el título carga el peso y la meta inferior cierra en tabular."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Surface variant="flat" interactive className="flex min-h-[230px] flex-col gap-3">
            <span className="type-label">Noticias · Producción</span>
            <h3 className="type-card-title">YPF adelanta el pico de Loma Campana a 2027</h3>
            <p className="text-[13.5px] text-secondary">
              La operadora suma dos sets de fractura y reordena su plan de pads.
            </p>
            <div className="mt-auto flex justify-between type-label tnums">
              <span>04 AGO 2026</span>
              <span>ENERGÍA ON</span>
            </div>
          </Surface>
          <Surface variant="flat" interactive className="flex min-h-[230px] flex-col gap-3">
            <span className="type-label">Noticias · Exportación</span>
            <h3 className="type-card-title">
              El oleoducto a Punta Colorada entra en llenado y adelanta la primera carga
            </h3>
            <p className="text-[13.5px] text-secondary">
              Vaca Muerta Sur habilita 180 mil barriles diarios de capacidad de evacuación.
            </p>
            <div className="mt-auto flex justify-between type-label tnums">
              <span>03 AGO 2026</span>
              <span>RÍO NEGRO</span>
            </div>
          </Surface>
          <Surface variant="flat" interactive className="flex min-h-[230px] flex-col gap-3">
            <span className="type-label">Noticias · Gas</span>
            <h3 className="type-card-title">Invierno sin GNL importado por primera vez</h3>
            <p className="text-[13.5px] text-secondary">
              La producción local cubrió la demanda pico de julio sin cargamentos spot.
            </p>
            <div className="mt-auto flex justify-between type-label tnums">
              <span>01 AGO 2026</span>
              <span>ECONOJOURNAL</span>
            </div>
          </Surface>
        </div>
      </Patron>

      {/* ················· 02 · Card foto jerárquica ················· */}
      <Patron
        idx="02"
        title="Card foto jerárquica"
        note="Surface photo"
        cuando="Solo para el protagonista: la historia o la provincia destacada, una por vista (a lo sumo dos). El scrim garantiza contraste del texto sobre la imagen. Si todo grita, nada grita — la foto pierde jerarquía cuando se repite."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Surface variant="photo" className="flex min-h-[280px] flex-col justify-end gap-3">
            <Badge tone="on-dark" className="self-start">Neuquén</Badge>
            <h3 className="type-card-title !text-white">
              La provincia que perfora el 91% del shale argentino
            </h3>
            <div className="flex justify-between type-label !text-on-dark-3 tnums">
              <span>PROVINCIAS</span>
              <span>412 POZOS ACTIVOS</span>
            </div>
          </Surface>
          <div className="grid gap-3">
            <Surface variant="flat" className="flex flex-col gap-2">
              <span className="type-label">Al lado, la base clara</span>
              <p className="text-[13.5px] text-secondary">
                La card foto convive con cards flat: el contraste entre niveles es lo que
                construye la jerarquía, no el tamaño.
              </p>
            </Surface>
            <Surface variant="inverse" className="flex flex-col gap-2">
              <span className="type-label !text-on-dark-3">Y la oscura para énfasis</span>
              <p className="text-[13.5px] text-on-dark-2">
                Surface inverse es fija — no cambia con el tema. La oscuridad es jerarquía,
                no tema.
              </p>
            </Surface>
          </div>
        </div>
      </Patron>

      {/* ················· 03 · KPI band ················· */}
      <Patron
        idx="03"
        title="KPI band"
        note="4 × Stat en grid"
        cuando="Para abrir una pantalla de datos con sus 3-5 números clave. Sobre Surface inverse cuando la banda es el énfasis de la página (home, dashboard); sobre flat cuando compite con otro protagonista. Siempre con delta y footnote: un número sin comparación no informa."
      >
        <Surface variant="inverse">
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <Stat onDark label="Producción de gas" value={174300000} format="compact" unit="m³/d" delta={0.032} footnote="May 2026 · MoM" />
            <Stat onDark label="Producción de petróleo" value={757000} format="compact" unit="bbl/d" delta={0.018} footnote="May 2026 · MoM" />
            <Stat onDark label="Pozos activos" value={412} delta={-0.014} footnote="Neuquén" />
            <Stat onDark label="Participación shale" value={0.62} format="percent" footnote="del total nacional" />
          </div>
        </Surface>
      </Patron>

      {/* ················· 04 · Tabla con filtros ················· */}
      <Patron
        idx="04"
        title="Tabla con filtros"
        note="Chips + DataTable"
        cuando="Para listados de datos que el lector recorta por una dimensión (cuenca, recurso, estado). Los chips muestran el universo de opciones de una — sin desplegables para 3-6 valores. El vacío filtrado nunca es una tabla muda: el EmptyState sugiere quitar filtros."
      >
        <TablaFiltrosDemo />
      </Patron>

      {/* ················· 05 · Overlay de mapa ················· */}
      <Patron
        idx="05"
        title="Overlay de mapa"
        note="Surface overlay + MapLegend"
        cuando="Para todo lo que flota sobre el mapa: leyendas, resúmenes, filtros. Surface overlay es la única superficie con sombra del sistema, y el backdrop-blur mantiene legible el texto sobre cualquier basemap. Abajo se simula el mapa con un fondo neutro — el catálogo no monta MapLibre."
      >
        <div className="relative min-h-[320px] overflow-hidden rounded-[10px] border bg-raised">
          {/* pseudo-basemap: grilla hairline sobre raised */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute left-4 top-4 max-w-[16rem]">
            <Surface variant="overlay" padding="sm" className="flex flex-col gap-1">
              <span className="type-label">Cuenca Neuquina</span>
              <p className="type-kpi text-[1.9rem]">412</p>
              <p className="text-[13px] text-secondary">pozos activos en la ventana de shale</p>
            </Surface>
          </div>
          <div className="absolute bottom-4 right-4">
            <MapLegend
              title="Recurso"
              items={[
                { color: 'var(--data-oil)', label: 'Petróleo' },
                { color: 'var(--data-gas)', label: 'Gas' },
                { color: 'var(--status-caution)', label: 'Mixto' },
              ]}
            />
          </div>
        </div>
      </Patron>
    </div>
  )
}
