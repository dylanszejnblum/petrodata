# NEWS-FE-1 — Frontend News Feed Reader (`/noticias`)

**Effort:** ~6–8 hours (incl. backend filter params)
**Tags:** frontend, backend, news, feed, spanish
**Depends on:** news ingest pipeline (live; PRs #5–#8) + `GET /api/v1/news`

---

## Context

The news ingest pipeline runs on a cron and continuously upserts O&G news/regulatory documents into the DB (already enriched with topics, entities, region, importance, `legal_mode`, `cluster_id`). None of it is **visible** — there's no reader UI. This ticket surfaces it as a filterable feed for vacamuerta.io.

## Current API + gaps

`GET /api/v1/news?take=&family=` returns the documents but only supports `take` + `source_family`. The feed needs more, so **extend the backend first**:

### 1. Backend: list filters + single-doc + facets
- Extend `GET /api/v1/news` query params: `topic`, `entity` (company), `region`, `q` (title/deck search), `from`/`to` (publishedAt), `sort` (`importance` | `recent`), `page`/`pageSize` (pagination + total).
- Add `GET /api/v1/news/:docId` — single document (+ its cluster: other docs sharing `clusterId`).
- Add `GET /api/v1/news/facets` — distinct topics / source families / top entities with counts, to populate filter UI.
- Re-sync `openapi.json` + `pnpm api:types`.

### 2. Frontend feed page `/[locale]/noticias`
- Card list: `title`, `deck` (snippet), source badge (`sourceName` + `sourceFamily`), `publishedAt` (relative, es-AR), topic chips, and an importance indicator.
- **Sort** by importance (default) or recency. **Filter** by source family, topic, entity, region; free-text `q`.
- Empty/loading/error states; pagination or infinite scroll.

### 3. `legal_mode` gating (important — legal correctness)
- `metadata_only` docs (media/GDELT/RSS): show **title + deck + "Leer en {source} →"** linking `sourceUrl`. **Never render full body.**
- `fulltext_internal` docs (CNV regulatory): may show more context + the PDF attachment link (`attachments[].url`); badge as "Regulatorio".

### 4. Single-doc / cluster view
- `/[locale]/noticias/[docId]`: doc detail + "Cobertura relacionada" (cluster siblings).
- Show entities (companies/regulators) and topics as links that filter the feed.

### 5. Entity/topic cross-links
- Clicking a company chip → feed filtered to that entity. Same for topic/region.

## Acceptance criteria
- Feed renders live from the API; filters + sort + pagination work server-side.
- `metadata_only` docs never show full text; CNV docs expose the PDF link.
- Dark aesthetic, Spanish, responsive (cards stack on mobile).
- `tsc` clean both backend and frontend.

## Out of scope
- The weekly digest generator / email (separate ticket).
- Editorial admin (human-in-the-loop) tooling.
- New connectors (Boletín Oficial primary source).
