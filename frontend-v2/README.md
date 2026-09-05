# frontend-v2

vacamuerta.io bajo el **sistema V2** — la rederivación del sitio con el
design system reverse-engineered de beautifului.dev (PR #79,
`Mdp-limbiq:feat/estrato-v2`) — montada sobre el data layer real de
`frontend/`. Sin Payload CMS: la app consume directo la API NestJS de
petrodata.

## Cómo correrlo

```bash
pnpm install
pnpm dev          # http://localhost:3200 (backend esperado en :3001)
```

Variables (`.env`, todas opcionales en dev):

- `NEXT_PUBLIC_API_BASE_URL` — backend NestJS (default `http://localhost:3001`).

Otros comandos: `pnpm build` · `pnpm start` · `pnpm typecheck` ·
`pnpm api:types` (regenera `src/api/types.ts` desde `openapi.json`).

## Arquitectura

```
src/
├── api/          cliente openapi-fetch + tipos generados + news/inversiones
├── app/[locale]/ rutas (es sin prefijo, en bajo /en — next-intl, as-needed)
│   ├── _ui/      kit del sistema V2 (s-*), Indice, series, paneles
│   ├── sistema.css  tokens y recetas del sistema V2
│   ├── mapa a sangre · dashboard · provincias · empresas ·
│   │   indicadores · noticias (+ [id]) · directivos
├── lib/data/     LOADERS: API real → formas de los fixtures, con fallback
├── lib/types.ts  tipos de la API de inversiones
├── fixtures/     snapshots scrapeados de producción (fallback + editorial)
├── i18n/         routing es/en (next-intl)
├── messages/     v2.*: copy de secciones es/en (títulos, blurbs, chrome)
└── mock/         simulador ?estado=vacio|error|parcial|offline&latencia=ms
```

## Data wiring

Todas las páginas consumen loaders (`src/lib/data/`): API real primero,
fixture scrapeado como fallback (`[data] <loader>: backend no disponible`).

| Sección | Fuentes |
|---|---|
| Dashboard | `/production/latest` (período, vm_share) · `/production/monthly?formation=vaca_muerta` (totales VM, MoM, ranking por operadora) · `/data-freshness` (catálogo) · `/geo/wells` (muestra del mapa) · `/v1/news` · inversiones RSC (serie VM) |
| Mapa | `/geo/wells` + `/production/latest` + `/v1/operators` (orden del panel por BOE nacional) + `/geo/wells?operator=` (pozos completos de la elegida) + `/v1/operators/{slug}/production` (serie BOE/d, lazy) + `/v1/wells/{id}` (popup del pozo, lazy) |
| Empresas | `/v2/companies` + `/v2/companies/prices` + `/v1/operators/contribution` + `/v2/companies/{slug}` (resumen O&G de la ficha, lazy) + `/v2/companies/prices/{ticker}` (línea 6M, lazy) |
| Provincias | `/v2/provinces` + `/v2/provinces/export-summary` + `/v2/provinces/{slug}/production` (serie BOE/d real al desplegar, lazy; la sintética queda de fallback) |
| Indicadores | `/v2/inversiones` (RSC) + `/v1/operators/contribution` + `/v1/prices/energy` (**Brent vivo**, 300s) + `/v2/provinces/export-summary` + mensual nacional (productores) |
| Noticias | `/v1/news` (portada, total) + `/v1/news/facets` (píldoras por conteo del corpus) + `/v1/news/{docId}` (nota + cluster) |
| Directivos | fixture estático (sin endpoint); voto en localStorage (maqueta) |
| Índice (footer) | `POST /v1/newsletter` (captura, mismo source que el pie de v1) |

Los pedidos "lazy" viven en componentes de cliente con cache de módulo
(popup del pozo, serie de operadora, ficha de empresa, serie de provincia):
un pedido por interacción y cero fan-out por render — catorce series de
provincia en un solo render tumbaban el rate-limit del backend remoto y la
mitad quedaba sin dato por el cache del revalidate.

Alcances verificados contra el backend: `/operators` y `/production/latest`
son NACIONALES; los totales y rankings VM salen de
`/production/monthly?formation=vaca_muerta&group_by=operator`
(oil_bbl_d · gas_mm3_d · boe/mes · active_wells por operadora).

Paridad con v1: todo lo que consume el frontend original está cableado,
EXCEPTO la sección minería (`/v2/minerals/**`, uranio y trade flow), que v2
no tiene por decisión de producto. `rig-count`, `macro/fx`, `prices/fuel` y
`prices/commodities` están en el spec pero la v1 tampoco los usa.

Sin endpoint (queda fixture, declarado): TESIS, RIGI, TRANSPORT, YoY de VM,
cuerpo de notas (simulado por diseño), directivos.

## Rendering

- `force-dynamic`: mapa, noticias, noticias/[id]
- ISR 300s: dashboard, empresas, indicadores (Brent vivo)
- ISR 3600s: provincias
- SSG: directivos

## i18n

Chrome y copy de secciones (títulos numerados, blurbs, labels del índice y
footer) viven en `messages/{es,en}.json` bajo `v2.*`. Los <Pie> analíticos
largos y la copy editorial de fixtures siguen en español para ambas
locales — follow-up.

## Assets

- `public/data/gasoductos.geojson` se regenera con
  `scripts/build-gasoductos.py` (shapefile de ENARGAS → 26 sistemas
  troncales, 107 kB).
- Las fotos de CEOs (`public/images/ceos/`) SÍ se versionan desde el
  2026-09-01 (retratos IA con base verificada, ver el `.gitignore` de esa
  carpeta); quién tiene cara lo resuelve el servidor con `existsSync`, y las
  16 sin archivo degradan a monogramas.

## Origen

- Diseño: PR #79 (`Mdp-limbiq:feat/estrato-v2`), `src/app/v2/**` —
  sistema documentado en `design-research/beautifului-dev/SISTEMA.md`
  en esa rama.
- Data layer: `frontend/src/api|utilities|i18n` (v1).
