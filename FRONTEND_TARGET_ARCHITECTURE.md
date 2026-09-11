# FRONTEND_TARGET_ARCHITECTURE.md — Modelo objetivo y gobernanza

> Complementa a [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md). Diferencia explícitamente **estado actual → estado objetivo**. No propone reescritura: propone reordenar y formalizar lo que ya ganó de facto.

---

## 1. Organización del frontend

### Actual

```
src/
├─ app/(frontend)/[locale]/...      # 15 páginas, fetchers inline, sin error.tsx
├─ app/(payload)/...                # admin (ok)
├─ api/                             # client.ts + 2 módulos; el resto inline en páginas
├─ blocks/ heros/ Header/ Footer/   # template muerto (~3.400 LOC)
├─ components/
│  ├─ ui/                           # 8 primitivas muertas + map.tsx vivo
│  ├─ Nothing/                      # shell real
│  └─ Petrodata/{7 dominios}        # producto; transversales atrapados en dominios
├─ utilities/  hooks/  providers/   # mixto template/producto
└─ i18n/ messages/ collections/ ...
```

### Objetivo

```
src/
├─ app/(frontend)/[locale]/
│  ├─ error.tsx  global-error.tsx          # NUEVO (Fase 0)
│  ├─ <ruta>/loading.tsx                   # por segmento (3 formas: listado/detalle/mapa)
│  └─ ...páginas (solo composición: fetch vía src/api + montar componentes)
├─ api/                                    # TODA la capa de datos
│  ├─ client.ts  safe.ts (safeGet)         # política de cache por recurso, 1 sola vez
│  └─ <recurso>.ts (production, wells, companies, provinces, minerals, news, inversiones)
├─ lib/                                    # transversales puros, testeados
│  ├─ format.ts (locale-aware)  motion.ts (ex uranium/anim)  num.ts  slug.ts
├─ styles/
│  └─ tokens.css                           # única fuente de tokens (sin tailwind.config.mjs)
├─ components/
│  ├─ ui/                                  # EL DESIGN SYSTEM (primitivas + patrones)
│  │  ├─ surface.tsx button.tsx chip.tsx segmented.tsx stat.tsx badge.tsx
│  │  ├─ data-table.tsx chart-frame.tsx sparkline.tsx donut.tsx skeleton.tsx
│  │  ├─ empty-state.tsx section-label.tsx page-hero.tsx pager.tsx dialog.tsx
│  │  └─ map.tsx (mapcn, intacto)  petrodata-map.tsx  map-legend.tsx
│  ├─ shell/                               # ex Nothing: Header, Footer, SettingsControl, NewsletterModal
│  └─ features/{dashboard,map,indicadores,entities,minerals,uranium,news}
│     └─ (solo componentes de dominio; importan de ui/ y lib/, nunca entre sí)
└─ providers/ i18n/ messages/ collections/ ...(sin HeaderTheme)
```

**Reglas de dependencia (import boundaries):**
`app → features → ui → lib` y `app → api → lib`. Prohibido: `features/X → features/Y` (lo compartido baja a `ui/` o `lib/`), `ui → features`, `ui/features → api` (los datos llegan por props), hex/`text-[Npx]` fuera de `tokens.css`. Enforzable con `eslint-plugin-boundaries` o `import/no-restricted-paths`.

---

## 2. Design system

| Dimensión | Actual | Objetivo |
|---|---|---|
| Ubicación | no existe | `src/components/ui/` + `src/styles/tokens.css` (in-repo; **no** package separado — un solo producto, un solo dev, monorepo ya complejo) |
| Fuente de verdad visual | prompt externo no versionado (`vacamuerta-diseno01`) | `docs/design/` en el repo: kit + decisiones (ADRs) |
| Tokens | 5 sistemas | 3 capas (primitivos → semánticos → componente), ver [DESIGN_SYSTEM_GAP_ANALYSIS.md](DESIGN_SYSTEM_GAP_ANALYSIS.md) §5 |
| Catálogo | no hay | ruta interna `/dev/ds` (ambos temas, todos los estados); Storybook solo si crece el equipo |
| Theming | `[data-theme]` + hack `opacity:0` | mantener `[data-theme]`; sustituir el hack por cookie SSR o `color-scheme` |

## 3. Datos y estado — objetivo

