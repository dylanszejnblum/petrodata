# News ingest pipeline

Continuous ingest of Argentine oil & gas news/regulatory/corporate content for
Vaca Muerta. Fetches from multiple sources, normalizes to a single `Document`
schema, dedups, and POSTs to the backend, which upserts into Postgres. Designed
to run as a recurring cron worker on Coolify.

```
sources ──▶ stage1 fetch ──▶ stage2 normalize ──▶ stage3 enrich ──▶ stage4 dedup ──▶ stage5 emit ──▶ POST backend
 gdelt/rss/cnv     raw/          Document NDJSON      (stub)          cluster_id      news_documents     /api/v1/news/ingest
```

- **Contract:** `news_schema.py` — the `Document` shape, shared with the backend importer.
- **Connectors:** `pipeline_news/connectors/` — one module per source. Add a source = add a module + register it; stages never change.
  - `gdelt` — radar (wide net, metadata-only, rate-limited)
  - `rss` — curated feeds (Shale24, EconoJournal…), clean, no throttle
  - `cnv` — CNV hechos relevantes (primary regulatory, O&G-filtered, fulltext_internal)
- **Incremental:** each connector keeps a watermark in `<out>/state.json`, so each tick only fetches new items.
- **Backend is the sole DB writer.** The pipeline never touches Postgres; it POSTs to a token-guarded endpoint.

## Run locally

```bash
# one source, no posting — inspect the artifact
uv run run_news.py --out out_news/ --source rss --limit 10

# full chain + ship to a local backend
uv run run_news.py --out out_news/ \
  --post-to http://localhost:3001/api/v1/news/ingest --token "$NEWS_INGEST_TOKEN"
```

## Deploy on Coolify

Deploy this directory as an **Application** (Dockerfile build). The image runs a
self-contained loop (`docker/run-news-cron.sh`) — pipeline → POST → sleep — so
no Coolify Scheduled Task is required; it stays alive and ticks on its own.

**Required env:**

| Var | Example | Notes |
|---|---|---|
| `BACKEND_INGEST_URL` | `http://backend:3001/api/v1/news/ingest` | Use the internal Coolify network URL |
| `NEWS_INGEST_TOKEN` | `<random secret>` | Must match the backend's `NEWS_INGEST_TOKEN` |

**Optional env:**

| Var | Default | Notes |
|---|---|---|
| `NEWS_INTERVAL_SECONDS` | `21600` (6h) | Seconds between ticks |
| `NEWS_OUT_DIR` | `/data/out_news` | Mount a persistent volume here to keep watermarks across restarts |
| `NEWS_LIMIT` | _(unset)_ | Cap items/connector (dev) |

> Watermark persistence is optional: without a volume, a restart re-fetches
> recent items, but the backend upsert is idempotent so duplicates are harmless.

The backend must have the matching `NEWS_INGEST_TOKEN` set for the guard on
`POST /api/v1/news/ingest`.
