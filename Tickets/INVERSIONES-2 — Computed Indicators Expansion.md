# INVERSIONES-2 — Computed Indicators Expansion (breakeven headroom + activity momentum)

**Effort:** ~4–5 hours
**Tags:** backend, inversiones, production, prices
**Depends on:** INVERSIONES-1 data layer (`GET /api/v2/inversiones`); `FactPrice` (EIA Brent/WTI) seeded; full production history

---

## Context

The computed `/inversiones` endpoint covers the production cluster + exports. Two more indicators are computable **from data we already hold** (no new fetch) and are highly persuasive to a finance audience. Add them to the same endpoint, keeping the "computed, source-cited, nothing at face value" rule.

A breakeven *reference* (~US$45/bbl) is an external/cited figure, not computable — so it stays a **clearly-labelled constant with a source**, while the **market price** beside it is computed live from `FactPrice`. The "headroom" (margin) between them is the story.

## Requirements

### 1. Breakeven headroom gauge
- Read the latest **Brent** price from `FactPrice` (`series = 'brent'`, max date).
- Expose a `breakeven` block on the inversiones payload:
```ts
breakeven: {
  brentUsd: number;            // computed: latest Brent
  brentAsOf: string;           // date from FactPrice
  referenceUsd: number;        // 45 — CITED constant, not computed
  headroomUsd: number;         // brentUsd - referenceUsd (computed)
  tier: "confirmado";          // the price is measured
  source: { label: "EIA (Brent)"; url; asOf };
  referenceSource: { label: "YPF (breakeven ~US$45/bbl)"; url?: string };
}
```
- If `FactPrice` has no Brent rows, omit the block (don't fabricate).

### 2. Activity momentum (wells connected / month)
- Derive **new wells per month** from `FactProductionMonthly`: a well's "connection month" = its earliest `dateMonth` with `boe > 0` (VM-flagged). Group by that month.
- Expose:
```ts
actividad: {
  unit: "pozos/mes";
  source: { label: "Secretaría de Energía — Producción de pozos"; url; asOf };
  points: Array<{ period: string; nuevosPozos: number; preliminary: boolean }>;
}
```
- Reuse the `referenceMonth()` partial-month logic to flag the trailing month `preliminary`.
- Compute efficiently (single grouped query / one pass), not per-well N+1.

### 3. Wire into the endpoint
- Add `breakeven` and `actividad` to the `getPage()` response. Keep existing fields unchanged (additive).
- Update Swagger description; re-sync `openapi.json` + `pnpm api:types`.

## Acceptance criteria
- `breakeven.brentUsd` matches the latest `FactPrice` Brent row; `headroomUsd` = brent − reference.
- `actividad.points` sums to the count of distinct VM wells; spot-check a month.
- No fabricated numbers; the cited reference is explicitly tagged with its source.
- `tsc` clean; no N+1 query.

## Out of scope
- The frontend gauge/chart rendering (extend INVERSIONES-1 separately).
- Permian/Texas breakeven comparison (external, cited — optional later).
