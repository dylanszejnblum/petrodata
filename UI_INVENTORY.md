# UI_INVENTORY.md — Inventario de componentes y pantallas + matriz de duplicación

> Commit auditado: `8a0a726` (develop). Complementa a [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).
> **Usos** = archivos que importan el componente (grep de imports). `0*` = alcanzado solo vía `next/dynamic`.
> **Rol DS**: `token` · `primitiva` · `patrón` (composición reutilizable) · `dominio` (acoplado a datos Petrodata) · `no-DS` (infra/página).
> Superficie: ~200 archivos de componentes (21.295 LOC) + 16 archivos de ruta.

---

## 1. Inventario de componentes

### 1.1 Primitivas — `src/components/ui/` (shadcn + mapcn)

| Componente | Ubicación (LOC) | Propósito | Usos | Estado | Riesgo | Acción recomendada |
|---|---|---|---|---|---|---|
| `Button` + `buttonVariants` | `ui/button.tsx` (52) | Botón CVA 6 variants × 5 sizes, tokens shadcn | 4 — **todos en código muerto** | template-legacy | Alto (falsa sensación de tener primitiva) | **Reescribir sobre `nd-*`** y adoptar (Fase 2) |
| `Card` +5 sub | `ui/card.tsx` (61) | Card shadcn `rounded-lg p-6` | **0** | muerto | — | Borrar; el DS usará `Surface` |
| `Checkbox` / `Input` / `Label` / `Textarea` | `ui/*` (29/22/19/20) | Radix/shadcn | 1–9, todos muertos | template-legacy | — | Borrar con el template; re-generar al necesitar forms |
| `Select` +6 sub | `ui/select.tsx` (166) | Radix select | 5 (1 vivo: `map/FilterPanel`) | **activo parcial** | Bajo | Conservar; único overlay con focus-trap correcto del repo |
| `Pagination` +6 | `ui/pagination.tsx` (92) | Paginación shadcn | 1 (muerto) | template-legacy | — | Borrar (`NewsPager` es la real) |
| **`Map` +12 sub** | `ui/map.tsx` (**1.526**) | Wrapper MapLibre completo (markers, popups, clusters, controls, theming, fallback raster) | **8** | **activo — la única primitiva real del repo** | Medio (1 archivo, 12 eslint-disable, vendored de `@mapcn`) | Conservar; envolver en `PetrodataMap` (no tocar internals) |

> De 9 primitivas, **8 sirven solo a código muerto**. La única masivamente usada no vino de shadcn sino del registry `@mapcn`.

### 1.2 Controles — no existen como componentes (14 implementaciones ad hoc)

| "Componente" local | Ubicación | Forma | Consolida en |
|---|---|---|---|
| `FilterChip` | `entities/SortableProjectsTable.tsx:144` | border + fondo invertido inline-style | `Chip` |
| `FilterButton` | `uranium/UraniumProjectsTable.tsx:198` | bg-raised + borderBottom teal | `Chip` |
| `PriceChip` | `indicadores/DayValueCard.tsx:182` | pill rgba hardcoded | `Chip` |
| `ChipGroup` | `news/NewsFilters.tsx:17` | facetas con `aria-pressed` | `Chip` |
| `Chip` | `minerals/projects/[name]/page.tsx:440` | estático | `Chip` |
| `Segmented`/`FilterRow` | `map/FilterPanel.tsx:235,267` | **genérico `<T>` — el mejor, pero privado** | **promover a `SegmentedControl`** |
| Rango 1M/3M/6M/1Y/5Y | `entities/StockPriceChart.tsx` | segmented inline | `SegmentedControl` |
| Toggle GDP/USD | `indicadores/CruceChart.tsx` | segmented inline | `SegmentedControl` |
| `DeltaChip` | `indicadores/KpiGrid.tsx:15` | pill `color-mix` | `Badge` |
| `SourceChip` | `indicadores/SourceChip.tsx` (3 usos — único chip exportado) | pill de fuente | `Badge` |
| `StatusBadge`/`ResourceChip`/`VmBadge` | `map/WellPopup.tsx:68,101,123` | 3 badges en 1 archivo | `Badge` variants |
| `CompanyBadge` | `entities/CompanyList.tsx:168` | badge de tipo | `Badge` |
| `MobileToggle` | `MapExperience.tsx:492` | toggle de paneles | `Button variant=toggle` |
| `CtaLink` | `uranium/UraniumHero.tsx:117` | CTA accent | `Button variant=link` |

