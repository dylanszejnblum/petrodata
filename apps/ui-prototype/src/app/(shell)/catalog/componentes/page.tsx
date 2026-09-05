import { Alert } from '@/ui/alert'
import { Badge } from '@/ui/badge'
import { Button, ButtonLink } from '@/ui/button'
import { Chip } from '@/ui/chip'
import { Donut } from '@/ui/donut'
import { EmptyState } from '@/ui/empty-state'
import { SelectField, TextField } from '@/ui/field'
import { PageHero } from '@/ui/page-hero'
import { Pager } from '@/ui/pager'
import { ProportionBarList } from '@/ui/proportion-list'
import { SectionLabel } from '@/ui/section-label'
import { DetailSkeleton, ListSkeleton, MapSkeleton } from '@/ui/skeleton'
import { Sparkline } from '@/ui/sparkline'
import { Stat } from '@/ui/stat'
import { Surface } from '@/ui/surface'
import { ChartFrameDemo } from '../_client/chart-frame-demo'
import { ChipFilterDemo } from '../_client/chip-filter-demo'
import { DataTableDemo, DataTableVaciaDemo } from '../_client/data-table-demo'
import { DialogDemo } from '../_client/dialog-demo'
import { SegmentedDemo } from '../_client/segmented-demo'

/* Catálogo · 02 — cada componente de src/ui aislado, con variantes,
   estados, casos extremos, tabla de props y nota de accesibilidad. */

function Seccion({
  idx,
  title,
  note,
  children,
}: {
  idx: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="pt-14">
      <SectionLabel index={idx} title={title} note={note} />
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  )
}

function Demo({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <p className="type-label mb-2">{label}</p>}
      <div className="rounded-[10px] border border-dashed p-5">{children}</div>
    </div>
  )
}

function PropsTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border bg-surface">
      <table className="w-full min-w-[28rem] border-collapse text-[13px]">
        <thead>
          <tr className="bg-raised">
            <th scope="col" className="px-4 py-2 text-left type-label">Prop</th>
            <th scope="col" className="px-4 py-2 text-left type-label">Tipo</th>
            <th scope="col" className="px-4 py-2 text-left type-label">Default</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(([nombre, tipo, def]) => (
            <tr key={nombre}>
              <td className="px-4 py-2 font-medium text-body">{nombre}</td>
              <td className="px-4 py-2 font-mono text-secondary">{tipo}</td>
              <td className="px-4 py-2 font-mono text-tertiary">{def}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function A11y({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-secondary">
      <span className="type-label !text-primary mr-2">A11y</span>
      {children}
    </p>
  )
}

const IconoFlecha = (
  <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const SPARK_DATA = [
  { x: '2026-01', y: 148 },
  { x: '2026-02', y: 152 },
  { x: '2026-03', y: 149 },
  { x: '2026-04', y: 159 },
  { x: '2026-05', y: 165 },
  { x: '2026-06', y: 172 },
  { x: '2026-07', y: 174 },
]

export default function Componentes() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      <PageHero
        eyebrow="Catálogo · 02"
        title="Componentes"
        right={<Badge tone="neutral">20 componentes</Badge>}
      >
        Cada componente de src/ui aislado: variantes, tamaños, estados, casos extremos y
        accesibilidad. Este mismo encabezado es el demo de PageHero (sección 19).
      </PageHero>

      {/* ················· 01 · Surface ················· */}
      <Seccion idx="01" title="Surface" note="la escalera de superficies (D3)">
        <Demo label="Las 5 variantes">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Surface variant="flat" className="min-h-28">
              <p className="type-label mb-1">flat</p>
              <p className="text-[13px] text-secondary">La base clara. Sigue el tema.</p>
            </Surface>
            <Surface variant="raised" className="min-h-28">
              <p className="type-label mb-1">raised</p>
              <p className="text-[13px] text-secondary">Hover y cabeceras. Sigue el tema.</p>
            </Surface>
            <Surface variant="inverse" className="min-h-28">
              <p className="type-label !text-on-dark-3 mb-1">inverse</p>
              <p className="text-[13px] text-on-dark-2">Oscura fija: énfasis, no tema.</p>
            </Surface>
            <Surface variant="photo" className="min-h-28 flex flex-col justify-end">
              <p className="type-label !text-on-dark-3 mb-1">photo</p>
              <p className="text-[13px] text-on-dark-2">Scrim para texto sobre imagen.</p>
            </Surface>
            <Surface variant="overlay" className="min-h-28">
              <p className="type-label mb-1">overlay</p>
              <p className="text-[13px] text-secondary">Flota sobre el mapa. Única sombra.</p>
            </Surface>
          </div>
        </Demo>
        <Demo label="Padding sm / md · interactive">
          <div className="flex flex-wrap gap-3">
            <Surface padding="sm" className="w-52">
              <p className="text-[13px] text-secondary">padding=&quot;sm&quot; · p-4</p>
            </Surface>
            <Surface padding="md" className="w-52">
              <p className="text-[13px] text-secondary">padding=&quot;md&quot; · p-5</p>
            </Surface>
            <Surface interactive className="w-52">
              <p className="text-[13px] text-secondary">interactive · hover cambia a raised</p>
            </Surface>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['variant', "'flat' | 'raised' | 'inverse' | 'photo' | 'overlay'", "'flat'"],
            ['padding', "'none' | 'sm' | 'md'", "'md'"],
            ['interactive', 'boolean', 'false'],
          ]}
        />
        <A11y>
          Surface es un div sin semántica: el contenido pone la suya (article, h3). Sobre
          inverse y photo el texto usa los tokens on-dark, nunca los del tema.
        </A11y>
      </Seccion>

      {/* ················· 02 · Button / ButtonLink ················· */}
      <Seccion idx="02" title="Button / ButtonLink" note="monocromo (D8)">
        <Demo label="Variantes × tamaños">
          <div className="flex flex-col gap-4">
            {(['solid', 'outline', 'ghost'] as const).map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                <span className="type-label w-14">{variant}</span>
                <Button variant={variant} size="sm">Exportar</Button>
                <Button variant={variant} size="md">Exportar datos</Button>
                <Button variant={variant} size="icon" aria-label="Siguiente">{IconoFlecha}</Button>
                <Button variant={variant} disabled>Deshabilitado</Button>
              </div>
            ))}
          </div>
        </Demo>
        <Demo label="Con ícono · ButtonLink · caso extremo: texto larguísimo">
          <div className="flex flex-wrap items-start gap-3">
            <Button variant="outline">
              {IconoFlecha}
              Ver detalle
            </Button>
            <ButtonLink href="/catalog" variant="ghost" size="sm">
              ButtonLink al índice
            </ButtonLink>
            <div className="w-56">
              <Button className="w-full">
                Descargar el informe completo de producción no convencional del segundo trimestre
              </Button>
            </div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['variant', "'solid' | 'outline' | 'ghost'", "'solid'"],
            ['size', "'sm' | 'md' | 'icon'", "'md'"],
            ['href', 'string (solo ButtonLink, requerida)', '—'],
            ['...rest', 'atributos nativos de button / a', '—'],
          ]}
        />
        <A11y>
          type=&quot;button&quot; por defecto (no dispara submits por accidente). El botón de
          solo ícono exige aria-label. Disabled con opacity + pointer-events-none. El anillo
          de foco viene del :focus-visible global.
        </A11y>
      </Seccion>

      {/* ················· 03 · Chip ················· */}
      <Seccion idx="03" title="Chip" note="filtros con aria-pressed">
        <Demo label="Estados">
          <div className="flex flex-wrap gap-2">
            <Chip>Normal</Chip>
            <Chip selected>Seleccionado</Chip>
            <Chip disabled className="opacity-45">Deshabilitado</Chip>
          </div>
        </Demo>
        <Demo label="Grupo de filtros funcional">
          <ChipFilterDemo />
        </Demo>
        <PropsTable
          rows={[
            ['selected', 'boolean', 'false'],
            ['...rest', 'atributos nativos de button', '—'],
          ]}
        />
        <A11y>
          Es un toggle: expone aria-pressed según selected. Target táctil mínimo 28px
          (WCAG 2.5.8). El grupo lleva role=&quot;group&quot; con aria-label y el resultado
          del filtro se anuncia con aria-live.
        </A11y>
      </Seccion>

      {/* ················· 04 · Badge ················· */}
      <Seccion idx="04" title="Badge" note="7 tones">
        <Demo label="Todos los tones">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="oil">Petróleo</Badge>
            <Badge tone="gas">Gas</Badge>
            <Badge tone="positive">▲ 3,2%</Badge>
            <Badge tone="negative">▼ 1,4%</Badge>
            <Badge tone="caution">Parcial</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <span className="inline-flex rounded-[8px] bg-inverse px-3 py-2">
              <Badge tone="on-dark">On-dark</Badge>
            </span>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['tone', "'oil' | 'gas' | 'positive' | 'negative' | 'caution' | 'neutral' | 'on-dark'", "'neutral'"],
            ['...rest', 'atributos nativos de span', '—'],
          ]}
        />
        <A11y>
          El color nunca es el único canal: el texto del badge dice lo que el tone insinúa
          (▲/▼ acompañan a positive/negative). on-dark solo sobre Surface inverse o photo.
        </A11y>
      </Seccion>

      {/* ················· 05 · SegmentedControl ················· */}
      <Seccion idx="05" title="SegmentedControl" note="radiogroup + flechas">
        <Demo label="Demo funcional — probá las flechas del teclado">
          <SegmentedDemo />
        </Demo>
        <PropsTable
          rows={[
            ['value', 'T extends string', '—'],
            ['onChange', '(v: T) => void', '—'],
            ['options', '{ value: T; label: ReactNode }[]', '—'],
            ['aria-label', 'string (requerida)', '—'],
          ]}
        />
        <A11y>
          role=&quot;radiogroup&quot; con roving tabindex: un solo tab stop, las flechas
          (←→↑↓) mueven selección y foco juntos. aria-checked marca la opción activa.
        </A11y>
      </Seccion>

      {/* ················· 06 · Stat ················· */}
      <Seccion idx="06" title="Stat" note="label + valor, semántica dl">
        <Demo label="Tamaños, delta y formatos">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Gas · md · compact" value={174300000} format="compact" unit="m³/d" delta={0.032} footnote="May 2026 · MoM" />
            <Stat label="Pozos · lg · integer" value={412} size="lg" delta={-0.014} footnote="Neuquén" />
            <Stat label="Participación · percent" value={0.62} format="percent" footnote="del total nacional" />
            <Stat label="Animado · animate" value={4860} animate unit="MUSD" footnote="entra en viewport" />
          </div>
        </Demo>
        <Demo label="onDark dentro de Surface inverse · caso extremo: valor gigante">
          <div className="grid gap-3 md:grid-cols-2">
            <Surface variant="inverse">
              <Stat onDark label="Producción de gas" value={174} unit="MMm³/d" delta={0.032} footnote="Nacional · MoM" />
            </Surface>
            <Surface variant="flat" className="min-w-0">
              <Stat label="Caso extremo · integer" value={99999999} unit="m³" footnote="8 dígitos sin romper la card" />
            </Surface>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['label', 'ReactNode', '—'],
            ['value', 'number', '—'],
            ['format', "'compact' | 'integer' | 'percent'", "'integer'"],
            ['unit', 'ReactNode', '—'],
            ['delta', 'number | null (fracción: 0.032 → ▲ 3,2%)', 'null'],
            ['footnote', 'ReactNode', '—'],
            ['size', "'md' | 'lg'", "'md'"],
            ['animate', 'boolean', 'false'],
            ['onDark', 'boolean', 'false'],
            ['locale', "'es' | 'en'", "'es'"],
          ]}
        />
        <A11y>
          Semántica dl/dt/dd: el lector de pantalla asocia label y valor. El contador
          respeta prefers-reduced-motion y el SSR ya muestra el valor final (sin saltos).
          Cifras en tabular-nums.
        </A11y>
      </Seccion>

      {/* ················· 07 · TextField / SelectField ················· */}
      <Seccion idx="07" title="TextField / SelectField" note="label real, nunca placeholder">
        <Demo label="Estados">
          <div className="grid max-w-[52rem] gap-5 sm:grid-cols-2">
            <TextField label="Nombre del pozo" placeholder="LCam-101(h)" />
            <TextField label="Producción diaria" hint="En m³/d, sin separador de miles." />
            <TextField label="Correo" defaultValue="lector@ejemplo" error="Ingresá un correo válido." />
            <TextField label="Cuenca (bloqueada)" defaultValue="Neuquina" disabled />
            <SelectField label="Operadora">
              <option>YPF</option>
              <option>Vista Energy</option>
              <option>Pan American Energy</option>
            </SelectField>
            <SelectField label="Recurso" error="Elegí un recurso.">
              <option value="">—</option>
              <option>Petróleo</option>
              <option>Gas</option>
            </SelectField>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['label', 'string (requerida)', '—'],
            ['hint', 'string', '—'],
            ['error', 'string | null', '—'],
            ['...rest', 'atributos nativos de input / select', '—'],
          ]}
        />
        <A11y>
          Label real asociada por htmlFor (el placeholder nunca es la etiqueta). Con error:
          aria-invalid y el mensaje con role=&quot;alert&quot;; en TextField además
          aria-describedby apunta al hint o al error.
        </A11y>
      </Seccion>

      {/* ················· 08 · Dialog ················· */}
      <Seccion idx="08" title="Dialog" note="dialog nativo">
        <Demo label="Demo — probá Escape y Tab dentro del diálogo">
          <DialogDemo />
        </Demo>
        <PropsTable
          rows={[
            ['open', 'boolean', '—'],
            ['onClose', '() => void', '—'],
            ['title', 'string', '—'],
            ['children', 'ReactNode', '—'],
          ]}
        />
        <A11y>
          Construido sobre dialog nativo con showModal(): focus trap, cierre con Escape y
          restauración del foco los da el navegador gratis. Click en el backdrop también
          cierra. El botón de cierre lleva aria-label=&quot;Cerrar&quot;.
        </A11y>
      </Seccion>

      {/* ················· 09 · DataTable ················· */}
      <Seccion idx="09" title="DataTable" note="sort accesible + colapso responsive">
        <Demo label="5 filas ordenables · celda larguísima truncada (Operadora)">
          <DataTableDemo />
        </Demo>
        <Demo label="Caso vacío — prop empty">
          <DataTableVaciaDemo />
        </Demo>
        <PropsTable
          rows={[
            ['columns', 'Column<Row>[] — key, header, cell, sort?, align?, numeric?, priority?', '—'],
            ['rows', 'Row[]', '—'],
            ['rowKey', '(row) => string', '—'],
            ['defaultSort', "{ key: string; dir: 'asc' | 'desc' }", '—'],
            ['caption', 'string (requerida)', '—'],
            ['empty', 'ReactNode', 'EmptyState kind="empty"'],
          ]}
        />
        <A11y>
          caption con sr-only nombra la tabla; los th ordenables son botones reales y el
          estado se expone con aria-sort. El contenedor con scroll es focusable
          (tabIndex=0 + role=&quot;group&quot;) para poder desplazarlo con teclado. Las
          celdas truncadas conservan el texto completo en title. Las columnas llevan
          funciones: usala desde un wrapper cliente.
        </A11y>
      </Seccion>

      {/* ················· 10 · Sparkline ················· */}
      <Seccion idx="10" title="Sparkline" note="decorativa, aria-hidden">
        <Demo label="Serie fija, dos alturas y colores por token">
          <div className="grid max-w-[40rem] gap-4 sm:grid-cols-2">
            <div className="rounded-[8px] border p-3">
              <p className="type-label mb-1">Gas · height 32</p>
              <Sparkline data={SPARK_DATA} color="var(--data-gas)" />
            </div>
            <div className="rounded-[8px] border p-3">
              <p className="type-label mb-1">Petróleo · height 48</p>
              <Sparkline data={SPARK_DATA} color="var(--data-oil)" height={48} />
            </div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['data', '{ x: string; y: number }[]', '—'],
            ['color', 'string (token CSS)', 'var(--status-positive)'],
            ['height', 'number (px)', '32'],
          ]}
        />
        <A11y>
          Es decorativa: va con aria-hidden y el valor o delta se comunica en texto al lado
          (típicamente un Stat). Con data vacía reserva el alto y no renderiza nada.
        </A11y>
      </Seccion>

      {/* ················· 11 · Donut ················· */}
      <Seccion idx="11" title="Donut" note="SVG propio, sin Recharts">
        <Demo label="Estado de pozos — animación con reduced-motion">
          <div className="flex flex-wrap items-center gap-8">
            <Donut
              title="Estado de 412 pozos: 268 activos, 96 en pausa, 48 abandonados"
              center="412"
              centerLabel="Pozos"
              segments={[
                { value: 268, color: 'var(--status-positive)', label: 'Activos' },
                { value: 96, color: 'var(--status-caution)', label: 'En pausa' },
                { value: 48, color: 'var(--status-negative)', label: 'Abandonados' },
              ]}
            />
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {[
                ['var(--status-positive)', 'Activos · 268'],
                ['var(--status-caution)', 'En pausa · 96'],
                ['var(--status-negative)', 'Abandonados · 48'],
              ].map(([color, label]) => (
                <li key={label} className="flex items-center gap-2 text-[13px] text-secondary">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['segments', '{ value: number; color: string; label: string }[]', '—'],
            ['center', 'ReactNode', '—'],
            ['centerLabel', 'string', '—'],
            ['size', 'number (px)', '180'],
            ['title', 'string (requerida)', '—'],
          ]}
        />
        <A11y>
          El SVG expone role=&quot;img&quot; con title como aria-label: el título debe
          contar los números, no solo nombrar el gráfico. La animación de entrada respeta
          prefers-reduced-motion y arranca al entrar en viewport.
        </A11y>
      </Seccion>

      {/* ················· 12 · ChartFrame ················· */}
      <Seccion idx="12" title="ChartFrame" note="cero CLS + a11y de charts">
        <Demo label="AreaChart con AXIS_TICK / GRID_PROPS / ChartTooltipBox">
          <ChartFrameDemo />
        </Demo>
        <PropsTable
          rows={[
            ['title', 'string (requerida)', '—'],
            ['summary', 'string', '—'],
            ['height', "'sm' | 'md' | 'lg' (tokens --chart-*)", "'md'"],
            ['children', 'ReactNode (el chart Recharts)', '—'],
          ]}
        />
        <A11y>
          figure con role=&quot;img&quot; y aria-label = title + summary: el resumen textual
          es la alternativa al gráfico. La altura queda reservada antes de hidratar (cero
          CLS) y el chart solo monta en cliente. AXIS_TICK y GRID_PROPS tokenizan ejes y
          grilla de Recharts.
        </A11y>
      </Seccion>

      {/* ················· 13 · ProportionBarList ················· */}
      <Seccion idx="13" title="ProportionBarList" note="ranking con barras">
        <Demo label="Top 5 operadoras — barras animadas al entrar en viewport">
          <div className="max-w-[36rem]">
            <ProportionBarList
              items={[
                { key: 'ypf', label: 'YPF', value: 812, display: '812 Mm³/d', color: 'var(--data-oil)' },
                { key: 'vista', label: 'Vista Energy', value: 640, display: '640 Mm³/d', color: 'var(--data-gas)' },
                { key: 'pae', label: 'Pan American Energy', value: 455, display: '455 Mm³/d', color: 'var(--status-positive)' },
                { key: 'tecpetrol', label: 'Tecpetrol', value: 320, display: '320 Mm³/d', color: 'var(--status-caution)' },
                { key: 'pluspetrol', label: 'Pluspetrol', value: 96, display: '96 Mm³/d' },
              ]}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['items', '{ key, label, value, display, color? }[]', '—'],
            ['max', 'number (tope de la barra)', 'máximo de items'],
            ['formatValue', '(v: number) => string', 'usa item.display'],
          ]}
        />
        <A11y>
          Lista ordenada real (ol): el ranking existe en el DOM, no solo en lo visual. El
          valor siempre está en texto (display); la barra es refuerzo. Animación con
          prefers-reduced-motion respetado.
        </A11y>
      </Seccion>

      {/* ················· 14 · EmptyState ················· */}
      <Seccion idx="14" title="EmptyState" note="vacío ≠ error ≠ offline">
        <Demo label="Los 3 kinds con sus textos por defecto">
          <div className="grid gap-3 lg:grid-cols-3">
            <EmptyState kind="empty" actionHref="/catalog" actionLabel="Limpiar filtros" />
            <EmptyState kind="error" />
            <EmptyState kind="offline" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['kind', "'empty' | 'error' | 'offline'", "'empty'"],
            ['title', 'string', 'según kind'],
            ['detail', 'string', 'según kind'],
            ['actionHref', 'string', '—'],
            ['actionLabel', 'string', "'Volver'"],
          ]}
        />
        <A11y>
          error y offline llevan role=&quot;alert&quot; (se anuncian solos); empty no
          interrumpe. Reemplaza el anti-patrón de devolver null en silencio: la pantalla
          siempre dice qué pasó y, si puede, ofrece una salida.
        </A11y>
      </Seccion>

      {/* ················· 15 · Alert ················· */}
      <Seccion idx="15" title="Alert" note="4 tones">
        <Demo label="Todos los tones">
          <div className="flex max-w-[44rem] flex-col gap-3">
            <Alert tone="info" title="Fuente de datos">
              Producción según Secretaría de Energía, capítulo IV.
            </Alert>
            <Alert tone="positive" title="Exportación lista">
              El archivo CSV se generó con los filtros activos.
            </Alert>
            <Alert tone="caution" title="Datos parciales">
              Faltan reportar 3 operadoras del último mes.
            </Alert>
            <Alert tone="negative" title="No pudimos guardar">
              Reintentá en unos minutos; tus cambios siguen en el formulario.
            </Alert>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['tone', "'info' | 'positive' | 'caution' | 'negative'", "'info'"],
            ['title', 'string', '—'],
            ['children', 'ReactNode', '—'],
          ]}
        />
        <A11y>
          negative usa role=&quot;alert&quot; (interrumpe); el resto role=&quot;status&quot;
          (cortés). El tone colorea borde y título, pero el mensaje explica en texto.
        </A11y>
      </Seccion>

      {/* ················· 16 · Skeleton ················· */}
      <Seccion idx="16" title="Skeleton" note="uno por forma de página">
        <Demo label="ListSkeleton · DetailSkeleton · MapSkeleton (miniaturas al 50%)">
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              ['ListSkeleton', <ListSkeleton key="l" />],
              ['DetailSkeleton', <DetailSkeleton key="d" />],
              ['MapSkeleton', <MapSkeleton key="m" />],
            ].map(([nombre, esqueleto]) => (
              <div key={nombre as string}>
                <p className="type-label mb-2">{nombre}</p>
                <div className="h-56 overflow-hidden rounded-[10px] border">
                  <div className="pointer-events-none w-[200%] origin-top-left scale-50">
                    {esqueleto}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['Skeleton · className', 'string (dimensiones del bloque)', "''"],
            ['ListSkeleton / DetailSkeleton / MapSkeleton', 'sin props', '—'],
          ]}
        />
        <A11y>
          aria-hidden: el esqueleto es puramente visual. El pulso usa motion-safe, así que
          desaparece con prefers-reduced-motion. Cada forma replica el layout real para que
          la carga no salte (CLS).
        </A11y>
      </Seccion>

      {/* ················· 17 · Pager ················· */}
      <Seccion idx="17" title="Pager" note="paginación por links">
        <Demo label="Primera · intermedia · última página">
          <div className="flex max-w-[30rem] flex-col gap-3">
            <Pager page={1} totalPages={5} hrefFor={(p) => `#pagina-${p}`} />
            <Pager page={3} totalPages={5} hrefFor={(p) => `#pagina-${p}`} />
            <Pager page={5} totalPages={5} hrefFor={(p) => `#pagina-${p}`} />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['page', 'number (1-based)', '—'],
            ['totalPages', 'number', '—'],
            ['hrefFor', '(page: number) => string', '—'],
          ]}
        />
        <A11y>
          nav con aria-label=&quot;Paginación&quot;. Son links reales (URL compartible, back
          del navegador funciona). Los extremos deshabilitados son span con aria-disabled,
          no links muertos.
        </A11y>
      </Seccion>

      {/* ················· 18 · SectionLabel ················· */}
      <Seccion idx="18" title="SectionLabel" note="la regla numerada">
        <Demo label="Con nota y como h3 — todas las secciones de esta página lo usan">
          <div className="flex flex-col gap-4">
            <SectionLabel as="h3" index="04" title="Producción por operadora" note="May 2026" />
            <SectionLabel as="h3" index="05" title="Sin nota lateral" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ['index', 'string', '—'],
            ['title', 'string', '—'],
            ['note', 'string', '—'],
            ['as', "'h2' | 'h3'", "'h2'"],
          ]}
        />
        <A11y>
          El título es un heading real (h2 o h3 según as): elegí el nivel que respete la
          jerarquía de la página. La nota lateral se oculta en mobile; no pongas ahí
          información imprescindible.
        </A11y>
      </Seccion>

      {/* ················· 19 · PageHero ················· */}
      <Seccion idx="19" title="PageHero" note="un solo hero por pantalla">
        <Demo label="El encabezado de esta misma página es el demo vivo">
          <p className="max-w-[44rem] text-[13px] text-secondary">
            PageHero renderiza el h1 de la página (eyebrow + título + copy + slot right).
            Por eso no se repite acá abajo: habría dos h1 en el documento. Mirá el tope de
            esta pantalla — eyebrow &quot;Catálogo · 02&quot;, título &quot;Componentes&quot;
            y un Badge en el slot right.
          </p>
        </Demo>
        <PropsTable
          rows={[
            ['eyebrow', 'string', '—'],
            ['title', 'string (se vuelve el h1)', '—'],
            ['children', 'ReactNode (copy bajo el título)', '—'],
            ['right', 'ReactNode (slot a la derecha)', '—'],
          ]}
        />
        <A11y>
          Contiene el único h1 de la página: usalo una vez por pantalla, siempre arriba. El
          título hace text-balance y break-words para titulares largos.
        </A11y>
      </Seccion>
    </div>
  )
}
