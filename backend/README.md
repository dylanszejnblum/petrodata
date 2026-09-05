# Petroldata.ar Backend

NestJS REST API over Postgres for Vaca Muerta oil & gas production data.

## Stack
- NestJS 11
- Prisma 6 + Postgres
- Source CSVs from the Python pipeline at `../petroldata.ar/data/data-v1/`

## Setup

```bash
pnpm install
```

Create a `.env` file (one is already present — replace `DATABASE_URL` if needed):

```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
PORT=3001
CSV_DATA_DIR="../petroldata.ar/data/data-v1"
```

## Database

```bash
# Create tables
npx prisma migrate dev --name init

# Seed from CSVs (~1-2 min for 328K-row fact table)
npx prisma db seed
```

### Energy trade (INDEC ICA)

The `/inversiones` surplus + agro-vs-energy crossover are backed by `fact_energy_trade`,
seeded from INDEC's Intercambio Comercial Argentino (ICA) via the Series de Tiempo API.

```bash
# 1. Fetch + normalize (writes market-data/out/fact_energy_trade.csv)
cd ../../petroldata.ar/market-data && uv run python fetch_energy_trade.py

# 2. Seed (idempotent upsert by [period, granularity]; no TRUNCATE)
cd -                    # back to backend/
pnpm db:seed:energy-trade
```

Monthly rows carry energy exports/imports → surplus; annual rows add agro
(Productos primarios + MOA) for the crossover. Values are USD (INDEC publishes
millions; the pipeline converts). Source: INDEC, CC-BY.

The crossover also expresses each year as **% of GDP**, using Argentina's nominal
GDP (current US$) from the World Bank — seeded into `fact_price` (`series=gdp_usd`):

```bash
pnpm db:seed:gdp        # fetches World Bank NY.GDP.MKTP.CD for ARG; idempotent upsert
```

### Directivos (quién dirige cada empresa)

`/api/v2/directivos` cruza `company_executive` —dato editorial, una fila por
empresa, con su fuente citable— contra la contribución por operadora, y ordena
por un índice 0–100 de la EMPRESA atribuido a quien la dirige. El dato NO trae
ninguna métrica de la persona.

```bash
pnpm db:seed:executives   # upsert desde prisma/data/company_executives.csv
```

**La ponderación del índice vive en `directivos.service.ts` y no se publica.**
La respuesta manda los tres insumos por su nombre y el índice ya calculado; los
componentes y los pesos se quedan del lado del servidor. Ése es el motivo por el
que el cálculo está acá y no en el frontend, donde las constantes quedaban en un
repo público a dos archivos de la prosa que decía que eran secretas.

Las fotos van al bucket, no al repo:

```bash
pnpm assets:upload ../frontend-v2/public/images/ceos directivos   # sube lo que cambió
pnpm db:photos                                                    # marca quién tiene cara
```

`assets:upload` firma SigV4 con `crypto` (ver `src/common/s3.ts`) en vez de traer
el SDK de AWS, y salta los archivos cuyo MD5 ya coincide con el ETag remoto.
`db:photos` sólo escribe `photo_url`, que guarda la **clave del objeto** y no una
URL; la semilla nunca lo pisa, así que el orden entre las dos no importa.

**El bucket es privado y las fotos salen por la API**, en
`GET /api/v2/directivos/:slug/foto` (un año de cache, `immutable`, con ETag).
Garage sólo publica por `Host` y el proxy de este server no tiene ruta ni
certificado para `<bucket>.web-….sslip.io` —contesta 503—, y un wildcard de Let's
Encrypt sobre sslip.io no se puede emitir porque no hay DNS-01. Pasar 32 jpg de
30 KB por Nest no se nota y el bucket se queda privado, que es mejor igual. Si
algún día hay un dominio propio con certificado, la ruta se puede cambiar por un
redirect al bucket sin tocar la base: `photo_url` ya es una clave, no una URL.

### Votos

`POST /api/v2/directivos/:slug/voto` con `{ "value": 1 | -1 }`. Cinco votos por
semana y uno por persona; el voto **no se edita** hasta el lunes. El votante se
identifica por IP —que no es una persona: una oficina o una operadora móvil son
miles detrás de una sola— y la IP **no se guarda**: la tabla lleva
`HMAC(ip, VOTE_SALT)`. Sin `VOTE_SALT` el endpoint devuelve 503 en vez de
arrancar con un secreto vacío; rotarlo resetea los presupuestos de la semana.

