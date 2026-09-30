# Estrato — Design System de vacamuerta.io

> **v0.3 · 2026-08-05** · Fuente de verdad visual del frontend. Toda pantalla nueva y toda migración se diseña contra este documento. Si algo no está acá, se decide, se anota acá, y recién después se codea.
> Kit visual navegable: artifact "Estrato — Kit v0.3" (claude.ai) · Complementa: `DESIGN_SYSTEM_GAP_ANALYSIS.md`, `FRONTEND_MIGRATION_ROADMAP.md` (raíz del repo).

---

## 1. Identidad

**Estrato** — capas apiladas: tokens abajo, primitivas encima, patrones arriba.

La voz: **un instrumento de medición con alma de revista**. Etiquetas técnicas chiquitas en mayúsculas y números tabulares (voz instrumento) conviven con titulares grandes en negrita apretada y fotografía en blanco y negro (voz editorial). Referencia interna: las secciones **Provincias** y **Noticias** del sitio (julio–agosto 2026) son el punto de partida de este lenguaje.

### Decisiones fundacionales (registro)

| # | Decisión | Elegido | Fecha |
|---|----------|---------|-------|
| D1 | Nombre del sistema | **Estrato** | 2026-08-05 |
| D2 | Identidad única en todo el sitio (mapa y minerals incluidos) | Sí — se migra todo al lenguaje Estrato | 2026-08-05 |
| D3 | Jerarquía de superficies | **La oscuridad es jerarquía, no tema**: clara → oscura → oscura con foto | 2026-08-05 |
| D4 | Tipografía display | **Inter Tight** (700/600) · técnica: **Schibsted Grotesk** (400/500) | 2026-08-05 |
| D5 | Radio | **10px** cards/paneles · 8px controles · pill completa. Única esquina. | 2026-08-05 |
| D6 | Colores de datos | **Petróleo = verde** (heredado de Provincias) · **Gas = azul** | 2026-08-05 |
| D7 | Rojo | **Solo baja**: un único rojo (status.negative) para ▼ y errores. No es marca ni commodity. | 2026-08-05 |
| D8 | Acento de marca | **Monocromo** — la firma es el negro y la tipografía; el color pertenece a los datos | 2026-08-05 |
| D9 | Status | Verde-cyan y rojo coral **vivos** (al límite de legibilidad en claro; brillantes en oscuro) | 2026-08-05 |

---

## 2. Tokens

Archivo fuente: [`estrato-tokens.css`](estrato-tokens.css) (copiar a `frontend/src/styles/tokens.css` en la Fase 1 del roadmap).

### Color — semánticos

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `surface.canvas` | `#f5f5f4` | `#0a0a0a` | fondo de página (neutros cálidos, no gris puro) |
| `surface.base` | `#ffffff` | `#141414` | card clara — nivel 1 |
| `surface.raised` | `#f0efee` | `#1d1d1c` | hover, cabeceras de tabla |
| `surface.inverse` | `#16191d` | `#16191d` | card oscura — nivel 2. **Fija: no cambia con el tema** |
| `surface.inverse-2` | `#20242a` | `#20242a` | variante de inverse |
| `border.default` | `#e6e4e2` | `#262626` | hairline decorativa (cards, divisores) |
| `border.strong` | `#cfccc9` | `#3a3a3a` | límites de controles (inputs, chips) |
| `text.primary` | `#000000` | `#ffffff` | titulares y cifras |
| `text.body` | `#1a1a1a` | `#e8e8e8` | cuerpo |
| `text.secondary` | `#5f5d5b` | `#a3a19f` | cuerpo secundario |
| `text.tertiary` | `#837f7c` | `#7c7977` | etiquetas y metadatos (⚠ límite AA — no usar por debajo de 10px) |
| `on-dark.primary` | `#f4f3f1` | — | texto sobre surface.inverse/foto |
| `on-dark.secondary` | `rgba(244,243,241,.64)` | — | |
| `on-dark.tertiary` | `rgba(244,243,241,.42)` | — | |
| `data.oil` | `#3fb883` | `#46c98f` | **petróleo** (el verde de Provincias) |
| `data.gas` | `#2382cf` | `#4da3e8` | **gas** |
| `status.positive` | `#0aa173` | `#2fe0a4` | subas ▲, "en vivo", pozo activo |
| `status.negative` | `#dd4136` | `#ff6d5f` | bajas ▼ y errores — **el único rojo del sistema** |
| `status.caution` | `#9a7420` | `#c49a3f` | avisos, resultados truncados |
| `focus.ring` | `#007aff` | `#5b9bf6` | anillo de foco (teclado) |

**Marca: monocroma (D8).** El puntito, los índices de sección (01, 02…), el ítem activo del menú y el CTA principal usan `text.primary`. El único punto de color permanente del chrome es el indicador "en vivo" (`status.positive`, porque significa dato fresco, no marca).

**Scrims de foto** (reemplazan las 14 alfas ad hoc): `scrim.soft rgba(22,25,29,.5)` · `scrim.mid rgba(22,25,29,.8)` · `scrim.hard rgba(12,14,16,.95)`.

