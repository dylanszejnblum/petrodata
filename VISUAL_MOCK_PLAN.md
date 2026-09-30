# VISUAL_MOCK_PLAN.md — Reconstrucción visual completa (gemelo Estrato)

> **Etapa posterior a la auditoría. No se toca el frontend productivo hasta aprobar el mock.**
> Fuente de verdad: [docs/design/ESTRATO.md](docs/design/ESTRATO.md) (v0.3) + [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md) + [UI_INVENTORY.md](UI_INVENTORY.md).
> Estado: **Draft** · 2026-08-05

---

## 1. Objetivo y principio rector

Construir un **gemelo visual y funcional** de vacamuerta.io bajo el lenguaje Estrato: navegable, responsive, con datos simulados y todos los estados (normal, loading, vacío, error, parcial). Sirve para validar el design system completo y aprobar pantalla por pantalla **antes** de intervenir producción.

**Principio rector: el mock no es descartable.** Se construye con el stack final de producción, y sus componentes (`src/ui/`) son la futura librería del frontend real. Aprobación del mock = design system construido, probado y aprobado. La migración posterior "levanta" piezas, no las reescribe.

## 2. Arquitectura

```
petrodata/apps/ui-prototype/          ← app Next independiente (no toca frontend/)
├─ src/
│  ├─ styles/tokens.css               ← copia viva de docs/design/estrato-tokens.css
│  ├─ ui/                             ← EL DESIGN SYSTEM (futuro frontend/src/components/ui)
│  │   surface, button, chip, badge, segmented, stat, skeleton, empty-state,
│  │   section-label, page-hero, data-table, chart-frame, sparkline, donut,
│  │   dialog, dropdown, tabs, tooltip, alert, input, field, select, checkbox,
│  │   radio, textarea, pager, petrodata-map, map-legend, shell (header/footer)
│  ├─ fixtures/                       ← datos mock TIPADOS con los tipos reales
│  │   (importa frontend/src/api/types.ts → producción de gas/petróleo, operadoras,
│  │    provincias, companies, proyectos, noticias — valores realistas del dominio)
│  ├─ lib/                            ← format.ts (locale-aware), motion.ts — los definitivos
│  ├─ mock/                           ← simulador: latencia, error, vacío, parcial, por searchParam
│  └─ app/
│     ├─ (producto)/...               ← las 16 rutas gemelas
│     └─ catalog/...                  ← catálogo de componentes (rol de Storybook)
```

- **Stack**: Next 16 + React 19 + Tailwind 4 + tokens Estrato + Recharts + MapLibre + next-intl (es/en). Idéntico a producción para que todo sea transplantable.
- **Simulación de estados por URL**: `?estado=vacio | error | parcial | offline` y `?latencia=0 | 1500 | 4000` en cualquier pantalla. Permisos: **no aplica** (el producto es público, ver §6-D1). Tema y unidades: el settings real del mock.
- **Catálogo integrado** (`/catalog`): cada componente con variantes, tamaños, estados, contenido corto/largo, disabled, loading, error, mobile y notas de accesibilidad. Sin Storybook (misma tecnología de render, cero infra; exportable si crece el equipo).

## 3. Orden de construcción y gates de aprobación

| Nivel | Contenido | Gate |
|---|---|---|
| **1 · Fundaciones** | tokens aplicados, tipografía, spacing, radios, sombra, iconografía, motion, page shell (header/footer/nav) — visible en `/catalog/fundaciones` | ✅ ya pre-aprobado en el kit v0.3; se ratifica viéndolo en código real |
| **2 · Componentes** | los ~28 de `src/ui/` en el catálogo, con APIs y estados | tu revisión en `/catalog` |
| **3 · Patrones** | formularios (newsletter/settings), DataTable con sort+filtros+colapso móvil, filtros del mapa, navegación completa, modales, empty/error/loading, feedback | tu revisión |
| **4 · Pantallas — tanda núcleo** | `/` · `/noticias` · `/noticias/[id]` · `/provincias` · `/provincias/[slug]` · `/indicadores` · `/map` — desktop + mobile + estados | revisión pantalla por pantalla |
| **4b · Pantallas — resto** | `/companies` ×2 · `/minerals` ×3 · `/minerals/uranium` · `/exportaciones` · 404 · loading/error globales | ídem |
| **5 · Flujos** | recorridos completos: explorar producción → provincia → operadora; filtrar mapa; leer noticias con filtros; cambiar idioma/unidades/tema en cualquier punto | recorrido conjunto |