### 1.3 Navegación y shell

| Componente | Ubicación (LOC) | Usos | Estado | Rol DS | Notas |
|---|---|---|---|---|---|
| `NothingHeader` | `Nothing/Header.tsx` (342) | **17** | activo | patrón app-shell | 'use client'; menú móvil por portal sin focus trap ni Escape (A11Y A8/A9); 4 SVG inline sin aria-hidden |
| `NothingFooter` | `Nothing/Footer.tsx` (128) | **16** | activo | patrón | 'use client' solo por `useTranslations` → candidato a server |
| `LanguageSwitcher` | `Nothing/LanguageSwitcher.tsx` (48) | 1 | activo | patrón | |
| `SettingsControl` | `Nothing/SettingsControl.tsx` (122) | 1 | activo | patrón | dialog con Escape pero sin trap; radiogroup sin flechas |
| `SectionLabel` | `Petrodata/SectionLabel.tsx` (42) | **6** | activo | **patrón DS — el único autodeclarado** ("Design-system section rule") | Emite `<h2>` real; 3 clones locales lo ignoran (§2.12) |
| `NewsPager` | `news/NewsPager.tsx` (69) | 1 | activo | patrón | no usa `ui/pagination` |
| `Header/` + `Footer/` (template) | `src/Header`, `src/Footer` | 0 | **muertos** | no-DS | `RowLabel` sí vive en admin |
| `AdminBar` | `components/AdminBar` (89) | 1 | activo | no-DS | |

Duplicación de shell: el bloque `eyebrow + h1 + p` copiado literal en 3 páginas (`exportaciones`, `companies`, `provincias`); **16 variantes de `h1 font-display`**; 5 variantes de `<main className>`. → candidato `PageHero`.

### 1.4 Inputs / Forms

El frontend productivo tiene **2 inputs de texto** (`FooterNewsletterForm.tsx:53`, `NewsletterModal.tsx:360`) y **ninguno** usa `ui/input`; ambos con placeholder como única etiqueta (A11Y A10). El form-builder del template (`blocks/Form/*`, react-hook-form, labels correctos) está completo y muerto. `FilterPanel` (300 LOC) es el único consumidor vivo de `ui/select`.

### 1.5 Feedback (loading / empty / error)

| Patrón | Ubicación | Estado |
|---|---|---|
| `SkeletonPulse` | `[locale]/loading.tsx:3` — **privado**, `rounded-[2rem]` (radio que no existe en el resto del sistema) | único loading.tsx para 16 rutas, con forma del home → layout shift en 15 |
| Placeholder de `nextDynamic` | `animate-pulse bg-nd-surface-raised` **literal en 6 páginas** (2 variantes de altura) | duplicado ×6, pero consistente (no spinners) — buen criterio |
| `DefaultLoader` | `ui/map.tsx:184` — usa token **shadcn** (`bg-muted-foreground/60`) | único loader fuera del idioma `nd-*` |
| Empty states | 30+ guardas con copy traducido (lo mejor del repo) + **8 componentes que hacen `return null` silencioso** (`ContributionTable:39`, `KpiGrid:101`, `MacroChart:56`, `OperatorLeaderboard:37`…) → títulos huérfanos en `/indicadores` si el backend devuelve vacío | 5 markups distintos de "sin resultados" |
| `StockPriceEmpty` | `entities/StockPriceChart.tsx:157` | único empty-state nombrado — candidato `EmptyState` |
| Error boundaries / Suspense | **no existen** (0/0) | Critical (ARQ-05) |

### 1.6 Overlays

