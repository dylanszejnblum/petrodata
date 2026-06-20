# INVERSIONES-3 — INDEC Energy Trade Pipeline (surplus + agro-vs-energy crossover)

**Effort:** ~8–10 hours
**Tags:** data-pipeline, backend, inversiones, indec, trade
**Depends on:** INVERSIONES-1 data layer; self-hosted Postgres (room for the series)

---

## Context

The marquee story — *"energy exports overtake agro by ~2030"* — and the **energy trade surplus** KPI can't be computed from our current data (`ProvinceExport` has exports only, no imports, and no agro sector). This ticket adds a **new primary-source fetch** so those become real, computed, sourced figures instead of curated guesses.

`petroldata.ar/market-data/fetch_energy_trade.py` already exists — **reuse/extend it** rather than starting fresh. The authoritative source is INDEC's *Intercambio Comercial Argentino (ICA)* / *complejos exportadores* (combustibles y energía; complejo agro). Confirm the exact dataset + URL during build; treat license per source.

## Requirements

### 1. Pipeline: fetch + normalize (petroldata.ar or data-pipeline)
- Fetch INDEC energy trade: monthly **energy exports** and **energy imports** (USD) → derive **surplus = exports − imports**.
- Fetch annual **agro exports** (complejo agroindustrial) and **energy exports** (USD) for the crossover endpoints.
- Emit normalized CSV/JSON with: `period`, `energyExportsUsd`, `energyImportsUsd`, `energySurplusUsd`, `agroExportsUsd`, plus a `source` (label + url + asOf) per series.
- Watermark/incremental where the source supports it; otherwise full refresh (small series).

### 2. Backend: model + seed + serve
```prisma
model FactEnergyTrade {
  id                Int      @id @default(autoincrement())
  period            DateTime @map("period") @db.Date     // monthly or annual
  granularity       String                               // "monthly" | "annual"
  energyExportsUsd  Float?   @map("energy_exports_usd")
  energyImportsUsd  Float?   @map("energy_imports_usd")
  energySurplusUsd  Float?   @map("energy_surplus_usd")
  agroExportsUsd    Float?   @map("agro_exports_usd")
  sourceLabel       String   @map("source_label")
  sourceUrl         String?  @map("source_url")
  sourceAsOf        String?  @map("source_as_of")
  @@unique([period, granularity])
  @@map("fact_energy_trade")
}
```
- `seed-energy-trade.ts` reading the normalized output (follow existing seed pattern; **upsert**, no TRUNCATE of unrelated tables).

### 3. Extend `/inversiones`
- Replace the placeholder `exportaciones.energiaUsd` (from `ProvinceExport`) with the real INDEC energy export figure where available.
- Add a `superavit` KPI (latest annual surplus, `tier: confirmado`, sourced) + MoM/YoY delta.
- Add a `cruce` (crossover) series: agro vs energy export lines with real endpoints; mark future points `proyectado` only if a cited projection is attached (otherwise show history only).

## Acceptance criteria
- Surplus = exports − imports, computed from INDEC, with a visible source + asOf.
- Agro and energy export series are real INDEC values (history); any future/projected point carries a citation or is omitted.
- Seed is idempotent and does **not** disturb production tables.
- `tsc` clean; pipeline run documented in the project README.

## Out of scope
- Frontend rendering of the crossover chart (extend INVERSIONES-1).
- Curated `proyectado` scenario bands (export ramp) — those need cited external sources, separate ticket.
- Provincial royalties / jobs indicators (bench, later).
