# FLOW_INVENTORY.md — Flujos críticos recorribles en el mock Estrato

> Cada flujo es 100% navegable en `localhost:3100`. Estados de aprobación: **Ready for review**.

## F1 · Explorar la producción (el flujo núcleo)
`/` (número nacional + KPIs) → sección 01 → ranking de operadoras → `/provincias` → card Neuquén (foto, jerarquía máxima) → `/provincias/neuquen` (KPIs + histórico + operadoras) → operadora en el ranking → `/companies/ypf` (cotización + trayectoria) → noticia relacionada desde `/` sección 03.
**Valida:** consistencia de Stat/Surface/SectionLabel entre 4 pantallas; el mismo número (producción YPF) coincide entre home, provincia y ficha.

## F2 · Filtrar el mapa
`/map` → chips de estado (activo/perforación/abandonado) → segmented commodity → select operadora (o llegar con `/map?operator=vista` preseleccionado) → contador aria-live actualiza → popup de pozo → **tabla "Pozos en vista"** sincronizada (el mismo dataset, ordenable por teclado).
**Valida:** paneles overlay en desktop, toggles en móvil, y la alternativa accesible nueva.

## F3 · Leer noticias
`/noticias` → chip de categoría (`?categoria=produccion`) → paginación (preserva filtros) → `/noticias/gnl-invierno` → relacionadas → volver.
**Valida:** filtros por URL (compartibles), jerarquía foto/inversa/clara en el listado.

## F4 · Cambiar de tema en cualquier punto
Toggle claro/oscuro en el header desde cualquier pantalla del F1–F3.
**Valida:** los tokens cambian todo; las superficies inversas y foto **no cambian** (jerarquía estable — decisión D3); el mapa cambia su base cartográfica sola.

## F5 · Estados excepcionales
- `/indicadores?estado=error` → hero + error con reintento (nada desaparece en silencio)
- `/noticias?estado=vacio` → vacío diseñado con salida ("quitar filtros")
- `/map?estado=offline` → offline con reintento; `?estado=parcial` → 40 pozos con nota
- `/companies?latencia=2000` → skeleton de listado 2s
**Valida:** vacío ≠ error ≠ offline (el bug de UX central de producción), skeletons por forma de página.

## F6 · Evaluar el design system (flujo interno del equipo)
`/catalog` → fundaciones → componentes (cada pieza con estados y casos extremos) → patrones (cuándo usar qué) → estados (el simulador documentado con links vivos).
**Valida:** que una pieza se pueda aprobar aislada antes de verla en pantalla.

## No representado (decisión de alcance, ver gap analysis)
Cambio de idioma es/en (producción lo tiene; el mock es es-only con formatters ya locale-aware) · newsletter con envío real · preferencia de unidades de gas (MMm³/d↔MMcf/d).
