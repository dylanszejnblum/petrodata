# DATA-012 — Enrich Companies: Websites, Logos, Stock Tickers + O&G Province Exports

**Effort:** ~3 hours
**Tags:** data-pipeline, companies, logos, tickers, oil-and-gas, provinces

---

## Objective

Create enriched company and province datasets that merge minerals + oil & gas data, add company metadata (website, logo source, stock ticker), and produce province-level export summaries across mining, petroleum, and agriculture.

## What to Build

### 1. Enriched Companies Registry

Create a curated `companies_enriched.json` at `data-pipeline/companies/` covering ALL entities — both mineral companies AND oil & gas operators. Fields per company:

```json
{
  "slug": "ypf",
  "name": "YPF S.A.",
  "type": "oil_and_gas",
  "sector": "petroleum",
  "country": "Argentina",
  "website": "https://www.ypf.com",
  "logo_url": "https://www.google.com/s2/favicons?domain=ypf.com&sz=64",
  "stock_ticker": "YPF",
  "stock_exchange": "NYSE",
  "is_public": true,
  "project_count_oil_gas": 350,
  "project_count_mining": 0,
  "commodities": ["petroleo", "gas"],
  "provinces": ["Neuquén", "Santa Cruz", "Mendoza", "Chubut"]
}
```

### 2. Company Data Sources

Collect website + ticker for each company. Here's the starter list:

**Oil & Gas — Publicly Traded:**
| Slug | Name | Website | Ticker | Exchange |
|------|------|---------|--------|----------|
| ypf | YPF S.A. | ypf.com | YPF | NYSE |
| vista | Vista Energy | vistaenergy.com | VIST | NYSE |
| shell | Shell Argentina | shell.com.ar | SHEL | NYSE |
| totalenergies | TotalEnergies | totalenergies.com | TTE | NYSE |
| chevron | Chevron Argentina | chevron.com | CVX | NYSE |
| pampa_energia | Pampa Energía | pampaenergia.com | PAM | NYSE |
| capex | CAPEX S.A. | capex.com.ar | CAPX | BCBA |
| psa | Petronas | petronas.com | — | — |
| tecpetrol | Tecpetrol | tecpetrol.com | — | — (Techint) |
| pluspetrol | Pluspetrol | pluspetrol.com | — | — (private) |
| pan_american | Pan American Energy | pae.com | — | — (private/Bridas) |
| geopark | GeoPark | geo-park.com | GPRK | NYSE |

**Mineral Companies — Publicly Traded:**
| Slug | Name | Website | Ticker | Exchange |
|------|------|---------|--------|----------|
| bluesky_uranium | Blue Sky Uranium Corp. | blueskyuranium.com | BSK | TSX-V |
| jaguar_uranium | Jaguar Uranium Corp. | — | — | — |
| uramerica | UrAmérica Ltd. | uramericaltd.com | — | — |

**Mineral Companies — State/Private:**
| Slug | Name | Website | Notes |
|------|------|---------|-------|
| cnea | CNEA | argentina.gob.ar/cnea | State agency |
| fomicruz | Fomicruz S.E. | fomicruz.com.ar | Santa Cruz state |

### 3. Province Export Profiles

Create `provinces_export_profiles.json` with the following data per province:

```json
{
  "slug": "neuquen",
  "name": "Neuquén",
  "iso_code": "NQ",
  "oil_gas": {
    "production_oil_m3": 12500000,
    "production_gas_mm3": 85000000,
    "active_wells": 3500,
    "operators": ["ypf", "vista", "shell", "pan_american", "tecpetrol"],
    "basins": ["Neuquina"],
    "vm_production_pct": 0.65
  },
  "mining": {
    "projects": ["Chihuidos", "Cateos"],
    "commodities": ["Uranio"]
  },
  "key_exports": [
    { "sector": "petróleo", "product": "Crudo", "value_annual_usd": 5200000000 },
    { "sector": "gas", "product": "Gas natural", "value_annual_usd": 1800000000 },
    { "sector": "minería", "product": "Uranio", "value_annual_usd": 0 }
  ],
  "combined_projects": 3502,
  "employment_estimate": 45000
}
```

**Data sources:**
- O&G production: `/Users/dylanszejnblum/Documents/petroldata.ar/data/data-v1/fact_production_monthly.csv` — aggregate by province
- O&G operators: `dim_operator.csv` — which operators produce in each province
- Mining projects: `data-pipeline/out_uranium_siacam/normalized/uranium_projects.json` + existing pipeline outputs
- Export values: SIACAM trade data for mining exports; O&G export data from existing pipeline or INDEC

### 4. Seed Script

Write `pipeline_company_enrichment.py` that:
1. Reads existing mineral companies from `mineral-entities.util.ts` patterns
2. Reads O&G operators from `dim_operator.csv`
3. Merges with curated metadata (websites, tickers)
4. Aggregates O&G production by province
5. Writes output to `data-pipeline/companies/companies_enriched.json` and `data-pipeline/provinces/provinces_enriched.json`

## Acceptance Criteria

- [ ] Companies registry covers all 77 O&G operators + all mineral companies
- [ ] Website URLs provided for all major companies (top 30 by production/projects)
- [ ] Stock tickers for all publicly traded companies
- [ ] Province export profiles for all 11 O&G provinces + 6 mineral provinces
- [ ] Output JSON files ready for backend seeding
- [ ] All data validated against actual production numbers

## What to Skip

- Do NOT scrape stock prices (this is metadata — prices come from a separate pipeline)  
- Do NOT scrape logo images from websites — use favicons or fallback to first-letter
- Do NOT build a UI — this is a data pipeline ticket only

## Output Structure

```
data-pipeline/companies/
├── companies_enriched.json     # All companies with logos, tickers, website
├── companies_public.csv        # Subset: publicly traded only (for stock price pipeline)

data-pipeline/provinces/
├── provinces_enriched.json     # All provinces with combined mineral + O&G data
├── province_exports.json       # Export profiles per province
```
