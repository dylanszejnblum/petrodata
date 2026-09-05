# DESIGN_SYSTEM_GAP_ANALYSIS.md — Auditoría de tokens y preparación del design system

> Commit `8a0a726`. Todos los conteos son de `grep` reproducible sobre `frontend/src` (excluyendo generados). Complementa a [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).

---

## 1. Estado actual: 5 sistemas de color conviviendo

| # | Sistema | Definición | Uso medido | Veredicto |
|---|---|---|---|---|
| 1 | **`--nd-*`** (13 hex + 1 rgba, dark vía `[data-theme]`) | `globals.css:98-111` / `:137-147`, expuestos en `@theme inline` | **1.157 clases + 314 `var()`** | **El sistema real. Base del DS.** |
| 2 | shadcn oklch (19 tokens) | `globals.css:112-134` / `:148-169` | 97 usos, ~88% en `ui/*` | Aislar (solo `ui/map`+`ui/select` vivos) y retirar el resto con el template |
| 3 | `tailwind.config.mjs` legacy | vivo vía `@config` en `globals.css:4` | fuentes fantasma | **Borrar** (VIS-01) |
| 4 | Paletas de dominio hardcodeadas | `operatorPalette`, `commodityColors`, `uranium/theme`, `provinceMeta`, `news/categories`, `news/meta`, `MapLegend` | 142 hex (47 distintos) | Tokenizar como capa de dominio |
| 5 | Subsistema "foto oscura" invariante al tema | inline en 7 archivos | `#16191d` + 12 alfas de white + 14 alfas de scrim | Tokenizar `surface.photo` + scrims |

Frontera limpia (medida): las carpetas de producto usan **solo** `nd-*`; `ui/*` y `blocks/*` usan solo shadcn. Casi ningún archivo mezcla → la migración es de borrado, no de desenredo.

### 1.1 Tokens `--nd-*` actuales: valores, frecuencia, problemas

