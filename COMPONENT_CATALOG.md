# COMPONENT_CATALOG.md — Catálogo de componentes Estrato (v0.1 del DS ejecutable)

> Código: `apps/ui-prototype/src/ui/` · Demo viva: `/catalog/componentes` y `/catalog/patrones` (variantes, estados, casos extremos, notas de a11y). Estados de aprobación: todos **Ready for review**.

## Primitivas

| Componente | API (props principales) | Absorbe de producción | A11y de serie |
|---|---|---|---|
| `Surface` | `variant: flat\|raised\|inverse\|photo\|overlay · padding · interactive` | 11 patrones de card en 6 familias | jerarquía por superficie, no por color de texto |
| `Button` / `ButtonLink` | `variant: solid\|outline\|ghost · size: sm\|md\|icon` | 45 `<button>` crudos | focus ring global, disabled único, min-height |
| `Chip` | `selected` | 14 controles ad hoc | `aria-pressed`, target ≥28px |
| `Badge` | `tone: oil\|gas\|positive\|negative\|caution\|neutral\|on-dark` | badges dispersos ×6 | color + texto (no solo color) |
| `SegmentedControl<T>` | `value · onChange · options · aria-label` | 4 segmented inline (promovido de FilterPanel) | radiogroup + roving tabindex + flechas |
| `Stat` | `label · value · format · unit · delta · footnote · size sm\|md\|lg · animate · onDark` | 10 pares label+valor + 2 contadores | `<dl>` semántico, SSR con valor final, reduced-motion |
| `TextField` / `SelectField` | `label · hint · error` | inputs con placeholder-como-label | label real, `aria-invalid`, `aria-describedby`, `role=alert` |
| `Dialog` | `open · onClose · title` | 3 modales sin trap | `<dialog>` nativo: trap + Escape + restauración gratis |
| `Skeleton` + `List/Detail/MapSkeleton` | — | 6 placeholders duplicados + loading único | `aria-hidden`, `motion-safe` |
| `EmptyState` | `kind: empty\|error\|offline · action` | 5 markups + 8 return-null silenciosos | distingue vacío de error; `role=alert` en errores |
| `Alert` | `tone: info\|positive\|caution\|negative` | avisos ad hoc | `role=status/alert` |

## Datos y visualización

| Componente | API | Absorbe | A11y |
|---|---|---|---|
| `DataTable<Row>` | `columns{key,header,cell,sort,align,numeric} · rows · rowKey · defaultSort · caption · empty` | 6 tablas sin código común | `<table>` real, `caption`, `scope=col`, `aria-sort`, wrapper `tabIndex=0` |
| `ChartFrame` + `AXIS_TICK/GRID_PROPS/ChartTooltipBox` | `title · summary · height sm\|md\|lg` | config Recharts copiada ×6, 19 alturas → 3 | `role=img` + resumen textual, altura reservada (0 CLS) |
| `Sparkline` | `data · color · height` | 2 duplicadas | decorativa (`aria-hidden`) |
| `Donut` | `segments · center · centerLabel · title` | 2 donuts (Recharts vs SVG) | SVG con `role=img` + label, reduced-motion |
| `ProportionBarList` | `items{label,value,display,color} · max` | 4 leaderboards con animación duplicada | `<ol>` semántico, barras con transición reduced-safe |
| `MapShell` + `MapLegend` | `center · zoom · onReady(map) · label` | boilerplate MapLibre ×6 + 5 leyendas | `role=application` + label; tema automático |

## Composición y navegación

`SectionLabel` (regla numerada, `<h2>` real) · `PageHero` (hero copiado ×3 en producción) · `Pager` (paginación con estado disabled correcto) · Shell (`Header` con skip link + nav accesible, `Footer`, `ThemeToggle`).

## Soporte

`lib/format` (formateo único locale-aware — fix del bug i18n COMP-07) · `lib/motion` (reduced-motion no opcional) · `mock/state` (simulador `?estado`/`?latencia`).

## Bugs encontrados y corregidos durante la construcción

1. `SelectField` no renderizaba `hint` ni asociaba `aria-describedby` → **corregido**.
2. `Alert` anidaba bloques dentro de `<p>` → **corregido** (children en `<div>`).
3. `Stat` no tenía tamaño `sm` para overlays compactos → **agregado** (usado en el resumen del mapa).

## Mejoras anotadas para v0.2 (no bloqueantes)

- `Donut`: prop `onDark` (hoy el home lo resuelve con override CSS).
- `DataTable`: columnas con `priority` para colapso a lista en móvil (hoy: scroll horizontal accesible con `tabIndex`, patrón suficiente).
- `Dialog`: variante drawer para el menú móvil del shell.
