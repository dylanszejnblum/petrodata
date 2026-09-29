const COLORS: [string, string, string][] = [
  ['canvas', 'var(--canvas)', 'fondo de página'],
  ['surface', 'var(--surface)', 'card clara — nivel 1'],
  ['surface.raised', 'var(--surface-raised)', 'hover / cabeceras'],
  ['surface.inverse', 'var(--surface-inverse)', 'card oscura — fija (D3)'],
  ['border', 'var(--border-default)', 'hairline decorativa'],
  ['border.strong', 'var(--border-strong)', 'límites de controles'],
  ['text.primary', 'var(--text-primary)', 'titulares y cifras'],
  ['text.secondary', 'var(--text-secondary)', 'cuerpo secundario'],
  ['text.tertiary', 'var(--text-tertiary)', 'etiquetas (mín. 10px)'],
  ['data.oil', 'var(--data-oil)', 'petróleo (D6)'],
  ['data.gas', 'var(--data-gas)', 'gas (D6)'],
  ['status.positive', 'var(--status-positive)', 'subas ▲ · en vivo'],
  ['status.negative', 'var(--status-negative)', 'bajas ▼ y errores (D7)'],
  ['status.caution', 'var(--status-caution)', 'avisos y truncados'],
  ['focus.ring', 'var(--focus-ring)', 'anillo de foco'],
]

const SPACING: [string, string][] = [
  ['4', '1rem — separación entre elementos'],
  ['5', '1.25rem — padding de card (space.card)'],
  ['8', '2rem — separación de bloques'],
  ['12', '3rem — separación de secciones'],
]

function Section({ idx, title, side, children }: { idx: string; title: string; side?: string; children: React.ReactNode }) {
  return (
    <section className="pt-12">
      <div className="mb-6 flex items-baseline gap-4 border-b pb-2.5">
        <span className="type-label-md !text-primary">{idx}</span>
        <h2 className="type-h2">{title}</h2>
        {side && <span className="type-label ml-auto">{side}</span>}
      </div>
      {children}
    </section>
  )
}