| Componente | Ubicación (LOC) | Usos | Rol DS | Notas |
|---|---|---|---|---|
| `OverlayCard`+`OverlayLabel` | `map/OverlayCard.tsx` (34) | **4** | **mejor candidato a `Surface variant=overlay`** | `bg-nd-surface/85 backdrop-blur shadow propietaria` |
| `WellPopup` | `map/WellPopup.tsx` (287) | 1 | dominio | 3 badges + MetaRow + tiles; datos async sin aria-live |
| `NewsletterModal` | `Nothing/NewsletterModal.tsx` (400) | 0* | overlay | sin Radix Dialog, sin focus trap; 9 keyframes sin reduced-motion |
| Leyendas de mapa | **5 implementaciones**: `map/MapLegend.tsx` (98), `MineralsMap.tsx:164` (mismo nombre, otro archivo), inline en `EntityMap.tsx:56`, `UraniumMap.tsx:197`, `minerals/page.tsx:328` | — | **duplicado ×5** → `MapLegend items[]` único |
| Popups MapLibre | 3 con overrides `!rounded-none !bg-nd-surface` repetidos + parche global en `globals.css:23-28` | — | absorber en `PetrodataMap` |

### 1.7 Data display — tablas y listas

| Componente | Ubicación (LOC) | Técnica | Usos | Notas |
|---|---|---|---|---|
| `SortableProjectsTable` | `entities/` (160) | `<table>`, **sort genérico por `cells[key].sort`** | 1 | el contrato base para `DataTable`; sin `scope=col` |
| `UraniumProjectsTable` | `uranium/` (222) | `<table>`, sort por union hardcodeada | 1 | duplicado del anterior; `staggerIn` **durante el render** (side-effect) pero sí tiene `scope=col` |
| `ProjectsTable` | `minerals/` (128) | `<ul>`+grid, colapso móvil con labels inline | 2 | **el mejor patrón responsive del repo**; pierde semántica de tabla |
| `ContributionTable` | `indicadores/` (147) | div-grid + barras animadas | 1 | oculta 4/7 columnas en móvil (pérdida de datos) |
| `OperatorLeaderboard` | `indicadores/` (89) | div-grid + barras | 1 | **comparte bloque de animación carácter por carácter con ContributionTable** |
| `EntriesTable` | `minerals/projects/[name]/page.tsx:537` | `<table>` local a la página | 1 | sexta implementación |
| `TopOperatorsCard` / `TopOperatorsMini` | `map/` (90) / `dashboard/` (77) | `<ul>` + barras proporción + avatar | 1 c/u | misma semántica, otro markup → `ProportionBarList` |
| `CompanyList` / `ProvinceList` | `entities/` (220/126) | grids de tarjetas | 1 c/u | dominio |
| `EntityTimeline` | `entities/` (88) | timeline | 1 | patrón |

**Compartido entre las 6 tablas: cero** (ni tipo, ni comparador, ni `<Th>`).

### 1.8 Data display — charts (20 componentes, 3 tecnologías, 0 abstracción)

- **Recharts (10):** `ProductionChart`†, `MiniSparkline`†, `Sparkline`, `VmShareDonut`, `RampChart`, `MacroChart`, `ActividadChart`, `CruceChart`, `BreakevenTrend`, `ChartBlockComponent`† († = muerto). 6 tooltips custom distintos; config de ejes idéntica copiada en 6.
- **SVG a mano (6):** `StockPriceChart` (425 — **el componente accesible modelo del repo**), `ProvinceProductionChart` (235), `TradeSankey` (322), `PriceChart` (276), `StatusDonut` (129), `CycleOverview` (186).
- **CSS puro (4):** `ProvinceBarChart` (server-rendered, comentado "CSS-only"), `StatusGroupChart`, `CapexChart`, `TradeChart` (+ `CommodityBreakdownBars` muerto).

### 1.9 Dominio por sección (resumen; LOC total 13.465)

