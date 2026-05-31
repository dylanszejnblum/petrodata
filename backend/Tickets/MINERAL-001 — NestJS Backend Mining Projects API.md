# MINERAL-001 — Mining Project Database (Uranium, Gold, Silver, Copper, etc.)

## What this is

This is NOT a time-series API like Petroldata.ar. There are no monthly records, no well-level granularity, no unit conversions.

This is a **project database** — a searchable catalog of mining project fact sheets extracted from PDF decks. Each project is a self-contained document with its own variable schema: different commodities, different grade units (g/t, %, ppm), different resource categories (Measured/Indicated/Inferred), and different reserve categories (Proven/Probable).

The value is making these PDF fact sheets searchable, filterable, comparable, and map-able — not normalizing them into a rigid schema.

## Data source

The pipeline runs on PDF presentation decks (one per commodity group) and outputs structured JSON:

```
/Users/dylanszejnblum/Documents/minerals/data-pipeline/
├── run.py                              # orchestrator
├── out_silver_2026_pptx/
│   ├── projects.json                   # structured project records
│   ├── projects.csv                    # flat export
│   └── projects_long.csv               # long-form export
├── out_gold_2026_pptx/
│   └── projects.json
├── out_uranium/
│   └── projects.json
├── out_copper_2026_pptx/
│   └── projects.json
└── out_lithium_2026_pptx/
    └── projects.json
```

The output directory is named by commodity + year + format. The seed script should accept a configurable list of directories and ingest all of them.

## Data shape (what a project looks like)

Each project is a fact sheet with semi-structured, nested data. Commodities vary per project — a silver project has `Ag_g_t`, `Pb_pct`, `Zn_pct` while a uranium project has `U3O8_ppm`, `U3O8_lbs`.

```json
{
  "project_name": "Diablillos",
  "primary_commodity": "Silver",
  "by_products": ["Gold", "Lead", "Zinc"],
  "status": "Feasibility",
  "deposit_type": "High Sulphidation Epithermal Style",
  "owner_controller": "AbraSilver Resource Corp. / Abra Plata Argentina S.A.",
  "operator": "AbraSilver Resource Corp. / Abra Plata Argentina S.A.",
  "area_ha": 7919,
  "province": "Salta",
  "country": "Argentina",
  "latitude": -25.3,
  "longitude": -66.833,
  "resources": {
    "Measured": [
      { "Ag_g_t": 80, "Au_g_t": 0.8 },
      { "pct_Pb": 1.2, "pct_Zn": 4.5 }
    ],
    "Indicated": [...],
    "Inferred": [...],
    "M&I": [...]
  },
  "reserves": {
    "Proven": [...],
    "Probable": [...]
  },
  "technical_economic": {
    "since_production": 2029,
    "estimated_lom_years": 28,
    "productive_capacity": "9000 tpd",
    "capex": "620 M USD",
    "mining_method": "Open pit",
    "product": "Concentrate and doré"
  },
  "sources_consulted": [...]
}
```

Key differences from oil & gas:
- **Schema is variable** — commodities change per project (uranium has U3O8, silver has Ag, copper has Cu)
- **Grade units vary** — g/t, %, ppm, kOz, MLbs, t, lbs — all in the same project
- **No time series** — it's a snapshot as of the report date
- **Resources/reserves are nested** — not a flat fact table
- **Projects are browsed, not queried by month**

## What the API should feel like

Think of it as a **searchable, filterable spreadsheet of mining projects** — not a data warehouse. The UX is:

1. Browse all projects on a map
2. Filter by commodity (Silver, Gold, Uranium, Copper, Lithium)
3. Filter by status (Operation, Feasibility, PEA, Exploration)
4. Filter by province
5. Click a project → read its full fact sheet
6. Compare two projects side by side

## Backend approach

**Use JSONB for flexible resource/reserve data.** Rather than trying to normalize every commodity-grade-unit combination into rigid SQL columns, store the resource tables as JSONB. This preserves the original structure and lets us add new commodities without schema changes.

### Database schema

Only 2 tables needed:

```prisma
model MiningProject {
  id                    Int      @id @default(autoincrement())
  projectName           String   @unique @map("project_name")
  primaryCommodity      String   @map("primary_commodity")
  byProducts            String?  @map("by_products")        // comma-separated
  status                String?
  depositType           String?  @map("deposit_type")
  ownerController       String?  @map("owner_controller")
  operator              String?
  areaHa                Float?   @map("area_ha")
  province              String?
  country               String?
  latitude              Float?
  longitude             Float?
  sinceProduction       Int?     @map("since_production")   // year
  estimatedLomYears     Int?     @map("estimated_lom_years")
  productiveCapacity    String?  @map("productive_capacity")
  estimatedAnnualProd   String?  @map("estimated_annual_production")
  capex                 String?
  miningMethod          String?  @map("mining_method")
  product               String?
  sourcePipeline        String?  @map("source_pipeline")    // e.g. "silver_2026_pptx"
  ingestedAt            DateTime @default(now()) @map("ingested_at")

  // Store resources and reserves as JSONB — flexible, preserves original schema
  resources Json?   // { "Measured": [{...}, {...}], "Indicated": [...], ... }
  reserves  Json?   // { "Proven": [{...}, {...}], "Probable": [...] }

  @@index([primaryCommodity])
  @@index([status])
  @@index([province])
  @@map("mining_project")
}
```

