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