- Un módulo por recurso en `src/api/` con su política de cache declarada una vez (`revalidate` por tipo de dato: producción 300s, catálogos 3600s, noticias 300s, mapa no-store con bbox).
- `safeGet()` único que loguea el error (observabilidad) y devuelve `{ data, error }` — las páginas distinguen "vacío" de "caído".
- `Suspense` + `loading` por sección en páginas multi-fetch; eliminar `force-dynamic` salvo justificación escrita.
- Providers: `Theme` + `Units` (se quedan). `MapExperience` delega su cache/debounce/abort a un hook `useWellsQuery` en `api/wells.ts`.

## 4. Testing — objetivo (pirámide)

| Capa | Herramienta | Contenido | Gate |
|---|---|---|---|
| Unit | Vitest | `lib/*` (format, motion, num), `wellStatus`, `projectMetrics`, unidades de gas, paridad de claves i18n | CI cada PR |
| Component | Vitest + RTL | primitivas de `ui/` (estados, a11y attrs, sort de DataTable) | CI cada PR |
| E2E smoke | Playwright (contra **build**, con MSW o seed) | 1 por ruta: render + h1 + consola limpia; flujos: filtros de mapa, idioma, unidades, newsletter | CI cada PR |
| Visual | Playwright screenshots | `/dev/ds` + 15 páginas × 2 temas × 2 viewports | CI, actualizable con aprobación |
| A11y | `@axe-core/playwright` | por página, umbral sin Critical | CI |

## 5. Documentación — objetivo

- `frontend/AGENTS.md` **reescrito** (es la instrucción que leen los agentes IA que construyen el producto — hoy leen boilerplate de Payload): tokens y cómo usarlos, primitivas disponibles ("antes de crear un componente, mirá `ui/`"), mapa de caching, frontera server/client, convenciones (named exports, boundaries), estado del template/CMS.
- `docs/design/`: design kit versionado + `decisions/` (ADRs cortos: radius, paleta de estados, identidad por sección).
- `README.md` del frontend: reescrito para el producto real (el actual describe un template que no se usa).

## 6. Gobernanza y escalabilidad

Contexto real: **1 desarrollador + agentes de IA**. La gobernanza útil aquí no son comités: son **gates automáticos y documentos que los agentes lean**.

| Área | Práctica propuesta |
|---|---|
| Ownership | `ui/`, `tokens.css` y `AGENTS.md` cambian solo en PRs etiquetadas `design-system`, nunca mezcladas con features |
| Pull requests | CI obligatorio (typecheck, lint, tests, build, visual, axe). Prohibido mergear en rojo — hoy hay 75+ PRs sin ningún check |
| Code review | checklist en el template de PR: ¿usó tokens? ¿usó primitivas existentes? ¿estados loading/empty/error? ¿focus visible? ¿i18n + formatters locale-aware? |
| Design review | toda pantalla nueva se compara contra `/dev/ds` y el kit versionado; capturas en la PR |
| Crear un componente nuevo | permitido en `features/` libremente; en `ui/` solo con ≥2 consumidores reales o un tercero previsto y concreto (evitar abstracciones prematuras) |
| Agregar variante | solo si un caso de producto la exige; si un `className` de escape se repite 3 veces → promover a variante |
| Deprecación | marcar con `@deprecated` + shim re-export; borrar cuando quede 1 release sin usos (grep en CI) |
| Versionado/changelog | in-repo: `docs/design/CHANGELOG.md` manual por PR de DS; sin semver hasta que sea package |
| Visual regression | baseline actualizable solo con screenshot-diff aprobado en la PR |
| Accessibility gates | axe sin Critical + focos visibles en `/dev/ds`; lista [MAN] de UI_INVENTORY revisada 1×/trimestre |
| Linting | subir `no-unused-vars`/`no-explicit-any` a error; regla anti-hex y anti-`text-[Npx]`; boundaries |
| Naming | named exports; archivos kebab-case en `ui/`, PascalCase en features (statu quo); prohibido duplicar nombre de componente existente (los 2 `Sparkline`/`MapLegend` no se repiten) |
| Uso de tokens | color/tamaño/espaciado solo por token; excepción documentada con comentario `/* token-exception: motivo */` que el lint reconoce |
| Registro de decisiones | ADRs de 10 líneas en `docs/design/decisions/` — la causa raíz de la fragmentación fue no tener memoria escrita |
| Definition of Done | feature terminada = estados (loading/empty/error) + 2 temas + 2 viewports + i18n + a11y checklist + tests de la lógica pura |
| Coordinación diseño↔dev | todo prompt/ticket nuevo referencia el kit versionado ("usar tokens y primitivas de ui/; no introducir colores nuevos") — los tickets históricos con estéticas propias son la causa medida de las 3 olas |