### Tipografía

| Rol | Familia | Peso | Tamaño | Detalles |
|-----|---------|------|--------|----------|
| Display | Inter Tight | 700 | clamp 38–64px | tracking −2% · lh 1.0 |
| H1 | Inter Tight | 700 | 36px | tracking −1.8% · lh 1.08 |
| H2 | Inter Tight | 600 | 23px | tracking −1.2% · lh 1.18 |
| H3/Card title | Inter Tight | 700 | 21px | tracking −1.2% · lh 1.16 |
| KPI | Inter Tight | 700 | 42px | tabular-nums · tracking −1.5% |
| Body | Schibsted Grotesk | 400 | 14px | lh 1.55 |
| Label md | Schibsted Grotesk | 500 | 11px | caps · tracking +8% |
| Label sm | Schibsted Grotesk | 500 | 10px | caps · tracking +8% · **tamaño mínimo del sistema** |

Reglas: **dos voces, nunca tres**. Inter Tight = titulares y cifras; Schibsted = todo lo demás. Se cargan por `next/font` (Inter Tight 600/700, Schibsted 400/500). No existe `font-bold` sin el peso cargado, no existen tamaños con medio píxel, no existe más de un tracking por rol.

### Espaciado, forma, elevación, motion

- **Espaciado**: escala Tailwind de 4px. Card: `p-5` (20px). Celda de tabla: `px-5 py-3`. Sin valores arbitrarios.
- **Radio (D5)**: `radius.card 10px` · `radius.control 8px` · `radius.pill 999px`. Nada más.
- **Borde**: 1px es la estructura. La elevación se dice con superficie y borde, **no con sombra**. Única sombra permitida: `elevation.overlay 0 8px 24px -12px rgba(0,0,0,.4)` para paneles flotantes sobre el mapa.
- **Alturas de chart**: `size.chart.sm 240px` · `md 280px` · `lg 400px` (colapsa los 19 valores actuales).
- **Motion**: `duration.fast 150ms` · `base 300ms` · `slow 700ms` · `ambient 2400ms`; easing `ease.out cubic-bezier(0.16,1,0.3,1)` + los de anime.js (`outCubic`, `outExpo`). Todo pasa por `lib/motion` y **respeta `prefers-reduced-motion` sin excepción**.

---

## 3. Superficies — la escalera (D3)

| Nivel | Superficie | Cuándo | Comportamiento con el tema |
|-------|-----------|--------|---------------------------|
| 1 | **Clara** (`surface.base`, borde hairline) | el default: listas, datos, contenido | sigue el tema |
| 2 | **Oscura** (`surface.inverse`) | énfasis: el KPI héroe, el dato que manda en la sección | **fija** — oscura en ambos temas |
| 3 | **Oscura con foto** (foto B&N + scrims + on-dark) | protagonismo máximo: heros, destacados de provincia/noticia | **fija** |

La jerarquía se lee sola: cuanto más oscuro, más importante. No se usa el nivel 2–3 para contenido corriente (si todo es énfasis, nada lo es).

## 4. Reglas de la casa (no negociables)

1. **Radio 10px, siempre.** No existe otra esquina.
2. **El color pertenece a los datos.** Petróleo verde, gas azul, subas verde-cyan. Marca y chrome monocromos.
3. **El rojo solo baja.** Aparece únicamente en ▼ y errores.
4. **La oscuridad es un ascenso.** Escalera de 3 niveles, fija en ambos temas.
5. **La foto siempre en blanco y negro**, con scrim de dos pasos. Nada compite con los datos.
6. **Números tabulares, siempre**, y formateados según el idioma del lector (vía `lib/format`).
7. **Borde 1px como estructura.** Sombra solo en overlays flotantes.
8. **Dos voces tipográficas, nunca tres.**
9. **El foco se ve.** Anillo `focus.ring` en todo interactivo. Touch targets ≥ 24px.
10. **Ningún hex fuera de `tokens.css`.** Ningún `text-[Npx]` fuera de la escala. (Se lintea.)

## 5. Primitivas v0 (a construir en Fase 2 del roadmap)

`Surface` (flat/raised/inverse/photo) · `Button` (solid/outline/ghost · monocromo) · `Chip` (aria-pressed) · `Badge` (oil/gas/pos/neg/caution) · `SegmentedControl` · `Stat` (semántica `<dl>`, contador con reduced-motion, SSR con valor final) · `Skeleton` · `EmptyState` · `SectionLabel` (ya existe) · `Sparkline` · `Donut` · `Dialog` (Radix) · `DataTable` · `ChartFrame`+`ChartTooltip` · `PetrodataMap`+`MapLegend` · `PageHero` · `Pager`.

APIs detalladas: `DESIGN_SYSTEM_GAP_ANALYSIS.md` §6.

## 6. Cómo cambiar este documento

Toda decisión nueva o cambio de token: PR etiquetada `design-system`, una línea en el registro de decisiones (§1), y actualización del kit visual. **Si no está escrito acá, no existe.**
