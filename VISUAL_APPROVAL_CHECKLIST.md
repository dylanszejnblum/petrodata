# VISUAL_APPROVAL_CHECKLIST.md — Checklist de aprobación del mock Estrato

> Regla: **no se toca el frontend productivo** hasta que todo lo de abajo esté ✅ Approved por Mariano. Estados: ☐ pendiente · 🟡 changes requested · ✅ approved.

## Fundaciones (revisar en `/catalog/fundaciones`, ambos temas)
- ☐ Paleta (neutros cálidos, colores de datos petróleo/gas, status vivos, rojo solo-baja)
- ☐ Tipografía (Inter Tight + Schibsted, las 6 escalas)
- ☐ Superficies (escalera clara → oscura → foto)
- ☐ Espaciado, radios (10/8/pill), bordes, sombra única
- ☐ Motion (duraciones, pulso "en vivo", reduced-motion)

## Componentes (revisar en `/catalog/componentes`)
- ☐ Surface · ☐ Button/ButtonLink · ☐ Chip · ☐ Badge · ☐ SegmentedControl
- ☐ Stat (contador, deltas, onDark) · ☐ TextField/SelectField · ☐ Dialog
- ☐ DataTable (sort, vacío, scroll accesible) · ☐ ChartFrame/Sparkline/Donut
- ☐ ProportionBarList · ☐ EmptyState/Alert/Skeleton · ☐ Pager/SectionLabel/PageHero

## Patrones (`/catalog/patrones`)
- ☐ Card noticia · ☐ Card foto jerárquica · ☐ KPI band · ☐ Tabla con filtros · ☐ Overlay de mapa

## Pantallas (desktop + mobile + estados `?estado=` y `?latencia=`)
- ☐ `/` dashboard · ☐ `/map` (+tabla accesible) · ☐ `/indicadores`
- ☐ `/noticias` + `/noticias/[id]` · ☐ `/provincias` + `/provincias/[slug]`
- ☐ `/companies` + `/companies/[slug]` · ☐ `/exportaciones`
- ☐ `/minerals` + `/minerals/[commodity]` + `/minerals/projects/[name]` + `/minerals/uranium` (migradas a Estrato)
- ☐ 404 · ☐ skeletons por forma (listado/detalle/mapa)

## Flujos (recorrido completo)
- ☐ Explorar: home → provincia → operadora → noticia relacionada
- ☐ Filtrar el mapa (estado/commodity/operadora) y leer la tabla equivalente
- ☐ Noticias: filtrar por categoría + paginar + abrir artículo
- ☐ Cambiar tema en cualquier punto (sin roturas, jerarquía oscura estable)
- ☐ Estados excepcionales: vacío / error / offline / parcial / latencia en 3 pantallas distintas

## Responsive
- ☐ 375px (móvil) · ☐ 768px (tablet) · ☐ 1280px+ (desktop) en las 6 pantallas núcleo

## Firma final
- ☐ **Aprobación global del gemelo** → habilita el análisis de implementación (Reutilizar / Reestilizar / Refactorizar / Migrar / Reemplazar / Deprecar por área) y el arranque de la migración según [FRONTEND_MIGRATION_ROADMAP.md](FRONTEND_MIGRATION_ROADMAP.md).