`GET /api/v2/directivos/voto` devuelve el presupuesto de quien pregunta — es por
IP, no se cachea.

Dos cosas que el diseño resuelve a propósito:

- **El corte es diario.** Los votos de hoy no entran en el ranking de hoy
  (`vote_day < CURRENT_DATE`). Es una decisión de producto: reordenando en vivo,
  el que vota ve su propio clic mover la tabla y el ranking se lee como un
  juguete.
- **El voto vale puntos relativos, no puntos fijos.** El más votado de la semana
  se lleva ±6 puntos y el resto en proporción a él, así que diez votantes y diez
  mil dan el mismo rango. Con una constante de puntos por voto —lo que había en
  el frontend— la mezcla entre producción y opinión cambiaba sola con el tráfico.

## Run

```bash
pnpm start:dev      # http://localhost:3001/api/v1
```

Interactive API docs:

- Swagger UI: <http://localhost:3001/api/v1/docs>
- OpenAPI JSON: <http://localhost:3001/api/v1/docs-json>

## Export the OpenAPI spec

```bash
pnpm openapi:export    # writes ./openapi.json (no DB needed)
```

`openapi.json` is committed at the repo root and regenerated whenever the API surface changes. Generate clients from it with `openapi-typescript`, `openapi-generator`, etc.

## API

All endpoints under `/api/v1/`:

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/production/monthly` | Production fact rows with filters + optional grouping |
| GET | `/production/latest` | Single-row summary of latest month |
| GET | `/operators` | All operators with latest-month totals |
| GET | `/operators/:slug` | Operator detail with YTD + rank |
| GET | `/operators/:slug/production` | Monthly time series |
| GET | `/wells` | Paginated well list |
| GET | `/wells/:id` | Well detail + latest production |
| GET | `/wells/:id/production` | Well monthly time series |
| GET | `/geo/wells` | GeoJSON FeatureCollection (bbox + filters) |
| GET | `/geo/wells/:id` | Single well as GeoJSON Feature |
| GET | `/data-freshness` | Row counts + latest month per table |

### Response envelope

```json
{
  "data": [...],
  "meta": {
    "source": "Secretaría de Energía / datos.energia.gob.ar",
    "dataset": "Producción de petróleo y gas por pozo",
    "license": "CC-BY-4.0",
    "last_source_update": "2026-01-01",
    "last_ingested_at": "2026-05-27T14:30:00Z",
    "vaca_muerta_filter": "formation + unconventional + sub-tipo"
  },
  "pagination": { "page": 1, "limit": 50, "total": 1000 }
}
```

GeoJSON endpoints return raw GeoJSON (no envelope).

### Errors

```json
{ "error": { "code": "NOT_FOUND", "message": "Well not found: 99999" } }
```

## Query parameters

`/production/monthly`:
- `operator`, `formation`, `province` (slug filters)
- `vm=true` (Vaca Muerta only — uses `vm_combined`)
- `from=YYYY-MM`, `to=YYYY-MM`
- `group_by=operator|concession|formation|province` (server-side aggregation)
- `page`, `limit` (default 50, max 500)

`/operators`:
- `sort=oil_m3|gas_thousand_m3|boe|active_wells` (default `boe`)
- `order=asc|desc` (default `desc`)

`/wells`:
- `operator`, `formation`, `basin`, `province`, `concession`
- `search` (sigla substring, case-insensitive)
- `page`, `limit`

`/geo/wells`:
- `operator`, `formation`, `basin`, `province`
- `bbox=west,south,east,north`
- `limit` (default 1000, max 1000)

## Notes
- The `agg_monthly_vm_only.csv` file is a strict subset of `agg_monthly_by_operator.csv` (`vm_combined=true`) so it is not seeded as a separate table — filter `agg_monthly_by_operator` by `vm_combined` instead.
- No PostGIS — `latitude` / `longitude` columns are indexed via b-tree and queried with `BETWEEN` for bbox filters. Switch to PostGIS when spatial queries become a bottleneck.