Cada ronda de revisión queda registrada en `SCREEN_INVENTORY.md` con estados: **Draft → Ready for review → Changes requested → Approved → Blocked**.

## 4. Trazabilidad (por pantalla)

Plantilla en `SCREEN_INVENTORY.md`, una fila por pantalla: ruta actual equivalente · archivos actuales relacionados (de UI_INVENTORY) · funcionalidad representada · componentes Estrato usados · **diferencias vs producto actual** · funcionalidad aún no representada · estado de aprobación · preguntas abiertas. **Regla: ninguna funcionalidad existente se elimina en silencio** — toda diferencia se documenta en `MOCK_VS_CURRENT_GAP_ANALYSIS.md`.

## 5. Entregables de la etapa

| Doc | Contenido | Cuándo |
|---|---|---|
| `VISUAL_MOCK_PLAN.md` | este plan | ✅ ahora |
| `DESIGN_SYSTEM_FOUNDATIONS.md` | fundaciones aplicadas al código (deriva de ESTRATO.md) | con Nivel 1 |
| `COMPONENT_CATALOG.md` | índice de componentes + APIs + estado de aprobación | con Nivel 2 |
| `SCREEN_INVENTORY.md` | trazabilidad + estados de aprobación | desde Nivel 4, vivo |
| `FLOW_INVENTORY.md` | flujos críticos y su recorrido en el mock | con Nivel 5 |
| `MOCK_VS_CURRENT_GAP_ANALYSIS.md` | toda diferencia mock↔producto, con decisión | vivo |
| `VISUAL_APPROVAL_CHECKLIST.md` | checklist de la regla de aprobación (§6) | con Nivel 4 |
| **El mock ejecutable** | `pnpm dev` en `apps/ui-prototype` | incremental |

## 6. Regla de aprobación y salida

No se toca el frontend productivo hasta aprobar: fundaciones ✚ componentes esenciales ✚ layouts ✚ pantallas críticas (tanda núcleo) ✚ flujos ✚ responsive.

**Aprobar el mock no implica reescribir todo.** Al aprobar, se hace el análisis de implementación que clasifica cada área de producción como: *Reutilizar sin cambios · Reestilizar · Refactorizar · Migrar progresivamente · Reemplazar · Deprecar* — cruzando el mock aprobado con el inventario de la auditoría (los candidatos obvios ya están: la lógica de datos/fetch se reutiliza; el template Payload muerto se depreca; el chrome se reemplaza por el del mock).

### Decisiones de alcance

| # | Tema | Decisión |
|---|------|----------|
| D1 | Onboarding / permisos / login | **No existen en el producto actual** (público, read-only). El mock no los inventa; los estados "sin permisos" se marcan N/A. Si entran al roadmap de producto, se diseñan como pantallas nuevas etiquetadas "propuesta". *(pendiente de confirmación de Mariano)* |
| D2 | Configuraciones | Las reales: tema, idioma, unidades de gas — funcionales en el mock |
| D3 | Formularios | Los reales: newsletter (footer + modal) — con éxito/error simulables |

## 7. Estimación gruesa

Niveles 1–3: ~1.5–2 semanas. Tanda núcleo: ~2 semanas. Resto + flujos: ~1.5 semanas. Total ~5 semanas de trabajo neto (1 dev + agentes), con gates de revisión tuyos entre medio — el ritmo real lo marcan las rondas de aprobación.