| Token | Light / Dark | Usos | Problema | Token semántico futuro | Riesgo de normalización |
|---|---|---|---|---|---|
| `--nd-text-disabled` | `#999` / `#666` | **264** | **Usado como texto informativo real** (nav, labels, cabeceras) a 2.85:1 / 3.29:1 → falla AA | `text.tertiary` (nuevo valor ≥ #767676) + `text.disabled` real | **Alto — cambio visual global** |
| `--nd-border` | `#e8e8e8` / `#222` | **246** | 1.22:1 — invisible como límite de control | `border.default` (decorativo) + `border.interactive` ≥3:1 | Alto |
| `--nd-text-secondary` | `#666` / `#999` | **205** | ok (5.7:1) | `text.secondary` | Bajo |
| `--nd-text-display` | `#000` / `#fff` | **188** | ok | `text.primary` | Bajo |
| `--nd-surface` | `#fff` / `#111` | 128 (+15 con alfas /85 /90 /95 ad hoc) | alfas sin escala | `surface.base` (+ `surface.overlay` con alfa fija) | Bajo |
| `--nd-surface-raised` | `#f0f0f0` / `#1a1a1a` | 67 | — | `surface.raised` | Bajo |
| `--nd-text-primary` | `#1a1a1a` / `#e8e8e8` | 23 | redundante con display | **deprecar** | Nulo |
| `--nd-accent` | `#d71921` (sin dark) | 15 + 63 `var()` | 3.64:1 en dark; doble rol (marca + negativo/baja) | `accent.brand` + **separar `status.negative`** | Medio |
| `--nd-border-visible` | `#ccc` / `#333` | 11 | 1.61:1 | `border.strong` | Medio |
| `--nd-interactive` | `#007aff` / `#5b9bf6` | 4+2 | 4.02:1 en claro (borde de AA) | `focus.ring` | Bajo |
| `--nd-black` | `#f5f5f5` / `#000` | 3+22 | **nombre invertido** (es el canvas) | `surface.canvas` | Bajo (rename) |
| `--nd-success` | `#4a9e5c` (sin dark) | 2+49 | 3.31:1 como texto claro; `#f5f5f5` encima = 3.04:1 | `status.positive` (re-derivar) | Medio |
| `--nd-warning` | `#d4a843` (sin dark) | 1+12 | **2.21:1 como texto**; hardcodeado 4× | `status.caution` (re-derivar) | Medio |
| `--nd-accent-subtle` | `rgba(215,25,33,.15)` | 1 | — | `accent.wash` | Nulo |
| **`--nd-error`** | **NO DEFINIDO** | 1 uso (`UraniumHero.tsx:30`) | **bug en producción** | `status.negative` | Nulo — quick win |

### 1.2 Colores hardcodeados a absorber (top)

- `#22c55e`(14) `#eab308`(7) `#ef4444`(7) — `clusterColors` **triplicado literal** en `ui/map.tsx`, `MineralsMap`, +1 → `map.cluster.{low,mid,high}`
- `#d4a843`(4) — duplica `--nd-warning` (el comentario de `MapExperience.tsx:104` lo admite) → usar el token
- Paletas: `operatorPalette.ts` (9 hex → `chart.categorical.*`), `commodityColors.ts` (7 hex, **12 importadores — el token de dominio mejor adoptado, imitar su patrón**), `uranium/theme.ts` (`#00D4AA` teal fuera de escala + `#71717A` duplicando `FALLBACK`), `provinceMeta.ts` ↔ `news/categories.ts` (**mismos 6 acentos duplicados** → `region.*`)
- Colisiones: `OIL_COLOR` = `var(--nd-accent)` vs `#d6453d`; `GAS_COLOR` = `#0284c7` vs `#2f8fe0` — dos "petróleo" y dos "gas" distintos entre páginas hermanas → `commodity.oil` / `commodity.gas` únicos
- Tema Mermaid (`blocks/Chart:24-30`): réplica manual del dark `nd-*` congelada — muere con el template
- Gradientes: 12 escritos a mano; sintaxis v3 (`bg-gradient-to-t`) y v4 (`bg-linear-to-t`) mezcladas

---

## 2. Tipografía

**Cargado real:** solo Schibsted Grotesk 400/500/600 (`next/font`, correcto). `--font-mono` = Schibsted (**no es mono**; `globals.css` fuerza `letter-spacing .03em` + `tabular-nums` a los 466 usos). `--font-sans` ≡ `--font-display` = Helvetica Neue (sistema, → Arial en Win/Linux). `tailwind.config.mjs` apunta a Space Grotesk/Mono **inexistentes**. `font-bold` (6 usos) = synthetic bold.

**Distribución de tamaños:** 412 arbitrarios `text-[Npx]` (56%) vs 319 nombrados. La escala micro real: `[10px]`×183, `[11px]`×163, `[9px]`×21, `[12px]`×16, `[13px]`×6 + 13 usos de medios píxeles (ruido).

**Tracking:** 274 declaraciones, 97,8% arbitrarias, **17 valores** — 11 positivos para el gesto "label espaciado" (`[0.08em]`×180 domina) y 3 negativos para "headline".

**Recetas implícitas medidas (co-ocurrencia exacta):**

| Rol | Receta dominante | n | Variantes desviadas |
|---|---|---|---|
| Label técnico sm | `text-[10px] font-mono uppercase tracking-[0.08em]` | **119** | 8 variantes (42 usos) |
| Label técnico md | `text-[11px] font-mono uppercase tracking-[0.08em]` | **55** | |
| Número KPI | `text-3xl md:text-4xl font-display leading-none tabular-nums` | ~53 | uranium/Nothing usan `4xl md:5xl` |
| Body | `text-sm` (+`leading-relaxed`) `font-sans` | ~105 | |
| Section rule | `SectionLabel` (`text-[11px] tracking-[0.2em]`) | 6 imports | 3 clones locales |
| H1 | — | — | **~10 recetas distintas** (3 rampas, 3 pesos, 5 leadings) |

---

## 3. Espaciado, radius, bordes, sombras, motion, iconos, breakpoints (síntesis)

- **Espaciado:** rejilla de 4px cumplida al 87% (1.257 declaraciones); `gap-2`/`px-5`/`py-3`/`gap-3` dominan; `px-5 py-3` es el padding de celda de facto y `p-5` el de card — sin token. 162 usos de medios pasos (formalizar `gap-1.5` que es 6º más usado). **19 alturas de chart distintas** (`h-[280px]`×7 la más común) sin constante. 4 anchos de "columna de lectura" para un rol.
- **Radius:** `--radius` muerto (11% de usos, todos en `ui/*`); el radio real es **10px** (30 usos, sin token) vs **sharp 0** deliberado en uranium/minerals/map. `rounded-full` ×98 consistente. **Decisión de identidad pendiente (pregunta abierta #2).**
- **Bordes:** `border` 1px ×721 — el gesto estructural del sistema, muy consistente. Ojo: `globals.css:216` aplica el `--border` shadcn por defecto (VIS-14).
- **Sombras:** diseño plano deliberado; 1 sombra propietaria (`0 8px 24px -12px`, 7 usos, 2 alfas) + glows hex-concatenados → un solo token `elevation.overlay`.
- **Motion:** 6 sistemas; anime.js vía `anim.ts` es el correcto (reduced-motion en 5 helpers, 20+ consumidores). 18 duraciones JS (0–9000ms), 4 vocabularios de easing; `cubic-bezier(.16,1,.3,1)` ×8 sin nombre. Sin reduced-motion: `AnimatedCounter`, keyframes de Header (5) y NewsletterModal (9), 2 `animate-ping` infinitos.
- **Iconos:** 28 lucide + 24 SVG inline (11 duplicables por lucide); 3 notaciones de tamaño; 15 strokeWidths.
- **Breakpoints:** `md:` domina (233 usos, 68%); `2xl:86rem` con 0 usos y contradicho por `cssVariables.js` (1536) que rige el srcset de imágenes.

---

## 4. Qué pertenece al design system (y qué no)

1. **Design tokens** — todo §5.
2. **Primitivas visuales** — `Surface`, `Button`, `Chip`, `Badge`, `SegmentedControl`, `Stat`, `Skeleton`, `Sparkline`, `Donut`, `Icon` (convención), `Input`+`Field` (cuando haya forms reales).
3. **Componentes reutilizables** — `SectionLabel`, `DataTable`, `ProportionBarList`, `ChartFrame`+`ChartTooltip`, `PetrodataMap`+`MapLegend`, `PageHero`, `EmptyState`, `NewsPager`→`Pager`.
4. **Patrones de composición** — page shell (`Header`+`main`+`Footer`), grid de KPIs, sección numerada (`SectionLabel` + contenido), overlay sobre mapa, tabla-que-colapsa-a-lista.
5. **Específicos del producto (NO entran al DS)** — `WellPopup`, `NewsCard/Featured`, `StockPriceChart`, `TradeSankey`, `WorldStage`, `ProcessScrolly`, wrappers de mapa por dominio, `CompanyLogo`/`OperatorAvatar`. Consumen el DS, no lo integran.
6. **Templates** — layout de listado (hero+grid), layout de ficha (hero+stats+secciones), layout de mapa fullscreen.
7. **Reglas de contenido** — labels técnicos en MAYÚSCULAS vía token (no a mano), números siempre `tabular-nums` + formatter locale-aware, fuentes citadas con `SourceChip`.
8. **Guidelines de accesibilidad** — focus ring obligatorio en primitivas; `Stat` con `<dl>`; charts con `aria-label` + resumen; modales solo sobre un `Dialog` con trap (Radix); touch target ≥24px integrado en `Chip`/`Button`.
9. **Guidelines de motion** — todo por `lib/motion` (ex `anim.ts`); tokens de duración/easing; reduced-motion no opcional.
10. **Convenciones de implementación** — named exports, 'use client' solo con interacción real (no por `useTranslations`), módulos transversales en `lib/`, colores solo por token (lint).

---

## 5. Arquitectura de tokens propuesta

### Capa 1 — Primitivos (privados, solo los consume la capa semántica)

```css
/* neutral ramp (deriva de los nd-* actuales) */
--gray-0: #ffffff;  --gray-50: #f5f5f5;  --gray-100: #f0f0f0;
--gray-200: #e8e8e8; --gray-300: #cccccc; --gray-500: #767676; /* ← sube de #999 por AA */
--gray-600: #666666; --gray-800: #1a1a1a; --gray-950: #111111; --gray-1000: #000000;
--red-600: #d71921;             /* marca */
--green-600: #3d8a4f;           /* re-derivado ≥4.5:1 sobre blanco */
--amber-700: #9a7420;           /* re-derivado; el actual #d4a843 queda como fill, no texto */
--blue-600: #007aff; --blue-400: #5b9bf6;
```

### Capa 2 — Semánticos (la API pública; light y dark completos)

| Grupo | Tokens |
|---|---|
| Surface | `surface.canvas` (ex nd-black), `surface.base`, `surface.raised`, `surface.overlay` (base/85+blur), `surface.photo` (fijo oscuro, **por diseño**, con par `text.on-media.{primary,secondary,tertiary}`) |
| Text | `text.primary`, `text.secondary`, `text.tertiary` (ex disabled, re-derivado), `text.disabled` (real, solo controles), `text.inverse` |
| Border | `border.default` (decorativo), `border.strong`, `border.interactive` (≥3:1) |
| Brand/Status | `accent.brand`, `accent.wash`, `status.positive`, `status.caution`, `status.negative` (≠ brand — hoy el rojo hace ambos roles), `status.info` |
| Interactive | `focus.ring`, `interactive.hover-surface`, `scrim.{soft,mid,hard}` (3 pasos que reemplazan 14 alfas) |
| Typography | `font.technical` (Schibsted, ex "mono"), `font.editorial`, `type.label.{xs,sm,md}` (9/10/11px + tracking + uppercase como utilidades compuestas), `type.body`, `type.kpi.{md,lg}`, `type.h{1,2,3}` (una sola rampa) |
| Space | escala 4px + `space.card` (20px), `space.cell.{x,y}` (20/12px), `space.section` |
| Size | `size.chart.{sm,md,lg}` (240/280/400 — colapsa 19 valores), `size.prose` (uno de los 4), `size.touch` (44px), `icon.{sm,md,lg}` (14/16/20) |
| Radius | `radius.card` (**decisión pendiente: 10px o 0**), `radius.control`, `radius.pill` |
| Elevation | `elevation.overlay` (la sombra propietaria, 1 alfa) |
| Z-index | `z.{base,sticky,overlay,modal,toast}` (hoy ad hoc) |
| Motion | `motion.duration.{fast:150,base:300,slow:700,ambient:2400}`, `motion.ease.{out,in-out,spring}` (nombra el cubic-bezier ×8 y los easings de anime) |
| Breakpoints | mantener sm–xl; **resolver 2xl** (86 vs 96rem) y borrar `cssVariables.js` |
| Opacity | `opacity.disabled` (un valor — hoy 4) |

### Capa 3 — De componente (solo si un componente necesita variar por tema)

`button.bg`, `chip.border-active`, `table.header-bg`, `map.cluster.{low,mid,high}`, `chart.categorical.{1..9}`, `commodity.*`, `region.*`. Los de dominio (commodity/region/operator) viven junto al dominio pero **referencian primitivos**, no hex.

**Regla de nombres:** semántico > visual. `blue-500` no aparece en código de producto; `status.info` sí. Los primitivos existen pero no se importan fuera de la definición de semánticos.

**Riesgo de normalización:** los 3 re-derivados por contraste (`text.tertiary`, `status.caution`, `status.positive`) cambian el aspecto de cientos de elementos → requieren el visual baseline de Fase 0 y OK de diseño (pregunta abierta #6). El resto es mapping 1:1 de bajo riesgo.

---

## 6. APIs de componentes propuestas

Principios: variants por CVA (patrón ya presente en `ui/button`), composición con slots sobre props-bolsa, `asChild` para polimorfismo (Radix Slot ya instalado), refs vía `React.ComponentProps` (React 19: ref es prop), accesibilidad por defecto no desactivable, `className` como escape hatch (con `cn()` existente), nada de booleans contradictorios (`variant`, no `isPrimary`+`isGhost`).

### 6.1 `Surface` — colapsa las 6 familias de card

```tsx
type SurfaceProps = React.ComponentProps<'div'> & {
  variant?: 'flat' | 'raised' | 'overlay' | 'photo'  // photo: fondo fijo + scrim + text.on-media
  padding?: 'none' | 'sm' | 'md'                     // md = p-5 (el de facto)
  interactive?: boolean                              // hover + focus-visible + cursor
  asChild?: boolean                                  // <Surface asChild><Link/></Surface>
}
```

### 6.2 `Button` — reescrito sobre tokens nd (la CVA actual sirve de esqueleto)

```tsx
type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean
}
// variants: solid | outline | ghost | link ; sizes: sm | md | icon (todas ≥ size.touch en móvil)
// focus-visible:outline-2 outline-[--focus-ring] SIEMPRE; disabled con opacity.disabled único
```

### 6.3 `Chip` / `SegmentedControl` — colapsa 14 controles

```tsx
type ChipProps = React.ComponentProps<'button'> & {
  selected?: boolean          // emite aria-pressed
  size?: 'sm' | 'md'          // ambas ≥24px target (resuelve WCAG 2.5.8)
}
// SegmentedControl: promover el `Segmented<T>` de map/FilterPanel.tsx:235 tal cual,
// añadiendo role="radiogroup" + roving tabindex
type SegmentedControlProps<T extends string | null> = {
  value: T; onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  'aria-label': string        // obligatorio: hoy el switch de FilterPanel no tiene nombre
}
```

### 6.4 `Stat` — colapsa 10 pares label+valor y 2 contadores

```tsx
type StatProps = {
  label: ReactNode
  value: number | string
  format?: 'compact' | 'integer' | 'percent' | 'currency'   // vía lib/format, locale-aware
  unit?: ReactNode
  delta?: number | null       // renderiza ▲/▼ con status.positive/negative (no accent)
  footnote?: ReactNode
  animate?: boolean           // usa lib/motion.animateCounter (reduced-motion incluido);
                              // SSR renderiza SIEMPRE el valor final (fix del "0" del h1)
  size?: 'md' | 'lg'
}
// Markup: <dl><dt>{label}</dt><dd>{value}</dd></dl> (el patrón de StatCounters, el único semántico)
```

### 6.5 `DataTable` — colapsa 6 tablas

```tsx
type Column<Row> = {
  key: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  sort?: (row: Row) => number | string   // el contrato de SortableProjectsTable
  align?: 'left' | 'right'
  numeric?: boolean                      // tabular-nums + right
  priority?: 1 | 2 | 3                   // colapso responsive: 1 siempre visible;
}                                        // 2-3 pasan al modo lista (patrón ProjectsTable),
                                         // NUNCA se ocultan sin alternativa (fix ContributionTable)
type DataTableProps<Row> = {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  empty?: ReactNode                      // EmptyState por defecto, nunca return null
  caption?: string                       // accesible
  animateIn?: boolean                    // staggerIn en effect (no en render)
}
// Semántica <table> siempre; aria-sort + scope="col"; wrapper overflow-x-auto con tabIndex={0}
```

### 6.6 `ChartFrame` + `ChartTooltip` — colapsa la config repetida ×6

```tsx
type ChartFrameProps = {
  height?: 'sm' | 'md' | 'lg'            // size.chart.* — colapsa 19 alturas
  title: string                          // aria-label del role="img"
  summary?: string                       // resumen textual para SR (gap A12)
  children: ReactNode                    // el chart de dominio (Recharts o SVG)
}
// Internamente: useMounted + contenedor con altura reservada + role="img"
// Exporta además AXIS_PROPS / GRID_PROPS tokenizados (el `AXIS` de MacroChart:50, ahora público)
type ChartTooltipProps<T> = { render: (payload: T) => ReactNode }  // un solo TooltipPayload tipado
```

### 6.7 `PetrodataMap` — envuelve `ui/map` (no lo reemplaza)

```tsx
type PetrodataMapProps = ComponentProps<typeof Map> & {
  height?: string
  fallbackLabel?: string
}
// Absorbe: transformRequest CARTO (×6), theme dark/light (×6), renderWorldCopies (×6),
// estilos de popup nd (×3 overrides "!") y el DefaultLoader en idioma nd.
// MapLegend({ items: {color|swatch, label}[] }) único — colapsa 5 leyendas.
```

### 6.8 Overlays: adoptar Radix Dialog/Popover para `NewsletterModal`, `SettingsControl` y el menú móvil — resuelve focus trap, Escape, restauración y `aria-modal` de una vez (Radix ya es dependencia; `ui/select` demuestra el patrón).

---

## 7. Gaps de tooling del DS

| Gap | Estado | Propuesta mínima |
|---|---|---|
| Catálogo de componentes | No hay Storybook | Empezar con ruta interna `/dev/ds` (una página que monta todas las primitivas en ambos temas) — barata y suficiente para 1 dev; Storybook si el equipo crece |
| Visual regression | No hay | Playwright `toHaveScreenshot` sobre `/dev/ds` + páginas reales (Fase 0) |
| Lint de tokens | No hay | Regla ESLint / grep en CI: prohibir hex y `text-[Npx]` fuera de `tokens.css` y `lib/` |
| Documentación viva | AGENTS.md boilerplate | Reescribir AGENTS.md con: tokens, decisión de radius, mapa de caching, frontera server/client, "font-mono no es mono", estado del template |
