# INVERSIONES-1 — Frontend Investment Thesis Page (`/inversiones`)

**Effort:** ~6–8 hours
**Tags:** frontend, inversiones, charts, marketing, spanish
**Depends on:** backend `GET /api/v2/inversiones` (merged, PR #9) deployed; `openapi.json` re-synced + `pnpm api:types`

---

## Context

The backend now serves a **computed** investment-thesis endpoint at `GET /api/v2/inversiones`. Every figure is derived from official production data already in the DB (full 2023→2026 history), source-cited, with the as-of date read from the data. This ticket builds the page that renders it — the data-driven investment section for vacamuerta.io aimed at energy/finance audiences.

There is **no curated marketing copy or projection** to render yet — only the `confirmado` tier (measured, computed). The `en_marcha` / `proyectado` tiers come later (INVERSIONES-3 + external-claims work), so design the layout to accept more tiers but only render what the API returns.

## API contract (already live)

`GET /api/v2/inversiones` → `{ data, meta }`. `data` shape:

```ts
{
  asOf: string;            // "2026-04" — latest COMPLETE month
  latestMonth: string;     // "2026-05" — may be partial
  tier: "confirmado";
  note: string;            // disclaimer about computed/pending tiers
  headline: string;        // computed true statement
  kpis: Array<{
    id: string; label: string; tier: "confirmado";
    figure: { kind: "point"; value: number };
    delta?: { pct: number; base: "YoY" };
    format: { prefix?: string; suffix?: string; decimals: number };
    source: { label: string; url: string; asOf: string };
  }>;
  serie: {                 // production ramp
    id: "produccion_vm"; title: string; unit: "bbl/d";
    source: { label; url; asOf };
    points: Array<{ period: string; oilBblD: number; gasMm3D: number; preliminary: boolean }>;
  };
  operadores: Array<{ slug; name; oilBblD; boe; sharePct }>;
  exportaciones: { energiaUsd: number; porSector: {sector; usd}[]; source };
}
```

## Requirements

### 1. Route + shell
- Route `/[locale]/inversiones` (matches existing i18n routing). All copy in **Spanish**.
- Match the existing dark dashboard aesthetic: near-black bg, uppercase/monospace micro-labels, thin borders, high-contrast white numerals.

### 2. Hero KPI grid
- Render `data.kpis` as cards: big value (formatted via `format`), label, the `delta` as a signed colored chip (`+31.7% YoY`), and a **visible source footnote** (`source.label` + `asOf`, linking `source.url`).
- Each card shows a tier badge (`Confirmado`) — drive color from the tier.
- **Formatting**: Argentine locale (`.` thousands, `,` decimals). `prefix`/`suffix`/`decimals` from `format`. Store/print raw values; never hardcode.

### 3. Production ramp chart (the centrepiece)
- Area/line chart of `serie.points` (`period` x, `oilBblD` y) — the 2023→2026 ramp.
- **Render `preliminary: true` points dashed/faded** with a "dato preliminar" note (the latest month is partial).
- Use `recharts`; defer `ResponsiveContainer` to the client (see existing chart components — SSR `-1` width warning).
- Source citation visible under the chart.

### 4. Operator leaderboard
- `data.operadores` as a horizontal bar list or table: operator name, `oilBblD`, and `sharePct` of VM boe. Top 8.

### 5. Headline + integrity framing
- Render `data.headline` prominently.
- Render `data.note` as a small disclaimer so the epistemic status (computed, tiers pending) is visible.

### 6. CTA band
- "¿Querés invertir o establecer operaciones?" with a contact action + the existing newsletter capture component (reuse `FooterNewsletterForm`).

## Acceptance criteria
- Page renders entirely from the live API (no hardcoded figures).
- Every number shows its source; the ramp shows the preliminary month distinctly.
- Responsive: KPI cards stack on mobile; chart scales.
- Lighthouse/`tsc` clean; no new external fonts.

## Out of scope
- `en_marcha` / `proyectado` tiers (no data yet) — leave layout slots but don't fabricate.
- The agro-vs-energy crossover + export ramp (INVERSIONES-3).
- Breakeven gauge + activity momentum (INVERSIONES-2).
