# DESIGN_SYSTEM_FOUNDATIONS.md — Fundaciones de Estrato aplicadas al código

> Estado: **construido** en `apps/ui-prototype`. Fuente de decisión: [docs/design/ESTRATO.md](docs/design/ESTRATO.md) (v0.3, decisiones D1–D9). Se revisa en vivo en `/catalog/fundaciones`.

## 1. Tokens en código

- **Archivo:** `apps/ui-prototype/src/styles/tokens.css` — variables CSS con tema claro (`:root`) y oscuro (`[data-theme='dark']`), `color-scheme` declarado.
- **Puente a Tailwind 4:** `src/app/globals.css` `@theme inline` expone los tokens como utilidades (`bg-surface`, `text-secondary`, `border-line-strong`, `text-oil`, `bg-inverse`, `text-positive`…). **Ningún color existe fuera de este circuito.**
- **`surface.inverse` no se redefine en dark** — implementación literal de la decisión D3 ("la oscuridad es jerarquía, no tema").

## 2. Tipografía

- Inter Tight 600/700 + Schibsted Grotesk 400/500 vía `next/font` (self-hosted, `display: swap`) — D4.
- Roles como utilidades CSS: `type-display`, `type-h1`, `type-h2`, `type-card-title`, `type-kpi` (tabular), `type-label` (10px), `type-label-md` (11px), `tnums`. **No existen tamaños arbitrarios fuera de la escala**; el mínimo del sistema es 10px.

## 3. Theming sin deuda

- `data-theme` seteado por script `beforeInteractive` + `localStorage` + preferencia del sistema.
- **Sin el hack `html{opacity:0}` de producción**: si el script no corre, la página se ve (en claro). Robustez > truco.
- Toggle accesible en el header (`aria-label` dinámico), reactividad completa de tokens.

## 4. Accesibilidad de base (de serie, no opcional)

- `:focus-visible` global con `focus.ring` — todo interactivo muestra foco.
- Skip link "Saltar al contenido" + `<main id="contenido" tabIndex={-1}>` en el layout.
- `<html lang="es">`; nav con `aria-label`; botones icon-only con `aria-label`.
- `prefers-reduced-motion` respetado por `lib/motion` (countUp, inView) y por `motion-safe:` en CSS.

## 5. Motion y forma

- Duraciones/easing como tokens (`--duration-fast/base/slow/ambient`, `--ease-out`).
- Radios: solo `--radius-card` (10px), `--radius-control` (8px), pill — D5.
- Elevación: borde 1px estructural; única sombra `--elevation-overlay` para overlays flotantes.

## 6. Diferencias deliberadas vs producción (fundaciones)

| Producción hoy | Estrato | Motivo |
|---|---|---|
| 5 sistemas de color, 142 hex sueltos | 1 sistema de tokens, 0 hex en pantallas (2 token-exceptions comentadas en MapLibre) | consolidación |
| `html{opacity:0}` + script | tema sin bloquear el primer paint | robustez/perf |
| `font-mono` que no es mono + config fantasma | 2 voces reales cargadas, roles con nombre honesto | D4 |
| Sin skip link, foco invisible | skip link + focus ring global | WCAG 2.4.1/2.4.7 |
| Grises que fallan AA (`#999` como texto) | `text.tertiary` re-derivado + regla "mínimo 10px" | WCAG 1.4.3 (D9 vivos al límite legible) |
| Radius 14 valores | 3 valores | D5 |
