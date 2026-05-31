"""Schema definitions and value-key constants for the mining extraction pipeline.

The SCHEMA dict is the authoritative shape of one project record. It is loaded
into the Stage 3 system prompt as a literal block so the model has the same
contract that downstream stages enforce.
"""

from __future__ import annotations

SCHEMA: dict = {
    "project_name": "string (REQUIRED) — e.g. 'Cerro Moro', 'Don Otto'",
    "primary_commodity": "string (REQUIRED) — 'Gold', 'Uranium', etc.",
    "by_products": "array of strings — e.g. ['Silver']; [] if none",
    "status": "string — e.g. 'Operation', 'Feasibility'",
    "location": {
        "province": "string or null",
        "country": "string or null",
        "description": "string — free-text location blurb, or null",
        "latitude_dms": "string — coordinate as printed, or null",
        "longitude_dms": "string — coordinate as printed, or null",
        "latitude": "number — signed decimal degrees (S/W negative), or null",
        "longitude": "number — signed decimal degrees (S/W negative), or null",
    },
    "deposit_type": "string or null",
    "owner_controller": "string or null",
    "operator": "string or null",
    "area_ha": "number — hectares, thousands separators stripped, or null",
    "technical_economic": {
        "since_production": "integer year or null",
        "estimated_lom_years": "number or null",
        "productive_capacity": "string, keep units (e.g. '1,100 tpd'), or null",
        "estimated_annual_production": "string, keep units & multi-metal, or null",
        "capex": "string or null",
        "mining_method": "string or null",
        "product": "string or null",
    },
    "resources": [
        {
            "category": "string — 'Measured'/'Indicated'/'Inferred'/'Total'/…",
            "values": (
                "object — column→number. Gold/silver keys: "
                "Au_g_t, Ag_g_t, Au_kOz, Ag_kOz. Uranium keys: "
                "RAR_Tn, IR_Tn, pct_U."
            ),
        }
    ],
    "reserves": [
        {
            "category": "string — 'Proven'/'Probable'/…; [] if no table",
            "values": "object — same idea as resources",
        }
    ],
    "resources_year": "integer year or null",
    "sources_consulted": "array of strings — each source line as printed",
    "source_pages": "array of integers — pages this project spanned",
}

# Top-level scalar fields that are NOT containers; used by the flattener
# to project location.* / technical_economic.* without flattening lists.
SCALAR_TOP_LEVEL = [
    "project_name",
    "primary_commodity",
    "status",
    "deposit_type",
    "owner_controller",
    "operator",
    "area_ha",
    "resources_year",
]

NESTED_OBJECTS = ["location", "technical_economic"]

LIST_FIELDS_JOINED = ["by_products", "sources_consulted", "source_pages"]
LIST_JOIN_SEP = " | "

# Known value-keys used inside resources[].values / reserves[].values.
# Not enforced — new commodities may add keys following the naming rules —
# but stable ones live here so tests and the flattener can reference them.
KNOWN_VALUE_KEYS = {
    "gold_silver": ["Au_g_t", "Ag_g_t", "Au_kOz", "Ag_kOz"],
    "uranium": ["RAR_Tn", "IR_Tn", "pct_U"],
}

REQUIRED_FIELDS = ["project_name", "primary_commodity"]