| Sección | Archivos | Piezas clave | Última modificación | Lenguaje visual |
|---|---|---|---|---|
| `dashboard/` | 9 | HeroCards, AnimatedCounter†bug, VmShareDonut, TopOperatorsMini, MapPreview, MapBand, operatorPalette | **2026-08-04** | card-style (ola 3) |
| `news/` | 12 | NewsCard/Featured/SecondaryRow/Filters/Pager, categories, meta | 2026-08-03 | card-style (ola 3) |
| `entities/` | 17 | SortableProjectsTable, StatCounters, StockPriceChart, EntityMap, CompanyList, TradeSankey, TradeFlowExplorer | 2026-07-31 | mixto (ola 2 parcial) |
| `indicadores/` | 16 | KpiGrid, DayValueCard, WorldStage (521), charts ×5, SourceChip | 2026-07-27 | vacamuerta-diseno01 (ola 2) |
| `map/` | 13 | MapExperience (519), FilterPanel, WellPopup, OverlayCard, wellStatus | **2026-07-06 (congelado)** | Nothing v1 |
| `minerals/` | 12 | MineralsMap (465), ProjectsTable, PriceCard (3 exports), commodityColors (12 importadores — el token mejor adoptado) | **2026-05-31 (abandonado)** | Nothing v1 |
| `uranium/` | 15 | UraniumHero, ProcessScrolly, StatusDonut, **anim.ts (28 importadores — módulo más reutilizado)**, theme.ts, StepScene (605, muerto) | **2026-05-31 (abandonado)** | "Bloomberg × Linear" v1 |

### 1.10 Template CMS (todo inalcanzable desde rutas públicas)

`blocks/` (30 archivos, ~2.100 LOC) + `heros/` (6) + `RichText`, `Card`, `CollectionArchive`, `Pagination`, `PageRange`, `PayloadRedirects`, `LivePreviewListener`, `Media/`, `search/Component` ≈ **3.400 LOC**. Conservar: `AdminBar`, `BeforeDashboard`/`BeforeLogin` (⚠️ en realidad tampoco están registrados en `importMap`/config — muertos de verdad), configs de collections.

---

## 2. Matriz de duplicación

> Criterio: no fusionar por parecido visual; evaluar diferencia funcional y semántica. Veredictos: **FUSIONAR** (mismo rol), **PROMOVER** (elegir el mejor y deprecar el resto), **NO FUSIONAR** (roles distintos).

| # | Grupo | Piezas | Veredicto | Ganador y por qué |
|---|---|---|---|---|
| 2.1 | Sparkline | `dashboard/Sparkline.tsx` (muerto) vs `map/Sparkline.tsx` (vivo) — diff de 15 líneas de ruido; delta real: gradientId auto (`useId`) vs prop obligatoria | **FUSIONAR** | La API de `dashboard/` (useId, SSR-safe) con el estado vivo de `map/` → `ui/sparkline.tsx` |
| 2.2 | anim | `uranium/anim.ts` (implementación, 137) vs `indicadores/anim.ts` (re-export puro, 18) | **NO FUSIONAR — REUBICAR** | No es duplicación: es un módulo transversal mal ubicado. Mover a `src/lib/motion.ts`, dejar shims |
| 2.3 | Tablas | 6 implementaciones (ver §1.7) | **FUSIONAR en `DataTable`** + **`ProportionBarList`** (Contribution/Leaderboard/TopOperators×2) | Contrato de `SortableProjectsTable` (sort genérico) + responsive de `ProjectsTable` (colapso a lista) + a11y de `UraniumProjectsTable` (`scope=col`) |
| 2.4 | Cards | 11 patrones en 6 familias (A shadcn muerta / A' template / B dashboard-10px / B' kpi / C foto-oscura / D editorial / E sharp / F overlay) | **FUSIONAR en `Surface`** con variants `flat\|raised\|overlay\|photo` | La familia B es la más reciente y la dirección declarada (ola 3); F (`OverlayCard`) ya es composable. **C requiere decisión** (hoy rompe light mode) |
| 2.5 | Label+valor | 10 impls (`Stat`, `Figure`, `Cell`, `Meta`, `MetaRow`×3, `KpiTile`, `KvCard`, `HeroKpi`, `ProductionTile`, `RankStat`) — todas `text-[10px] uppercase tracking-[0.08em] + tabular-nums` | **FUSIONAR en `Stat`** | El de `StatCounters` (usa `<dl>/<dt>/<dd>` — el único semántico) |
| 2.6 | Contadores | `AnimatedCounter` (RAF propio, sin reduced-motion, SSR="0") vs `animateCounter` de anim.ts (correcto) | **PROMOVER anim.ts** | Borra 2 bugs de una vez (COMP-08) |
| 2.7 | Donuts | `VmShareDonut` (Recharts, 2 segmentos) vs `StatusDonut` (SVG, N segmentos, reduced-motion) | **PROMOVER StatusDonut** → `Donut` | Menos dependencia, más capaz; añadirle el center-slot animado |
| 2.8 | Mapas | 6 wrappers con boilerplate idéntico ×6 (`transformRequest`, `CARTO_FONTS_PREFIX`, theme, `renderWorldCopies`) + 5 leyendas + 3 estilos de marker + 3 popups con overrides `!` | **EXTRAER `PetrodataMap` + `MapLegend`** — los 6 wrappers siguen existiendo (tienen roles distintos reales) | Elimina ~150 LOC y 6 puntos de deriva sin fusionar dominios |
| 2.9 | Chart config | ejes/grid/margin idénticos ×6; `AXIS` de `MacroChart:50` ya extraído pero no exportado; 4 declaraciones del tipo TooltipPayload | **EXTRAER `ChartFrame` + `ChartTooltip`** | ~250 LOC menos; los charts siguen siendo de dominio |
| 2.10 | Formatters | 4 "compact" (`formatCompact`, `formatCompactUSD` copia con $, `AnimatedCounter.format`, `UraniumSection.compact`) + 5 de fecha + 46 call-sites Intl con 3 políticas de locale | **FUSIONAR en `src/lib/format.ts`** | `formatCompact` de utilities como base + firma con `locale` obligatorio |
| 2.11 | Skeletons | placeholder dynamic ×6 + `SkeletonPulse` privado + `DefaultLoader` shadcn | **EXTRAER `Skeleton`** + `loading.tsx` por segmento (mínimo 3 formas: listado/detalle/mapa) | |
| 2.12 | Section headers | `SectionLabel` (DS declarado) vs `SectionHead`×2 y `SectionHeader` locales que lo ignoran | **PROMOVER SectionLabel** (añadir variante con h-nivel configurable) | Ya existe y emite `<h2>` semántico |
| 2.13 | Misc literales | `num()` guard ×4 · `LegendDot` ×2 · `Legend` chart ×2 · `slugify` 2 estrategias · `useMounted` repetido en 9 | **FUSIONAR** en `src/lib/` | mecánico |

