# BACKEND-PROMPT — Unified Companies + Provinces: O&G, Logos, Stock Prices

**Effort:** ~5 hours
**Tags:** backend, companies, oil-and-gas, logos, stock-prices, provinces
**Depends on:** DATA-012 (enriched company/province data)

---

## What Changed

The existing `companies` module only covers mineral companies. Need to:

1. Merge O&G operators into the same companies endpoint
2. Add logo URLs and stock ticker data to company responses
3. Build a stock price integration for publicly traded companies
4. Create province endpoints that merge mineral projects + O&G production + export data

## 1. Schema Changes

### Company Model — Add Fields to `DimOperator` or Create Unified View

```prisma
model Company {
  slug           String   @id
  name           String
  type           String   // "mining" | "oil_and_gas" | "both"
  sector         String   // "mining" | "petroleum" | "both"
  country        String
  website        String?
  logoUrl        String?  @map("logo_url")  // favicon URL
  stockTicker    String?  @map("stock_ticker")
  stockExchange  String?  @map("stock_exchange")
  isPublic       Boolean  @map("is_public") @default(false)
  commoditySlugs String[] @map("commodities")
  provinces      String[]

  projectCountOilGas Int?   @map("project_count_oil_gas") @default(0)
  projectCountMining  Int?   @map("project_count_mining") @default(0)

  @@map("company")
}
```

**Strategy:** Create a new `company` table seeded from `data-pipeline/companies/companies_enriched.json` rather than modifying `dim_operator`. This avoids breaking the existing O&G pipeline and gives a clean unified schema.

### Province Export Model

```prisma
model ProvinceExport {
  id              Int      @id @default(autoincrement())
  slug            String
  provinceName    String   @map("province_name")
  sector          String   // "petroleo" | "gas" | "mineria" | "agro"
  productName     String   @map("product_name")
  valueAnnualUsd  Decimal  @map("value_annual_usd") @db.Decimal(14,2)

  @@unique([slug, sector, productName])
  @@map("province_export")
}
```

## 2. API Endpoints

### Companies (extended)

```
GET /api/v2/companies
  → extends existing: also returns O&G operators
  Add filter: ?type=oil_and_gas|mining|all

GET /api/v2/companies/{slug}
  → extends existing: adds logo_url, stock_ticker, stock_exchange, is_public
  For O&G companies: adds oil_gas_production_summary

GET /api/v2/companies/public
  → Only publicly traded companies with tickers
  → Used by frontend to show stock price cards
```

### Stock Prices

```
GET /api/v2/companies/prices
  → [
      { ticker: "YPF", price: 42.15, change_pct: 1.2, exchange: "NYSE" },
      { ticker: "VIST", price: 48.30, change_pct: -0.5, exchange: "NYSE" },
      { ticker: "PAM", price: 85.20, change_pct: 3.1, exchange: "NYSE" }
    ]
```

**Implementation:** Use Yahoo Finance API (free, no key needed for basic quotes):
```typescript
GET https://query1.finance.yahoo.com/v8/finance/chart/YPF
// Returns current price + change
```

Cache the response for 5 minutes (don't hit Yahoo on every request).

### Provinces (NEW MODULE)

```
GET /api/v2/provinces
  → List all provinces with combined mineral + O&G summary

GET /api/v2/provinces/{slug}
  → {
      name, iso_code,
      oil_gas: { production_oil_bbl_d, production_gas_mmcf_d, active_wells, vm_pct, top_operators },
      mining: { projects, commodities, controllers },
      exports: [{ sector, product, value_annual_usd }],
      combined_project_count
    }

GET /api/v2/provinces/{slug}/production
  → Monthly O&G time series for that province

GET /api/v2/provinces/{slug}/exports
  → Province export data by sector

GET /api/v2/provinces/export-summary
  → All provinces ranked by export value across petróleo/gas/minería
```

## 3. Data Seeding

**Seed order:**
1. `seed-companies.ts` — reads `data-pipeline/companies/companies_enriched.json`
2. `seed-provinces.ts` — reads `data-pipeline/provinces/provinces_enriched.json` + `province_exports.json`

Both idempotent (upsert by slug).

## Acceptance Criteria

- [ ] Companies endpoint returns O&G operators alongside mineral companies
- [ ] Filter by type (`?type=oil_and_gas`) works correctly
- [ ] Company detail includes logo_url, stock ticker, website
- [ ] Stock price endpoint returns live prices for public companies
- [ ] Stock prices cached for 5 minutes (no rate limiting)
- [ ] Provinces endpoint is a new module with both mineral + O&G data
- [ ] Province detail includes export profiles across all sectors
- [ ] Province production time series works (same pattern as operator production)
- [ ] All DTOs match the frontend spec

## What to Skip

- Do NOT scrape stock prices from Argentina's BYMA directly — Yahoo Finance is sufficient
- Do NOT rebuild the existing operators module — the new companies table is a VIEW layer on top
- Do NOT add real-time WebSocket for stock prices — 5-minute polling is fine
- Do NOT add historical stock prices — just current price + daily change
