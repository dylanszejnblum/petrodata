# MOCK_VS_CURRENT_GAP_ANALYSIS.md — Diferencias entre el mock Estrato y el producto actual

> **Actualización 2026-08-05 (tarde): el mock ahora usa LOS DATOS REALES de vacamuerta.io** (extraídos del sitio en producción ese día): dashboard (28.176.497 BOE · MAY 2026, KPIs y ranking de operadoras), 11 provincias, 52 empresas, tesis de inversión completa, exportaciones US$17,1B, 18 titulares de portada, 50 proyectos mineros con ley/recursos, precios en vivo, y uranio completo (US$86,35/lb, 21 proyectos). **Excepciones documentadas:** el mapa mantiene pozos simulados (decisión de Mariano); las series históricas de los charts son ilustrativas escaladas a los valores reales (el sitio no expone las series en texto); posiciones de proyectos mineros aproximadas por provincia; cuerpos de artículos de noticias simulados; precios de cotización de empresas ilustrativos (el listado real no los muestra).

> Regla cumplida: **ninguna funcionalidad se eliminó en silencio** — todo lo que el mock no representa está acá, con decisión sugerida. Categorías: **[MEJORA]** el mock hace algo que producción no hacía · **[SIMPLIFICADO]** representado con menos profundidad · **[NO REPRESENTADO]** ausente del mock, decisión pendiente o diferida a la migración.

## 1. Mejoras del mock sobre producción [MEJORA]

| Área | Qué cambia |
|---|---|
| Errores | `?estado=` demuestra vacío ≠ error ≠ offline en todas las pantallas; producción los confunde (backend caído = "sin datos") |
| Accesibilidad | Skip link, focus ring universal, h1 en todas (incluido `/map` que no tenía ninguno), tabla accesible del mapa (A2), contadores aria-live, labels reales en inputs, dialogs con focus trap, radiogroup con flechas, `aria-sort`+`scope`+`caption` en todas las tablas, wrapper de tabla con `tabIndex` |
| Theming | Sin `html{opacity:0}`; jerarquía oscura estable entre temas (D3); mapa cambia de base sola |
| Skeletons | 3 formas por tipo de página vs 1 global con la forma del home |
| Formatters | Locale-aware único (fix del bug es-AR/en-US de producción) |
| Consistencia | Minerals/Uranium/Map migradas: un solo lenguaje visual en el 100% de las pantallas |
| 404 | En español (producción: inglés bajo `/es`) |

## 2. Simplificado en el mock [SIMPLIFICADO] — se recupera en la migración con los datos/lógica reales

| Pantalla | Qué falta y de dónde sale al migrar |
|---|---|
| `/` | MapPreview con rotación y video MapBand (componentes reales existentes se reestilizan) |
| `/map` | Fetch por viewport + cache + clustering + capas de cuencas (la lógica vive en `MapExperience` real → hook `useWellsQuery`) |
| `/indicadores` | DayValueCard (aritmética Brent/PIST), Ramp/Actividad/Cruce, TransportInfra — componentes de dominio reales a reestilizar sobre ChartFrame |
| `/noticias` | Facets múltiples, sponsors, topic chips; pageSize 24; rich text real del CMS en el artículo |
| `/companies` | Precios con polling, logos (decidir sistema: local vs favicons), OHLC/52w, tabla de proyectos por company |
| `/provincias` | Fotos reales (assets existen en `frontend/public/images/provinces`), perfil exportador |
| `/minerals/*` | Precios spot, charts del hub, recursos/reservas reales de la ficha |
| `/minerals/uranium` | Scrolly educativo, trade flows, ciclo del combustible (los componentes reales existen; decidir si se reestilizan o se simplifica la página) |

## 3. No representado [NO REPRESENTADO] — requiere decisión

| Tema | Situación | Decisión sugerida |
|---|---|---|
| i18n es/en | Producción lo tiene sano (next-intl, 665 claves). El mock es es-only, pero `lib/format` ya exige locale | Migrar con next-intl desde el día 1 de la migración; el mock no necesita duplicar mensajes para aprobar lo visual |
| Unidades de gas (MMm³/d ↔ MMcf/d) | Provider real existe y funciona | Conservar el provider real; integrarlo al `SettingsControl` del shell nuevo |
| Newsletter (footer + modal) | El DS ya tiene `TextField`+`Dialog` accesibles | Recablear el POST real al migrar |
| Onboarding / permisos / login | **No existen ni existirán** (decisión D1 de Mariano) | N/A |
| Contenido CMS (Pages/Posts de Payload) | Muerto en producción (auditoría ARQ-01/02) | Fuera del mock; decidir poda del CMS en la migración |

## 4. Análisis de implementación preliminar (se finaliza tras la aprobación del mock)

| Área de producción | Clasificación |
|---|---|
| `src/api` + fetchers + lógica de dominio (`wellStatus`, `projectMetrics`, unidades) | **Reutilizar sin cambios** (cablear a las pantallas nuevas) |
| Charts de dominio de indicadores/entities (Ramp, Cruce, StockPriceChart, Sankey…) | **Reestilizar** sobre ChartFrame/tokens |
| `MapExperience` (cache/debounce/abort) | **Refactorizar** a `useWellsQuery` + UI nueva del mock |
| Páginas (las 15) | **Migrar progresivamente** al shell + componentes aprobados (orden del roadmap) |
| Chrome (`Nothing/Header,Footer`), cards, tablas, chips, contadores | **Reemplazar** por el DS |
| Template Payload muerto (~3.400 LOC), `AnimatedCounter`, duplicados, `tailwind.config.mjs`, `HeaderTheme` | **Deprecar/borrar** (Fase 1 y 5 del roadmap) |