---

## 3. Inventario de pantallas

Layout raíz `(frontend)/layout.tsx` (169): fuente + `NextIntlClientProvider` (mensajes completos ~32KB) + Providers + AdminBar + GA/Clarity. `[locale]/layout.tsx` solo valida locale. **No hay layouts por sección.** 12/14 páginas `force-dynamic`.

| Ruta (LOC) | Objetivo | Componentes principales | Loading | Empty | Error | Responsive (sm/md/lg/xl) | Riesgos clave | Prioridad migración |
|---|---|---|---|---|---|---|---|---|
| `/` (377) | Dashboard nacional O&G | HeroCards, AnimatedCounter, VmShareDonut, TopOperatorsMini, MapPreview*, MapBand*, NewsCard, SectionLabel | 🟡 global | 🟡 silencioso | ❌ | 2/6/2/0 | `<h1>` = contador animado (SSR "0", CLS, sin reduced-motion); ISR 300s ok | **Alta** — define KPI/donut/ranking/card del DS |
| `/map` (127) | Mapa interactivo de pozos | MapExperience* (519) | 🟡 | 🟡 | ❌ | **0/0/0/0** | Sin heading; 100% inaccesible por teclado; fitBounds roto en móvil; congelada desde julio | **Alta** — producto central |
| `/indicadores` (280) | Tesis de inversión | KpiGrid, DayValueCard, VmHighlightCard, ContributionTable, OperatorLeaderboard, 5 charts, WorldStage (521), SourceChip | 🟡 | 🟡 return-null → títulos huérfanos | ❌ | 2/13/1/0 | 9 componentes con `es-AR` fijo → `/en` mal formateado; cards dark-only en tema claro | **Alta** — valida charts + fix locale |
| `/minerals` (391) | Hub minería | MineralsMap*, CommodityRollupCard, ProjectsTable, LivePrices, 3 charts CSS | 🟡 | ✅ | ❌ | 0/17/3/0 | N+1 de 20 requests; 0 breakpoints `sm`; abandonada desde mayo | Media-alta |
| `/minerals/[commodity]` (414) | Detalle commodity | ídem + PriceDetailCard, UraniumSection | 🟡 | ✅ | 🟡 notFound | 1/15/1/0 | duplica ~60% de `/minerals` | Media |
| `/minerals/uranium` (319) | Hub educativo uranio | UraniumHero, 10 componentes client estáticos + UraniumMap* | 🟡 | ✅ | ❌ | 0/8/1/0 | Ruta más pesada (recharts+animejs estáticos); sub-DS propio teal/amber; consistente internamente | Media (migrar al final) |
| `/minerals/projects/[name]` (**653**) | Ficha proyecto | ProjectLocationMap* + **7 componentes locales** (Chip, MetaRow, KpiTile, KvCard, SectionHeader, EntriesTable, StockCard) | 🟡 | ✅ | 🟡 notFound | 0/11/3/0 | Página más larga del repo; 7 primitivas latentes | **Alta** — máximo retorno de extracción |
| `/companies` (90) | Listado companies | CompanyList | 🟡 | delegado | ✅ | 1/2/0/0 | hero copiado ×3 | Baja (mecánica con `PageHero`) |
| `/companies/[slug]` (503) | Ficha company | CompanyLogo, StatCounters, StockPriceChart, EntityTimeline, SortableProjectsTable, EntityMap* | 🟡 | ✅ | 🟡 notFound | **27/9/9/1 (la mejor)** | regex de madurez en la página; helpers locales | Media-alta |
| `/provincias` (94) | Listado provincias | ProvinceList | 🟡 | ❌ | ✅ | 1/2/0/0 | | Baja |
| `/provincias/[slug]` (415) | Ficha provincia | ProvinceProductionChart, ProvinceStatCards, HeroKpi local | 🟡 | 🟡 | 🟡 notFound | 2/4/**0**/0 | `force-dynamic` contradictorio (quick win #7); 0 `lg:` | Media |
| `/exportaciones` (66) | Resumen exportaciones | ExportSummaryView (319) | 🟡 | ✅ | ✅ | 1/2/0/0 | toda la UI en 1 componente | Baja |
| `/noticias` (131) | Listado noticias | NewsFeatured, NewsSecondaryRow, NewsCard, NewsFilters, NewsPager | 🟡 (forma de home) | ✅ | 🔴 **única página sin try/catch** → pantalla blanca | 0/3/3/0 | `NewsSponsors` zombie comentado | Media |
| `/noticias/[docId]` (312) | Artículo | NewsBody, NewsPhoto, meta | 🟡 | ❌ | 🔴 sin try/catch, solo notFound | 0/3/0/0 | tipografía editorial sin `prose` pese a plugin instalado | Baja-media |
| `not-found` (51) | 404 | — | — | — | — | 0/1/0/0 | **hardcodeada en inglés** | Baja (quick win) |
| `loading` (48) | Skeleton global | SkeletonPulse | — | — | — | 0/3/3/0 | forma del home para 15 rutas ajenas; `rounded-[2rem]` fantasma | **Alta** (barato, alto impacto CLS) |

**Orden de migración sugerido:** `loading/error` → `/` → `/indicadores` → `/minerals/projects/[name]` → `/map` → listados (`companies`/`provincias`/`exportaciones` con `PageHero`) → `/noticias` → `/minerals/*` → `/minerals/uranium` último (el más consistente internamente, el que menos gana).

---

## 4. Hallazgos de accesibilidad manual pendientes (no determinables por código)

1. Contraste real de overlays translúcidos sobre tiles de mapa (claro y oscuro).
2. Anuncio efectivo de `role="img"` de los SVG de uranium en NVDA/VoiceOver.
3. Verbosidad de la live region conducida por scroll (`ProcessScrolly:153`, 12 pasos).
4. Zoom 400%/reflow en `/map` (`h-dvh overflow-hidden`) y en las 6 tablas.
5. Escape y foco en `NewsletterModal`.
6. `fitBounds` móvil con filtro de provincia (viewport 375px).
7. Orden de tabulación con los 3 modales abiertos (¿el foco escapa al fondo?).
8. Recorte de outlines de foco por `overflow-hidden` en cards.
