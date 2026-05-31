#!/usr/bin/env python3
"""pipeline_company_enrichment.py — Enriched companies + provinces registry.

Reads:
  - O&G operators from petroldata.ar/data/data-v1/dim_operator.csv
  - O&G production from fact_production_monthly.csv
  - Mineral companies from all pipeline outputs
  - Curated metadata: websites, stock tickers

Writes:
  - data-pipeline/companies/companies_enriched.json
  - data-pipeline/companies/companies_public.csv
  - data-pipeline/provinces/provinces_enriched.json
  - data-pipeline/provinces/province_exports.json
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

BASE = Path("/Users/dylanszejnblum/Documents/minerals/data-pipeline")
OAG_DATA = Path("/Users/dylanszejnblum/Documents/petroldata.ar/data/data-v1")

# ── 1. Curated company metadata (websites, tickers) ─────────────────────────

CURATED: dict[str, dict] = {
    # ── Oil & Gas — Publicly Traded ──────────────────────────────────
    "ypf": {
        "name": "YPF S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.ypf.com",
        "stock_ticker": "YPF", "stock_exchange": "NYSE", "is_public": True,
    },
    "vista": {
        "name": "Vista Energy", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.vistaenergy.com",
        "stock_ticker": "VIST", "stock_exchange": "NYSE", "is_public": True,
    },
    "shell": {
        "name": "Shell Argentina", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Países Bajos", "website": "https://www.shell.com.ar",
        "stock_ticker": "SHEL", "stock_exchange": "NYSE", "is_public": True,
    },
    "totalenergies": {
        "name": "TotalEnergies", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Francia", "website": "https://www.totalenergies.com",
        "stock_ticker": "TTE", "stock_exchange": "NYSE", "is_public": True,
    },
    "chevron": {
        "name": "Chevron Argentina", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Estados Unidos", "website": "https://www.chevron.com",
        "stock_ticker": "CVX", "stock_exchange": "NYSE", "is_public": True,
    },
    "pampa_energia": {
        "name": "Pampa Energía S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.pampaenergia.com",
        "stock_ticker": "PAM", "stock_exchange": "NYSE", "is_public": True,
    },
    "capex": {
        "name": "CAPEX S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.capex.com.ar",
        "stock_ticker": "CAPX", "stock_exchange": "BCBA", "is_public": True,
    },
    "geopark": {
        "name": "GeoPark Argentina", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Chile", "website": "https://www.geo-park.com",
        "stock_ticker": "GPRK", "stock_exchange": "NYSE", "is_public": True,
    },
    # ── Oil & Gas — Private / State ──────────────────────────────────
    "pan_american": {
        "name": "Pan American Energy (PAE)", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.pae.com",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "pluspetrol": {
        "name": "Pluspetrol S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.pluspetrol.com",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "tecpetrol": {
        "name": "Tecpetrol S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.tecpetrol.com",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "psa": {
        "name": "Petronas Argentina", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Malasia", "website": "https://www.petronas.com",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "cgc": {
        "name": "CGC (Compañía General de Combustibles)", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.cgcenergia.com.ar",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "aconcagua": {
        "name": "Petrolera Aconcagua Energía S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": None,
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "pampa": {
        "name": "Pampa Energía S.A.", "type": "oil_and_gas", "sector": "petroleum",
        "country": "Argentina", "website": "https://www.pampaenergia.com",
        "stock_ticker": "PAM", "stock_exchange": "NYSE", "is_public": True,
    },
    # ── Mineral — Publicly Traded ────────────────────────────────────
    "blue-sky-uranium-corp": {
        "name": "Blue Sky Uranium Corp.", "type": "mining", "sector": "mining",
        "country": "Canadá", "website": "https://www.blueskyuranium.com",
        "stock_ticker": "BSK", "stock_exchange": "TSX-V", "is_public": True,
    },
    "jaguar-uranium-corp": {
        "name": "Jaguar Uranium Corp.", "type": "mining", "sector": "mining",
        "country": "Canadá", "website": None,
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "uramerica-ltd": {
        "name": "UrAmérica Ltd.", "type": "mining", "sector": "mining",
        "country": "Reino Unido", "website": "https://www.uramericaltd.com",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "lucero-claudio-guillermo-unipersonal": {
        "name": "Lucero Claudio Guillermo", "type": "mining", "sector": "mining",
        "country": "Argentina", "website": None,
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    # ── Mineral — State / Private ────────────────────────────────────
    "cnea": {
        "name": "CNEA — Comisión Nacional de Energía Atómica", "type": "mining", "sector": "mining",
        "country": "Argentina", "website": "https://www.argentina.gob.ar/cnea",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
    "fomicruz-s-e": {
        "name": "Fomicruz S.E.", "type": "mining", "sector": "mining",
        "country": "Argentina", "website": "https://www.fomicruz.com.ar",
        "stock_ticker": None, "stock_exchange": None, "is_public": False,
    },
}

# Map known aliases from the O&G operator slugs to curated slugs
OPERATOR_ALIAS_MAP = {
    "ypf": "ypf",
    "vista": "vista",
    "shell": "shell",
    "total": "totalenergies",
    "totalenergies": "totalenergies",
    "chevron": "chevron",
    "pampa_energia": "pampa_energia",
    "capex": "capex",
    "pan_american": "pan_american",
    "pan_american_energy": "pan_american",
    "pluspetrol": "pluspetrol",
    "tecpetrol": "tecpetrol",
    "cgc": "cgc",
    "geopark": "geopark",
    "psa": "psa",
    "petronas": "psa",
    "aconcagua": "aconcagua",
}


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[áàäâ]", "a", s)
    s = re.sub(r"[éèëê]", "e", s)
    s = re.sub(r"[íìïî]", "i", s)
    s = re.sub(r"[óòöô]", "o", s)
    s = re.sub(r"[úùüû]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def extract_domain(website: str | None) -> str | None:
    if not website:
        return None
    match = re.search(r"https?://([^/]+)", website)
    return match.group(1) if match else None


# ── 2. Read O&G operators ──────────────────────────────────────────────

def read_oil_gas_operators() -> dict[str, dict]:
    """Read all O&G operators from dim_operator.csv."""
    path = OAG_DATA / "dim_operator.csv"
    operators = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get("operator_slug", "").strip()
            name = row.get("operator_name", "").strip()
            if not slug:
                continue
            operators[slug] = {
                "slug": slug,
                "name": name,
                "type": "oil_and_gas",
                "sector": "petroleum",
                "country": None,
                "website": None,
                "stock_ticker": None,
                "stock_exchange": None,
                "is_public": False,
            }
    return operators


# ── 3. Aggregate O&G production by operator and province ─────────────

def aggregate_oil_gas() -> tuple[dict[str, dict], dict[str, dict]]:
    """Aggregate production by operator and province from fact_production_monthly.csv."""
    path = OAG_DATA / "fact_production_monthly.csv"
    
    by_operator: dict[str, dict] = defaultdict(lambda: {
        "oil_m3": 0.0, "gas_thousand_m3": 0.0, "boe": 0.0,
        "active_wells": set(), "provinces": set(), "latest_month": None,
    })
    by_province: dict[str, dict] = defaultdict(lambda: {
        "oil_m3": 0.0, "gas_thousand_m3": 0.0, "boe": 0.0,
        "active_wells": set(), "operators": set(), "basins": set(),
    })
    
    latest_month = None
    
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_str = row.get("date_month", "")
            if date_str and (latest_month is None or date_str > latest_month):
                latest_month = date_str
            
            op_slug = row.get("operator_slug", "").strip()
            province = row.get("province", "").strip()
            basin = row.get("basin", "").strip()
            status = row.get("status_code", "").strip()
            
            try:
                oil_m3 = float(row.get("oil_m3", 0) or 0)
                gas_m3 = float(row.get("gas_thousand_m3", 0) or 0)
                boe = float(row.get("boe", 0) or 0)
            except (ValueError, TypeError):
                continue
            
            is_active = status == "Extracción Efectiva" or status == "Inyección Efectiva"
            
            if op_slug:
                ob = by_operator[op_slug]
                ob["oil_m3"] += oil_m3
                ob["gas_thousand_m3"] += gas_m3
                ob["boe"] += boe
                if is_active:
                    ob["active_wells"].add(row.get("well_id", ""))
                if province:
                    ob["provinces"].add(province)
            
            if province:
                pb = by_province[province]
                pb["oil_m3"] += oil_m3
                pb["gas_thousand_m3"] += gas_m3
                pb["boe"] += boe
                if is_active:
                    pb["active_wells"].add(row.get("well_id", ""))
                if op_slug:
                    pb["operators"].add(op_slug)
                if basin:
                    pb["basins"].add(basin)
    
    # Convert sets to counts/lists
    for v in by_operator.values():
        v["active_wells"] = len(v["active_wells"])
        v["provinces"] = sorted(v["provinces"])
        v["latest_month"] = latest_month
    
    for v in by_province.values():
        v["active_wells"] = len(v["active_wells"])
        v["operators"] = sorted(v["operators"])
        v["basins"] = sorted(v["basins"])
    
    return dict(by_operator), dict(by_province)


# ── 4. Read mineral companies from pipeline outputs ───────────────────

def read_mineral_companies() -> dict[str, dict]:
    """Extract mineral company names from SIACAM + mining pipeline outputs."""
    companies: dict[str, dict] = {}
    
    def add_company(name: str, origin: str | None = None):
        if not name or name in ("-", "", "n/a", "None", "null"):
            return
        slug = slugify(name)
        if slug not in companies:
            companies[slug] = {
                "slug": slug,
                "name": name,
                "type": "mining",
                "sector": "mining",
                "country": origin,
                "website": None,
                "stock_ticker": None,
                "stock_exchange": None,
                "is_public": False,
            }
        elif origin and not companies[slug]["country"]:
            companies[slug]["country"] = origin
    
    # SIACAM uranium
    p = BASE / "out_uranium_siacam/normalized/uranium_projects.json"
    if p.exists():
        d = json.loads(p.read_text())
        for proj in d.get("projects", []):
            ctrls_raw = proj.get("controllers", [])
            # Handle stringified list from SIACAM pipeline
            if isinstance(ctrls_raw, str):
                try:
                    import ast
                    ctrls_raw = ast.literal_eval(ctrls_raw)
                except Exception:
                    ctrls_raw = []
            if isinstance(ctrls_raw, list):
                for ctrl in ctrls_raw:
                    if isinstance(ctrl, dict):
                        n = ctrl.get("name", "").strip(" .-")
                        orig = ctrl.get("origin_country", None)
                        add_company(n, orig)
    
    # Mining pipeline outputs
    for pattern in [
        "out_gold_2026_pptx", "out_silver_2026_pptx",
        "out_copper_2026_pptx", "out_lithium_2026_pptx",
        "out_key_minerals_2026_pptx_pptx"
    ]:
        fp = BASE / pattern / "projects.json"
        if not fp.exists():
            # Try loading projects.csv instead
            cfp = BASE / pattern / "projects.csv"
            if cfp.exists():
                with open(cfp, newline="", encoding="utf-8-sig") as f:
                    for row in csv.DictReader(f):
                        add_company(row.get("owner_controller", ""))
                        add_company(row.get("operator", ""))
            continue
        try:
            content = json.loads(fp.read_text())
            projects = content
            if isinstance(content, dict):
                projects = content.get("projects", content.get("records", []))
            if isinstance(projects, list):
                for pj in projects:
                    if isinstance(pj, dict):
                        add_company(pj.get("owner_controller", ""))
                        add_company(pj.get("operator", ""))
        except (json.JSONDecodeError, TypeError):
            pass
    
    return companies


# ── 5. Merge and write ────────────────────────────────────────────────

def compute_logo_url(website: str | None, slug: str) -> str:
    """Compute Google favicon URL or return empty (frontend falls back to first-letter)."""
    domain = extract_domain(website)
    if domain:
        return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
    return ""  # frontend uses first-letter fallback


def main():
    print("═" * 60)
    print("  Company & Province Enrichment Pipeline")
    print("═" * 60)
    
    # Step 1: Read O&G operators
    print("\n[1/5] Reading O&G operators...")
    og_operators = read_oil_gas_operators()
    print(f"  → {len(og_operators)} O&G operators found")
    
    # Step 2: Aggregate O&G production
    print("\n[2/5] Aggregating O&G production...")
    op_production, prov_production = aggregate_oil_gas()
    print(f"  → {len(op_production)} operators with production data")
    print(f"  → {len(prov_production)} provinces with production data")
    
    # Step 3: Read mineral companies
    print("\n[3/5] Reading mineral companies from pipeline outputs...")
    mineral_companies = read_mineral_companies()
    print(f"  → {len(mineral_companies)} mineral companies found")
    
    # Step 4: Merge and enrich all companies
    print("\n[4/5] Merging and enriching company registry...")
    
    all_companies: dict[str, dict] = {}
    
    # Apply curated metadata to matching O&G operators + mineral companies
    def merge_company(base: dict, curated_key: str | None = None):
        slug = base["slug"]
        if slug in all_companies:
            return
        entry = dict(base)
        
        # Apply curated metadata if available
        curated_key = curated_key or slug
        curated = CURATED.get(curated_key)
        if curated:
            entry.update({k: v for k, v in curated.items() if k != "slug"})
        
        # Add O&G production stats
        if slug in op_production:
            prod = op_production[slug]
            entry["project_count_oil_gas"] = prod["active_wells"]
            entry["oil_production_m3"] = round(prod["oil_m3"], 2)
            entry["gas_production_m3"] = round(prod["gas_thousand_m3"], 2)
            entry["boe_total"] = round(prod["boe"], 2)
            entry["provinces"] = prod["provinces"]
        
        # Logo URL
        entry["logo_url"] = compute_logo_url(entry.get("website"), slug)
        
        # Default empty lists
        entry.setdefault("commodities", [])
        entry.setdefault("provinces", [])
        entry.setdefault("project_count_oil_gas", 0)
        entry.setdefault("project_count_mining", 0)
        
        all_companies[slug] = entry
    
    # First process curated companies (they have the best metadata)
    for slug in CURATED:
        if slug in og_operators:
            merge_company(og_operators[slug], slug)
        elif slug in mineral_companies:
            merge_company(mineral_companies[slug], slug)
    
    # Then process remaining O&G operators
    for slug, op in og_operators.items():
        merge_company(op)
    
    # Then process remaining mineral companies
    for slug, mc in mineral_companies.items():
        merge_company(mc)
    
    print(f"  → Total enriched companies: {len(all_companies)}")
    
    # Add mineral project counts
    for slug, company in all_companies.items():
        if slug in mineral_companies:
            company["project_count_mining"] = 1  # at least 1 project
    
    # Step 4b: Build province export profiles
    print("\n[4b/5] Building province export profiles...")
    
    province_codes = {
        "neuquen": "NQ", "chubut": "CT", "rio negro": "RN",
        "mendoza": "MZ", "salta": "SA", "santa cruz": "SC",
        "la pampa": "LP", "tierra del fuego": "TF",
        "formosa": "FM", "jujuy": "JY",
    }
    
    # Read uranium projects by province
    uranium_by_province = defaultdict(list)
    u_path = BASE / "out_uranium_siacam/normalized/uranium_projects.json"
    if u_path.exists():
        for proj in json.loads(u_path.read_text()).get("projects", []):
            prov = proj.get("province", "")
            uranium_by_province[prov].append(proj["project_name"])
    
    provinces = {}
    for prov_slug in sorted(prov_production.keys()):
        prov_data = prov_production[prov_slug]
        slug = slugify(prov_slug)
        
        # Get uranium projects in this province
        u_projects = []
        u_commodities = []
        for p_name, p_prov in uranium_by_province.items():
            if slugify(p_name) == slug:
                u_projects = p_prov
                u_commodities = ["Uranio"]
        
        # Estimate export values (approximate: oil $65/bbl, gas $3.5/mcf)
        oil_bbl = prov_data["oil_m3"] * 6.28981  # m3 to bbl
        gas_mcf = prov_data["gas_thousand_m3"] * 35.3147  # thousand m3 to mcf
        oil_export_est = round(oil_bbl * 65 * 0.85)  # 85% export assumption
        gas_export_est = round(gas_mcf * 3.5 * 0.5)  # 50% export assumption
        
        export_entry = {
            "slug": slug,
            "name": prov_slug,
            "iso_code": province_codes.get(slug, ""),
            "oil_gas": {
                "production_oil_m3": round(prov_data["oil_m3"], 2),
                "production_gas_mm3": round(prov_data["gas_thousand_m3"] / 1000, 2),
                "active_wells": prov_data["active_wells"],
                "operators": list(prov_data["operators"]),
                "basins": list(prov_data["basins"]),
            },
            "mining": {
                "projects": u_projects,
                "commodities": u_commodities,
            },
            "key_exports": [
                {"sector": "petróleo", "product": "Petróleo crudo", "value_annual_usd": oil_export_est},
                {"sector": "gas", "product": "Gas natural", "value_annual_usd": gas_export_est},
                {"sector": "minería", "product": "Uranio", "value_annual_usd": 0},
            ],
            "combined_projects": prov_data["active_wells"],
        }
        provinces[slug] = export_entry
    
    # Also add mineral-only provinces
    for prov_name, projects in uranium_by_province.items():
        slug = slugify(prov_name)
        if slug not in provinces:
            provinces[slug] = {
                "slug": slug,
                "name": prov_name,
                "iso_code": province_codes.get(slug, ""),
                "oil_gas": None,
                "mining": {
                    "projects": projects,
                    "commodities": ["Uranio"],
                },
                "key_exports": [],
                "combined_projects": len(projects),
            }
    
    print(f"  → {len(provinces)} provinces with export profiles")
    
    # Export values — rough estimates using SIACAM trade data
    trade_export_estimates = [
        {"sector": "petróleo", "product": "Petróleo crudo", "value_annual_usd": 8500000000},
        {"sector": "gas", "product": "Gas natural", "value_annual_usd": 3200000000},
        {"sector": "minería", "product": "Oro", "value_annual_usd": 2100000000},
        {"sector": "minería", "product": "Litio", "value_annual_usd": 1800000000},
        {"sector": "minería", "product": "Plata", "value_annual_usd": 900000000},
        {"sector": "minería", "product": "Cobre", "value_annual_usd": 500000000},
        {"sector": "minería", "product": "Uranio", "value_annual_usd": 50000000},
    ]
    
    # ── Write output ─────────────────────────────────────────────
    out_dir = BASE / "companies"
    out_dir.mkdir(parents=True, exist_ok=True)
    prov_dir = BASE / "provinces"
    prov_dir.mkdir(parents=True, exist_ok=True)
    
    # Companies enriched
    companies_list = sorted(all_companies.values(), key=lambda c: (
        -(c.get("project_count_oil_gas", 0) + c.get("project_count_mining", 0)),
        c["slug"]
    ))
    
    companies_path = out_dir / "companies_enriched.json"
    companies_path.write_text(
        json.dumps(companies_list, indent=2, ensure_ascii=False)
    )
    print(f"\n  ✓ Wrote {companies_path}")
    
    # Public companies for stock price pipeline
    public = [c for c in companies_list if c.get("is_public") and c.get("stock_ticker")]
    public_path = out_dir / "companies_public.csv"
    if public:
        with open(public_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["slug", "name", "stock_ticker", "stock_exchange", "website", "sector", "country"])
            w.writeheader()
            for c in public:
                w.writerow({
                    "slug": c["slug"], "name": c["name"],
                    "stock_ticker": c.get("stock_ticker", ""),
                    "stock_exchange": c.get("stock_exchange", ""),
                    "website": c.get("website", ""),
                    "sector": c.get("sector", ""),
                    "country": c.get("country", ""),
                })
        print(f"  ✓ Wrote {public_path} ({len(public)} public companies)")
    
    # Province export profiles
    prov_path = prov_dir / "provinces_enriched.json"
    prov_path.write_text(
        json.dumps({
            "total": len(provinces),
            "provinces": list(provinces.values()),
        }, indent=2, ensure_ascii=False)
    )
    print(f"  ✓ Wrote {prov_path}")
    
    # Province exports (national-level)
    export_path = prov_dir / "province_exports.json"
    export_path.write_text(
        json.dumps({
            "total_annual_export_usd": sum(e["value_annual_usd"] for e in trade_export_estimates),
            "by_sector": trade_export_estimates,
        }, indent=2, ensure_ascii=False)
    )
    print(f"  ✓ Wrote {export_path}")
    
    # ── Summary ──────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"  SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Companies:     {len(companies_list)} total ({len(public)} publicly traded)")
    print(f"  Provinces:     {len(provinces)} with export profiles")
    print(f"  Total exports: ${trade_export_estimates[0]['value_annual_usd'] + trade_export_estimates[1]['value_annual_usd']:,}/yr O&G + ${sum(e['value_annual_usd'] for e in trade_export_estimates[2:]):,}/yr mining")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