export default function Fundaciones() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 pt-10 md:px-8">
      <p className="type-label-md mb-2">Catálogo · 01</p>
      <h1 className="type-h1">Fundaciones</h1>
      <p className="mt-2 max-w-[44rem] text-secondary">
        Los tokens de Estrato v0.3 aplicados en el stack real. Cambiá el tema (arriba a la
        derecha) y navegá con Tab para ver el anillo de foco: las fundaciones incluyen la
        accesibilidad, no la posponen.
      </p>

      <Section idx="01" title="Color" side="el color pertenece a los datos">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {COLORS.map(([name, varRef, use]) => (
            <div key={name} className="overflow-hidden rounded-[10px] border bg-surface">
              <div className="h-14" style={{ background: varRef }} />
              <div className="px-3 py-2.5">
                <p className="text-[12.5px] font-medium text-body">{name}</p>
                <p className="text-[11px] text-tertiary">{use}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section idx="02" title="Tipografía" side="dos voces, nunca tres">
        <div className="flex flex-col divide-y">
          {[
            ['Display · Inter Tight 700', <span key="d" className="type-display text-[clamp(2.2rem,5vw,3.6rem)] tnums">174,3 MMm³/d</span>],
            ['H1 · Inter Tight 700 · 36px', <span key="h1" className="type-h1">La roca que volvió exportador al país</span>],
            ['H2 · Inter Tight 600 · 23px', <span key="h2" className="type-h2">Producción por operadora en la ventana de shale</span>],
            ['KPI · Inter Tight 700 · tabular', <span key="k" className="type-kpi text-[2.6rem]">$4.860 M</span>],
            [
              'Body · Schibsted 400 · 14px',
              <span key="b" className="block max-w-[42rem] text-body">
                El gas de Vaca Muerta cubrió dos tercios de la demanda nacional en mayo y por
                primera vez el invierno se pasa sin importar GNL.
              </span>,
            ],
            ['Label · Schibsted 500 · 10px · caps · +8%', <span key="l" className="type-label">Producción de gas · May 2026 · MoM</span>],
          ].map(([spec, sample], i) => (
            <div key={i} className="grid items-baseline gap-2 py-4 md:grid-cols-[15rem_1fr]">
              <span className="type-label !normal-case !tracking-normal tnums">{spec}</span>
              {sample}
            </div>
          ))}
        </div>
      </Section>

      <Section idx="03" title="Superficies" side="la oscuridad es jerarquía, no tema">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="type-label mb-2">
              <b className="font-medium text-primary">Nivel 1</b> · clara — la base
            </p>
            <article className="flex min-h-[230px] flex-col gap-3 rounded-[10px] border bg-surface p-5">
              <span className="type-label">Noticias · Producción</span>
              <h3 className="type-card-title">YPF adelanta el pico de Loma Campana a 2027</h3>
              <p className="text-[13.5px] text-secondary">
                La operadora suma dos sets de fractura y reordena su plan de pads.
              </p>
              <div className="mt-auto flex justify-between type-label tnums">
                <span>04 AGO 2026</span>
                <span>ENERGÍA ON</span>
              </div>
            </article>
          </div>
          <div>
            <p className="type-label mb-2">
              <b className="font-medium text-primary">Nivel 2</b> · oscura — énfasis
            </p>
            <article className="flex min-h-[230px] flex-col gap-3 rounded-[10px] border border-white/10 bg-inverse p-5">
              <span className="type-label !text-on-dark-3">Producción de gas · May 2026</span>
              <p className="type-kpi text-[2.6rem] !text-on-dark">
                174,3 <small className="font-sans text-[11px] font-normal opacity-55">MMm³/d</small>
              </p>
              <p className="text-[13.5px] text-on-dark-2">
                Récord histórico. Dos tercios del total nacional salen del shale.
              </p>
              <div className="mt-auto flex justify-between type-label !text-on-dark-3 tnums">
                <span>NACIONAL · MoM</span>
                <span className="!text-positive">▲ 3,2%</span>
              </div>
            </article>
          </div>
          <div>
            <p className="type-label mb-2">
              <b className="font-medium text-primary">Nivel 3</b> · foto — protagonismo
            </p>
            <article
              className="relative flex min-h-[230px] flex-col justify-end gap-3 overflow-hidden rounded-[10px] border border-white/10 p-5"
              style={{
                background:
                  'linear-gradient(160deg, var(--scrim-soft) 0%, var(--scrim-mid) 55%, var(--scrim-hard) 100%), radial-gradient(120% 90% at 78% 12%, #6c6f73 0%, #45484c 34%, #26292d 68%, #131518 100%)',
              }}
            >
              <span className="type-label self-start rounded-full border border-white/30 px-2 py-0.5 !text-on-dark">
                Neuquén
              </span>
              <h3 className="type-card-title !text-white">
                La provincia que perfora el 91% del shale argentino
              </h3>
              <div className="flex justify-between type-label !text-on-dark-3 tnums">
                <span>PROVINCIAS</span>
                <span>412 POZOS ACTIVOS</span>
              </div>
            </article>
          </div>
        </div>
      </Section>

      <Section idx="04" title="Espaciado y forma" side="escala de 4px · radio 10px">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[10px] border bg-surface p-5">
            <p className="type-label-md mb-4">Pasos de la escala</p>
            <div className="flex flex-col gap-3">
              {SPACING.map(([step, use]) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="type-label w-6 tnums">{step}</span>
                  <span className="h-2 rounded-full bg-line-strong" style={{ width: `${Number(step) * 0.25}rem` }} />
                  <span className="text-[12px] text-tertiary">{use}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[10px] border bg-surface p-5">
            <p className="type-label-md mb-4">Radios — los tres únicos</p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid size-20 place-items-center rounded-[10px] border bg-raised text-[11px] text-secondary">10px</div>
              <div className="grid h-12 w-24 place-items-center rounded-[8px] border bg-raised text-[11px] text-secondary">8px</div>
              <div className="grid h-9 w-24 place-items-center rounded-full border bg-raised text-[11px] text-secondary">pill</div>
            </div>
            <p className="mt-4 text-[12.5px] text-tertiary">
              Borde 1px como estructura. Única sombra: overlays flotantes.
            </p>
          </div>
        </div>
      </Section>

      <Section idx="05" title="Motion" side="respeta prefers-reduced-motion, siempre">
        <div className="rounded-[10px] border bg-surface p-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              ['fast', '150ms', 'hover, foco'],
              ['base', '300ms', 'transiciones de UI'],
              ['slow', '700ms', 'entradas de datos, barras'],
              ['ambient', '2400ms', 'pulso "en vivo"'],
            ].map(([name, ms, use]) => (
              <div key={name} className="flex items-baseline gap-2">
                <span className="type-label-md !text-primary">{name}</span>
                <span className="text-[12px] text-secondary tnums">{ms}</span>
                <span className="text-[12px] text-tertiary">· {use}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <span aria-hidden className="size-1.5 rounded-full bg-positive motion-safe:animate-pulse" />
            <span className="type-label">Datos en vivo — el único pulso permanente del sistema</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