**Why JSONB:**
- A uranium project has `U3O8_ppm` and `U3O8_lbs` — no silver project has those
- A copper project has `Cu_pct` and `Cu_MLbs` — no gold project has those
- Trying to normalize this into fixed columns means endless nullable columns and schema migrations every time a new commodity appears
- JSONB is queryable in Postgres — you can still ask "find all projects where resources contain Ag_g_t > 100"
- The frontend renders the JSONB as-is — no backend transformation needed

### Seed script

Create `prisma/seed-minerals.ts` that:

1. Reads all `projects.json` files from configured output directories
2. Configurable via env var `MINERALS_DATA_DIRS` — comma-separated list of directories, e.g. `MINERALS_DATA_DIRS=../data-pipeline/out_silver_2026_pptx,../data-pipeline/out_uranium`
3. Default: scan `../data-pipeline/` for all `out_*/projects.json`
4. Upserts projects by `project_name`
5. Stores `resources` and `reserves` as JSONB — no transformation, just serialize the JSON as-is
6. Sets `source_pipeline` to the directory name so you know which PDF deck it came from
7. Clears and reloads on each run (one-shot extraction, not incremental)

```bash
# Run seed — scans all out_* directories
npx ts-node prisma/seed-minerals.ts

# Or specify specific pipeline outputs
MINERALS_DATA_DIRS=../data-pipeline/out_uranium,../data-pipeline/out_gold_2026_pptx \
  npx ts-node prisma/seed-minerals.ts
```

## API endpoints

All under `/api/v2/minerals/`:

### `GET /api/v2/minerals/projects`
List all mining projects. Filterable, sortable, paginated.

**Query params:**
- `commodity` — filter by primary_commodity (Silver, Gold, Uranium, Copper, Lithium, etc.)
- `status` — filter by status (Operation, Feasibility, PEA, Exploration)
- `province` — filter by province
- `q` — full-text search on project_name, operator, province
- `sort` — sort by project_name | primary_commodity | status | province (default: project_name)
- `order` — asc | desc
- `page`, `limit` — pagination

**Response:**
```json
{
  "data": [
    {
      "project_name": "Diablillos",
      "primary_commodity": "Silver",
      "by_products": "Gold, Lead, Zinc",
      "status": "Feasibility",
      "deposit_type": "High Sulphidation Epithermal Style",
      "province": "Salta",
      "latitude": -25.3,
      "longitude": -66.833,
      "operator": "AbraSilver Resource Corp.",
      "commodity_highlights": {
        "Silver": { "measured_kOz": 76684, "indicated_kOz": 198643 },
        "Gold": { "measured_kOz": 766 }
      }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 42 }
}
```

### `GET /api/v2/minerals/projects/:name`
Full project detail. Returns everything the pipeline extracted, including raw resources/reserves JSONB.

**Response:**
```json
{
  "data": {
    "project_name": "Diablillos",
    "primary_commodity": "Silver",
    "by_products": ["Gold", "Lead", "Zinc"],
    "status": "Feasibility",
    "deposit_type": "High Sulphidation Epithermal Style",
    "owner_controller": "AbraSilver Resource Corp. / Abra Plata Argentina S.A.",
    "operator": "AbraSilver Resource Corp. / Abra Plata Argentina S.A.",
    "area_ha": 7919,
    "province": "Salta",
    "country": "Argentina",
    "latitude": -25.3,
    "longitude": -66.833,
    "technical_economic": {
      "since_production": 2029,
      "estimated_lom_years": 28,
      "productive_capacity": "9000 tpd",
      "capex": "620 M USD",
      "mining_method": "Open pit",
      "product": "Concentrate and doré"
    },
    "resources": {
      "Measured": [{ "Ag_g_t": 80, "Au_g_t": 0.8, "Ag_kOz": 76684 }],
      "Indicated": [{ "Ag_g_t": 59, "Au_g_t": 0.51, "Ag_kOz": 198643 }],
      "Inferred": [{ "Ag_g_t": 21, "Ag_kOz": 13427 }]
    },
    "reserves": {},
    "sources_consulted": ["AbraSilver ... Technical Report ..."],
    "source_pipeline": "silver_2026_pptx"
  }
}
```

### `GET /api/v2/minerals/commodities`
List all commodities with project counts and aggregate resource/reserve totals.

**Response:**
```json
{
  "data": [
    {
      "commodity": "Silver",
      "projects": 12,
      "producing_projects": 3,
      "total_measured_kOz": 250000,
      "total_indicated_kOz": 400000,
      "total_inferred_kOz": 100000
    },
    {
      "commodity": "Uranium",
      "projects": 4,
      "total_measured_lbs": 50000000
    }
  ]
}
```

### `GET /api/v2/minerals/commodities/:commodity`
Projects grouped by commodity with their resources.

**Query params:** `?status=&province=&min_resources=`

### `GET /api/v2/minerals/map`
GeoJSON for map overlay — all projects as points.

**Query params:** `?commodity=&status=&province=`

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-66.833, -25.3] },
      "properties": {
        "project_name": "Diablillos",
        "commodity": "Silver",
        "status": "Feasibility",
        "province": "Salta",
        "operator": "AbraSilver Resource Corp."
      }
    }
  ]
}
```

### `GET /api/v2/minerals/summary`
Dashboard stats.

**Response:**
```json
{
  "data": {
    "total_projects": 42,
    "by_commodity": {
      "Silver": 12,
      "Gold": 8,
      "Uranium": 4,
      "Copper": 6,
      "Lithium": 5
    },
    "by_status": {
      "Operation": 8,
      "Feasibility": 6,
      "PEA": 10,
      "Exploration": 18
    },
    "by_province": {
      "Salta": 10,
      "Jujuy": 8,
      "Santa Cruz": 6,
      "Mendoza": 4,
      "Chubut": 3
    },
    "data_sources": ["silver_2026_pptx", "gold_2026_pptx", "uranium", "copper_2026_pptx", "lithium_2026_pptx"]
  }
}
```

## NestJS module structure

```
src/modules/minerals/
├── minerals.module.ts
├── minerals.controller.ts
├── minerals.service.ts
├── minerals.dto.ts
└── minerals.response.ts
```

Register in `app.module.ts` with `minerals` Prisma client (or share the same client — your call, JSONB works with either).

## Key architectural decisions

| | Oil & Gas (Petroldata) | Minerals |
|---|---|---|
| **Nature of data** | Time series (well × month) | Document catalog (project fact sheets) |
| **Schema** | Fixed, star schema | Variable, depends on commodity |
| **Storage approach** | Normalized tables with joins | Flexible tables + JSONB for nested data |
| **API style** | Queryable, filterable time series | Searchable, browseable project catalog |
| **Main endpoint** | `GET /v1/production/monthly?operator=&vm=true&from=&to=` | `GET /v2/minerals/projects?commodity=Silver&status=Feasibility` |
| **Response granularity** | Row-level (one well-month) | Project-level (one fact sheet) |
| **Update cadence** | Monthly (recurring data refresh) | One-shot (per PDF deck) |
| **Version** | `/api/v1/` | `/api/v2/minerals/` |

## What to skip (not MVP)

- Auth, API keys, billing
- Comparing projects side-by-side (frontend concern)
- Full-text search beyond project_name (defer to Postgres `ILIKE`)
- Time-series / historical data (minerals are snapshots)
- Uploading new PDFs through the API (pipeline runs separately)
- Auto-detecting new pipeline outputs (seed is manual)

## Setup

```bash
cd /Users/dylanszejnblum/Documents/minerals/backend

# Database — create the minerals table
npx prisma migrate dev --name add_minerals

# Seed from all pipeline outputs
MINERALS_DATA_DIRS=../data-pipeline/out_silver_2026_pptx,../data-pipeline/out_uranium \
  npx ts-node prisma/seed-minerals.ts

# Or auto-scan
npx ts-node prisma/seed-minerals.ts

# Start
npm run start:dev
```

## Acceptance criteria

- [ ] `GET /api/v2/minerals/projects?commodity=Silver` returns only silver projects
- [ ] `GET /api/v2/minerals/projects/Diablillos` returns full fact sheet with nested resources as JSONB
- [ ] `GET /api/v2/minerals/commodities` returns project counts per commodity
- [ ] `GET /api/v2/minerals/map` returns valid GeoJSON FeatureCollection
- [ ] `GET /api/v2/minerals/summary` returns aggregate stats
- [ ] Uranium projects have U3O8_ppm in their resources JSONB (not forced into Ag_g_t columns)
- [ ] Seed completes in under 10 seconds scanning all out_* directories
- [ ] No endpoints overlap with `/api/v1/` (oil & gas — untouched)
