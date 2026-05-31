"""Stage 3b — deterministic markdown → schema parser.

Reads the per-project markdown files written by stage 3a (and the
ocr_manifest.json that lists them), and emits one schema record per project
into extracted.json. No LLM in the loop here; this is pure Python so it's
fast, free to iterate, and inspectable.

Parsing strategy (commodity-agnostic):

1. **Labeled-line fields.** A dict of label patterns drives extraction of
   single-line fields like `Province: Santa Cruz` or `Area: 304,167 ha`.
   Bilingual aliases (Spanish + English) are listed alongside.

2. **Sectioned tables.** Markdown tables are extracted and classified by
   nearest preceding heading. A heading mentioning "Reserve(s)" routes
   subsequent tables to `reserves`; anything else routes to `resources`.
   Column headers are normalized to `<Symbol>_<unit>` schema keys
   (`Au (g/t)` → `Au_g_t`, `% U` → `pct_U`). The first column is the
   category (`Measured`, `Probable`, `Total`, …).

3. **Commodity inference.** If `primary_commodity` isn't found as a labeled
   line, we infer it from which symbols appear in the resources tables
   (Au → Gold, U → Uranium, Cu → Copper, Li → Lithium, Ag → Silver).
   `by_products` collects the remaining metal symbols seen in the tables.

4. **Sources.** A heading containing "Source" begins a bullet/numbered list
   that becomes `sources_consulted`.

`source_pages` is stamped from the OCR manifest, not parsed from text.

Tune the label maps, table-column normalizer, and section detection below
once real OCR output is available — they're all data, not logic.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable

# ----- 1. Labeled-line field extraction ----------------------------------

# Maps a destination path (dotted) to a list of regex patterns. Patterns
# are matched line-by-line, case-insensitive, and capture group 1 is the
# value. Order matters — first match wins.
TOP_LEVEL_LABELS: dict[str, list[str]] = {
    "primary_commodity": [
        r"^\s*\**\s*(?:Primary\s+)?Commodity\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Mineral(?:es)?\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "status": [
        r"^\s*\**\s*Status\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Estado\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "deposit_type": [
        r"^\s*\**\s*Deposit\s+Type\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Type\s+of\s+Deposit\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Tipo\s+de\s+Dep[oó]sito\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "owner_controller": [
        r"^\s*\**\s*Owner(?:\s*/\s*Controller)?\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Controller\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Titular\s*(?:/\s*Controlador)?\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "operator": [
        r"^\s*\**\s*Operator\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Operador(?:a)?\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
}

LOCATION_LABELS: dict[str, list[str]] = {
    "province": [
        r"^\s*\**\s*Province\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Provincia\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "country": [
        r"^\s*\**\s*Country\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Pa[ií]s\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "latitude_dms": [r"^\s*\**\s*Latitude\s*\**\s*[:\-]\s*(.+?)\s*$"],
    "longitude_dms": [r"^\s*\**\s*Longitude\s*\**\s*[:\-]\s*(.+?)\s*$"],
}

TECH_ECON_LABELS: dict[str, list[str]] = {
    "productive_capacity": [
        r"^\s*\**\s*Productive\s+Capacity\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Capacidad\s+Productiva\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "estimated_annual_production": [
        r"^\s*\**\s*(?:Estimated\s+)?Annual\s+Production\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Producci[oó]n\s+Anual(?:\s+Estimada)?\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "capex": [r"^\s*\**\s*Capex\s*\**\s*[:\-]\s*(.+?)\s*$"],
    "mining_method": [
        r"^\s*\**\s*Mining\s+Method\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*M[eé]todo\s+de\s+Miner[ií]a\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
    "product": [
        r"^\s*\**\s*Product\s+to\s+obtain\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Product\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Producto\s*\**\s*[:\-]\s*(.+?)\s*$",
    ],
}

YEAR_LABELS: dict[str, list[str]] = {
    "since_production": [
        r"^\s*\**\s*Since\s+Production\s*\**\s*[:\-]\s*(\d{4})\s*$",
        r"^\s*\**\s*Producci[oó]n\s+desde\s*\**\s*[:\-]\s*(\d{4})\s*$",
        r"^\s*\**\s*In\s+Production\s+Since\s*\**\s*[:\-]\s*(\d{4})\s*$",
    ],
    "estimated_lom_years": [
        r"^\s*\**\s*(?:Estimated\s+)?LOM(?:\s+years)?\s*\**\s*[:\-]\s*([\d.]+)\s*(?:years?)?\s*$",
        r"^\s*\**\s*Vida\s+(?:Util|Útil)\s*(?:Estimada)?\s*\**\s*[:\-]\s*([\d.]+)\s*$",
    ],
    "resources_year": [
        r"^\s*\**\s*Resources?\s+Year\s*\**\s*[:\-]\s*(\d{4})\s*$",
        r"^\s*\**\s*A[nñ]o\s+de\s+Recursos\s*\**\s*[:\-]\s*(\d{4})\s*$",
    ],
}

AREA_LABELS = [
    r"^\s*\**\s*Area\s*\**\s*[:\-]\s*([\d.,]+)\s*(?:ha|hect[aá]reas?)\s*$",
    r"^\s*\**\s*[AÁ]rea\s*\**\s*[:\-]\s*([\d.,]+)\s*(?:ha|hect[aá]reas?)\s*$",
]


# ----- 2. Number parsing -------------------------------------------------

def _to_number(s: str) -> float | int | None:
    """'304,167' → 304167  ·  '4.87' → 4.87  ·  '1,100' → 1100  ·  'n/a' → None."""
    if s is None:
        return None
    t = re.sub(r"[,\s]", "", str(s)).strip()
    if not t:
        return None
    try:
        n = float(t)
    except ValueError:
        return None
    return int(n) if n.is_integer() else n


# ----- 3. Column-header normalizer --------------------------------------

# Order matters: more-specific patterns first.
# Symbol class tolerates internal dots so Mistral's mis-OCR of subscripted
# formulas (U3O8 → 'U.O.', V2O5 → 'V.O.') still recognizes a column.
_SYM_CLS = r"[A-Za-z][A-Za-z0-9.]*"
_HEADER_PCT_PREFIX = re.compile(rf"^\s*%\s*(?P<sym>{_SYM_CLS})\s*$")
_HEADER_SYM_PCT = re.compile(rf"^\s*(?P<sym>{_SYM_CLS})\s*\(\s*%\s*\)\s*$")
_HEADER_SYM_UNIT = re.compile(
    rf"^\s*(?P<sym>{_SYM_CLS})\s*\(\s*(?P<unit>[A-Za-z0-9/%]+)\s*\)\s*$"
)
_HEADER_SYM_UNIT_NO_PAREN = re.compile(
    rf"^\s*(?P<sym>{_SYM_CLS})\s+(?P<unit>[A-Za-z0-9/%]+)\s*$"
)
_HEADER_BARE_SYM = re.compile(rf"^\s*(?P<sym>{_SYM_CLS})\s*$")


_KNOWN_OXIDE_REMAP: dict[str, str] = {
    "uo": "U3O8",
    "vo": "V2O5",
    "lio": "Li2O",
}

def _clean_symbol(sym: str) -> str:
    """Strip internal dots in OCR-mangled formulas so 'U.O.' becomes 'UO'.
    Then remap known oxide fragments back to proper formula names.
    """
    cleaned = sym.replace(".", "")
    # Remap oxide fragments BEFORE individual element extraction
    if cleaned.lower() in _KNOWN_OXIDE_REMAP:
        return _KNOWN_OXIDE_REMAP[cleaned.lower()]
    return cleaned


_LATEX_SUB_SUP = re.compile(r"[_^]\{[^}]*\}")


def normalize_col_header(h: str) -> str | None:
    """Convert a table column header into a `<Symbol>_<unit>` schema key.

    Returns None for header cells that aren't value columns (e.g. 'Category').
    """
    if not h:
        return None
    # Strip LaTeX-style subscripts/superscripts emitted by some OCR engines
    # for chemical formulas: 'U_{x}O_{x} (%)' → 'UO (%)'.
    raw = _LATEX_SUB_SUP.sub("", h).replace(" ", " ").strip()

    # First the explicit special-cases that mean "percent of element X":
    m = _HEADER_PCT_PREFIX.match(raw)
    if m:
        return f"pct_{_clean_symbol(m.group('sym'))}"
    m = _HEADER_SYM_PCT.match(raw)
    if m:
        return f"pct_{_clean_symbol(m.group('sym'))}"

    # Symbol + parenthesized unit
    m = _HEADER_SYM_UNIT.match(raw)
    if m:
        sym = _clean_symbol(m.group("sym"))
        unit = m.group("unit").replace("/", "_").replace("%", "pct")
        return f"{sym}_{unit}"

    # Symbol + space-separated unit ("Au g/t")
    m = _HEADER_SYM_UNIT_NO_PAREN.match(raw)
    if m:
        sym = _clean_symbol(m.group("sym"))
        unit = m.group("unit").replace("/", "_").replace("%", "pct")
        return f"{sym}_{unit}"

    # Bare known symbol
    m = _HEADER_BARE_SYM.match(raw)
    if m:
        return _clean_symbol(m.group("sym"))

    return None


# ----- 4. Markdown table parsing ----------------------------------------

# A table row is a pipe-delimited line with at least one cell.
_TABLE_ROW = re.compile(r"^\s*\|(.+)\|\s*$")
_SEPARATOR_ROW = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$")


def _split_cells(row: str) -> list[str]:
    inner = row.strip()
    if inner.startswith("|"):
        inner = inner[1:]
    if inner.endswith("|"):
        inner = inner[:-1]
    return [c.strip() for c in inner.split("|")]


def _extract_tables(md: str) -> list[dict]:
    """Find markdown tables and return [{heading, header_cells, rows}]."""
    lines = md.splitlines()
    tables: list[dict] = []
    current_heading: str | None = None
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        # Track the latest heading; markdown headings start with '#'.
        if stripped.startswith("#"):
            current_heading = stripped.lstrip("#").strip()
            i += 1
            continue
        # A simple bolded line (no colon) can also act as a section title.
        if (
            stripped.startswith("**")
            and stripped.endswith("**")
            and ":" not in stripped
            and len(stripped) > 4
        ):
            current_heading = stripped.strip("*").strip()
            i += 1
            continue

        if _TABLE_ROW.match(stripped):
            header_cells = _split_cells(stripped)
            # Skip separator if it's the next line; tolerate tables with no
            # separator row at all (some OCR output omits them).
            j = i + 1
            if j < len(lines) and _SEPARATOR_ROW.match(lines[j].strip()):
                j += 1
            rows: list[list[str]] = []
            while j < len(lines) and _TABLE_ROW.match(lines[j].strip()):
                rows.append(_split_cells(lines[j].strip()))
                j += 1
            if rows:
                tables.append(
                    {
                        "heading": current_heading,
                        "header_cells": header_cells,
                        "rows": rows,
                    }
                )
            i = j
            continue
        i += 1
    return tables


def _classify_bucket(heading: str | None) -> str:
    """A heading mentioning 'Reserve' routes the table to `reserves`; else `resources`."""
    if heading and re.search(r"reserva|reserve", heading, flags=re.IGNORECASE):
        return "reserves"
    return "resources"


_RESOURCE_CATEGORY_RE = re.compile(
    r"^\s*(measured|indicated|inferred|m\s*&\s*i|m\s*\+\s*i|"
    r"measured\s+&\s+indicated|total|rar|ir|demonstrated)\b",
    re.IGNORECASE,
)
_RESERVE_CATEGORY_RE = re.compile(
    r"^\s*(proven|probable|proved|p\s*&\s*p|proven\s+&\s+probable|"
    r"proved\s+&\s+probable)\b",
    re.IGNORECASE,
)
_SECTION_BREAK_RE = re.compile(
    r"^\s*(?:mineral\s+)?(resources?|reserves?)\b", re.IGNORECASE
)


def _bucket_for_category(category: str, fallback: str) -> str:
    """Per-row routing: bucket by the category name; fall back to the heading-derived bucket."""
    if _RESERVE_CATEGORY_RE.match(category):
        return "reserves"
    if _RESOURCE_CATEGORY_RE.match(category):
        return "resources"
    return fallback


def _is_real_header_row(row: list[str]) -> bool:
    """A 'real' header row hides under a span row: first cell empty, other cells
    look like `Sym (unit)` headers."""
    if not row or len(row) < 2 or row[0].strip():
        return False
    keys = [normalize_col_header(c) for c in row[1:] if c.strip()]
    real = [k for k in keys if k]
    return len(real) >= 2


def _is_section_break_row(row: list[str]) -> bool:
    """A row that is a section change ('RESERVES (2024)' as the first cell)."""
    if not row:
        return False
    return bool(_SECTION_BREAK_RE.match(row[0]))


def _table_to_buckets(table: dict) -> dict[str, list[dict]]:
    """Convert one markdown table into {bucket: rows}.

    Handles two complications the underlying OCR introduces:

    1. **Two-row headers.** Mistral renders a top span row (`RESOURCES | Grade
       | | | Metal Content | | |`) with the real column headers (`Cu (%) | Au
       (g/t) | …`) as the next row. We promote that next row when it has an
       empty first cell and at least two symbol-shaped cells.

    2. **Multi-section tables.** A single markdown table can contain both a
       resources section and a reserves section, separated by an internal
       row whose first cell is `RESERVES (2024)`. We re-bucket per-row when
       we see one of those, and re-promote the next header row if present.

    Row-level bucket override: even within one section heading, categories
    like `Proven`/`Probable` always route to reserves; `Measured`/`Indicated`
    /`Inferred` always to resources. The section heading is only a fallback.
    """
    raw_headers = list(table["header_cells"])
    rows = list(table["rows"])
    if not raw_headers:
        return {"resources": [], "reserves": []}

    bucket = _classify_bucket(table.get("heading"))

    # If the first remaining row is the real header, promote it.
    if rows and _is_real_header_row(rows[0]):
        raw_headers = rows[0]
        rows = rows[1:]

    value_keys: list[str | None] = [normalize_col_header(h) for h in raw_headers[1:]]

    out: dict[str, list[dict]] = {"resources": [], "reserves": []}
    for row in rows:
        if not row or not row[0].strip():
            continue
        if _is_section_break_row(row):
            # 'RESERVES (2024)' → switch bucket; the next row may be a new
            # real-header row for the new section.
            first = row[0].strip().lower()
            bucket = "reserves" if "reserve" in first else "resources"
            continue
        if _is_real_header_row(row):
            raw_headers = row
            value_keys = [normalize_col_header(h) for h in raw_headers[1:]]
            continue
        category = row[0].strip()
        if re.match(r"^[-=]+$", category):
            continue
        values: dict = {}
        for key, cell in zip(value_keys, row[1:]):
            if not key:
                continue
            num = _to_number(cell)
            if num is not None:
                values[key] = num
        if not values:
            continue
        row_bucket = _bucket_for_category(category, bucket)
        out[row_bucket].append({"category": category, "values": values})
    return out


def _table_to_rows(table: dict) -> list[dict]:
    """Backwards-compatible flattener used by the existing parse_markdown call."""
    buckets = _table_to_buckets(table)
    return buckets["resources"] + buckets["reserves"]


# ----- 5. Commodity inference & by-products -----------------------------

SYMBOL_TO_NAME = {
    # Atomic symbols (preferred — short and unambiguous).
    "Au": "Gold",
    "Ag": "Silver",
    "U": "Uranium",
    "Cu": "Copper",
    "Li": "Lithium",
    "Pb": "Lead",
    "Zn": "Zinc",
    "Fe": "Iron",
    "Sn": "Tin",
    "Mo": "Molybdenum",
    "Mn": "Manganese",
    # Oxide subscripts that Mistral OCR sometimes emits as full formula
    # (U3O8, Li2O) or mangled (UO after dot-stripping, which is now U3O8).
    "U3O8": "Uranium",
    "Li2O": "Lithium",
    "V2O5": "Vanadium",
    # OCR-mangled subscript-formula headers (Mistral sometimes reads
    # 'U3O8' as 'U.O.' and 'V2O5' as 'V.O.'); after dot-stripping these
    # become 'UO' and 'VO'.
    "UO": "Uranium",
    "VO": "Vanadium",
    # Full element names — Mistral OCR often emits 'Uranium (t)' as a column.
    "Uranium": "Uranium",
    "Gold": "Gold",
    "Silver": "Silver",
    "Copper": "Copper",
    "Lithium": "Lithium",
    "Vanadium": "Vanadium",
    "Lead": "Lead",
    "Zinc": "Zinc",
    "Iron": "Iron",
}


def _symbols_in_tables(tables_by_bucket: dict[str, list[dict]]) -> list[str]:
    seen: list[str] = []
    for rows in tables_by_bucket.values():
        for r in rows:
            for k in (r.get("values") or {}).keys():
                # 'Au_g_t' → 'Au'; 'pct_U' → 'U'
                if k.startswith("pct_"):
                    sym = k.split("_", 1)[1]
                else:
                    sym = k.split("_", 1)[0]
                if sym not in seen:
                    seen.append(sym)
    return seen


def _infer_primary_and_byproducts(
    tables_by_bucket: dict[str, list[dict]],
) -> tuple[str | None, list[str]]:
    syms = _symbols_in_tables(tables_by_bucket)
    if not syms:
        return None, []
    primary = SYMBOL_TO_NAME.get(syms[0])
    byproducts = [SYMBOL_TO_NAME[s] for s in syms[1:] if s in SYMBOL_TO_NAME]
    return primary, byproducts


# ----- 6. Other extractors ----------------------------------------------

_COORD_RE = re.compile(
    r"\d+\s*°\s*\d+\s*['’]\s*\d+(?:\.\d+)?\s*[\"”]\s*[NSEW]",
)


_BARE_COORD_LINE = re.compile(
    r"^\s*(\d+\s*°\s*\d+\s*['’]\s*\d+(?:\.\d+)?\s*[\"”]\s*[NSEW])\s*$"
)

_DMS_PARSE_RE = re.compile(
    r"^\s*(\d+)\s*°\s*(\d+)\s*['’′]\s*(\d+(?:\.\d+)?)\s*[\"”″]\s*([NSEW])\s*$"
)


def dms_to_decimal(dms: str | None) -> float | None:
    """Convert a DMS string like '48° 01\\' 55\" S' to signed decimal degrees.

    Returns None for inputs that don't parse. South/West become negative.
    """
    if not dms:
        return None
    m = _DMS_PARSE_RE.match(dms)
    if not m:
        return None
    deg, mn, sec, hemi = m.groups()
    val = float(deg) + float(mn) / 60.0 + float(sec) / 3600.0
    if hemi in ("S", "W"):
        val = -val
    return round(val, 6)


def _extract_bare_dms(md: str) -> tuple[str | None, str | None]:
    """Find two bare DMS lines (lat, lon).

    Many fact sheets show coordinates without a 'Latitude:'/'Longitude:' label
    — just two lines of DMS text near the top. We grab the first two such
    lines in document order; the one ending N/S is latitude, E/W is longitude.
    """
    lat: str | None = None
    lon: str | None = None
    for line in md.splitlines():
        m = _BARE_COORD_LINE.match(line)
        if not m:
            continue
        val = m.group(1).strip()
        if val.endswith(("N", "S")) and lat is None:
            lat = val
        elif val.endswith(("E", "W")) and lon is None:
            lon = val
        if lat and lon:
            break
    return lat, lon


def _extract_controller_operator(md: str) -> tuple[str | None, str | None]:
    """Parse the 'CONTROLLER | OPERATOR' block.

    The header line is the marker; the value follows on subsequent non-blank
    lines until the next labeled line or section heading. If the joined value
    contains a pipe, split into (controller, operator); otherwise both fields
    take the same value.
    """
    lines = md.splitlines()
    header_idx = -1
    for i, raw in enumerate(lines):
        line = _strip_bold(raw).strip()
        if re.match(
            r"^(controller\s*[\|/]\s*operator|titular\s*[\|/]\s*operador(?:a)?)\s*$",
            line,
            re.IGNORECASE,
        ):
            header_idx = i
            break
    if header_idx < 0:
        return None, None

    # The OCR sometimes inserts blank lines between value lines (e.g.
    # 'National Atomic Energy\n\nCommission (CNEA)'). Tolerate up to a
    # couple of blank lines before deciding the section is over.
    collected: list[str] = []
    blank_streak = 0
    for raw in lines[header_idx + 1 :]:
        line = _strip_bold(raw).strip()
        if not line:
            if not collected:
                continue
            blank_streak += 1
            if blank_streak >= 2:
                break
            continue
        if line.startswith("#"):
            break
        if _is_labeled_line(line):
            break
        if line in {"---", "***"}:
            break
        # An ÁREA / status / etc. labeled line will set the labeled-line check
        # above; bare unlabeled lines are part of the value.
        collected.append(line)
        blank_streak = 0
        if len(collected) >= 6:
            break

    joined = " ".join(collected).strip()
    if not joined:
        return None, None
    if "|" in joined:
        left, _, right = joined.partition("|")
        return left.strip() or None, right.strip() or None
    return joined, joined


_BANNER_RE = re.compile(
    r"PORTFOLIO\s+OF\s+(?:ADVANCED\s+)?PROJECTS?\s*[\|/]\s*(?P<commodity>[A-Z][A-Z\s/&-]+)",
    re.IGNORECASE,
)

_COMMODITY_NORMALIZE = {
    "URANIUM": "Uranium",
    "GOLD": "Gold",
    "SILVER": "Silver",
    "COPPER": "Copper",
    "LITHIUM": "Lithium",
    "IRON": "Iron",
    "ZINC": "Zinc",
    "LEAD": "Lead",
}


def _extract_banner_commodity(md: str) -> str | None:
    """Many fact sheets carry a `PORTFOLIO OF ADVANCED PROJECTS | URANIUM`
    banner at the top of each page. Use it as the primary-commodity fallback
    when the page itself doesn't print a 'Primary Commodity:' label."""
    for raw in md.splitlines():
        line = _strip_bold(raw).strip()
        m = _BANNER_RE.search(line)
        if not m:
            continue
        token = m.group("commodity").strip().upper().split()[0]
        return _COMMODITY_NORMALIZE.get(token) or token.title()
    return None


def _extract_by_products(md: str) -> list[str]:
    """Find 'By-product(s): Vanadium, Copper' or 'Subproductos: ...' lines."""
    patterns = [
        r"^\s*\**\s*By[\s\-]?products?\s*\**\s*[:\-]\s*(.+?)\s*$",
        r"^\s*\**\s*Subproductos?\s*\**\s*[:\-]\s*(.+?)\s*$",
    ]
    val = _first_match(md, patterns)
    if not val:
        return []
    # Comma or pipe separated; "and" too.
    parts = re.split(r"\s*[,/|]\s*|\s+and\s+|\s+y\s+", val)
    return [p.strip() for p in parts if p.strip()]


def _extract_location_blurb(md: str) -> str | None:
    """Find a 'Location: ...' single-line blurb (uranium-portfolio style)."""
    line_match = _first_match(
        md,
        [
            r"^\s*\**\s*Location\s*\**\s*[:\-]\s*(.+?)\s*$",
            r"^\s*\**\s*Ubicaci[oó]n\s*\**\s*[:\-]\s*(.+?)\s*$",
        ],
    )
    if line_match:
        return line_match
    # Fall back to a 'Location' section's first paragraph.
    return _extract_location_description(md)


def _extract_coord_after_label(md: str, label_patterns: list[str]) -> str | None:
    for raw in md.splitlines():
        line = _strip_bold(raw)
        for pat in label_patterns:
            m = re.match(pat, line, flags=re.IGNORECASE)
            if m:
                # Grab the captured value, then extract the DMS substring (in
                # case OCR added trailing punctuation).
                val = _clean(m.group(1)) or ""
                coord = _COORD_RE.search(val)
                return coord.group(0) if coord else (val or None)
    return None


_DASH_PLACEHOLDERS = {"-", "–", "—", "n/a", "N/A", "—", "--"}


def _clean(value: str | None) -> str | None:
    """Strip stray bold/italic markers and surrounding punctuation from captures.

    Returns None for dash/placeholder values like '-' or 'N/A'.
    """
    if value is None:
        return None
    s = value.strip().strip("*").strip()
    if not s or s in _DASH_PLACEHOLDERS:
        return None
    return s


def _strip_bold(line: str) -> str:
    """Remove markdown bold/italic markers so labeled-line regexes don't have to."""
    return line.replace("**", "").replace("__", "")


def _first_match(md: str, patterns: list[str]) -> str | None:
    for raw in md.splitlines():
        line = _strip_bold(raw)
        for pat in patterns:
            m = re.match(pat, line, flags=re.IGNORECASE)
            if m:
                return _clean(m.group(1))
    return None


def _extract_project_name(md: str, fallback: str | None) -> str | None:
    """Prefer the longest meaningful H1, else a 'Project:' label, else fallback.

    Skips single-letter badge headings (e.g. `# U`) and document section
    headings (`# TECHNICAL AND ECONOMIC INFORMATION`, `# PROJECT GEOLOGY`,
    `# DISCLAIMER`) — these aren't project titles.
    """
    # match() anchors at start; we drop \b so prefix-style patterns like
    # 'compan...' still match longer real words like 'company's announcement'.
    NON_PROJECT = re.compile(
        r"(?:disclaimer|table\s+of\s+contents|portfolio|content|index|"
        r"technical\s+and\s+economic|project\s+geology|resources?\b|reserves?\b|"
        r"sources?\s+consult|sources?\s+cited|references?|authorities|"
        r"contenido|tabla\s+de\s+contenidos?|autoridades|"
        r"compan(?:y[''']?s)?\s+announc|aviso\s+de|"
        r"key\s+minerals|"
        r"advanced\s+[a-z]+\s+projects?|"
        r"initial\s+exploration|advanced\s+exploration|"
        r"preliminary\s+economic|feasibility\b)",
        re.IGNORECASE,
    )
    candidates: list[str] = []
    for line in md.splitlines():
        s = line.strip()
        if s.startswith("# ") and not s.startswith("## "):
            name = s.lstrip("# ").strip()
            name = re.sub(r"^\s*\d+\s*[|\-–:]\s*", "", name).strip()
            # Mistral OCR sometimes merges the commodity badge ('U', 'Au')
            # into the H1: '# U Sierra Pintada U'. Strip standalone 1-3 char
            # all-caps tokens from the start and end.
            name = re.sub(r"^\s*([A-Z]{1,3})\s+(?=[A-Z][a-z])", "", name)
            name = re.sub(r"\s+([A-Z]{1,3})\s*$", "", name)
            name = name.strip()
            if not name:
                continue
            # Effective character count without spaces — '# L i' is the
            # lithium 'Li' badge that Mistral split with a space.
            if len(name.replace(" ", "")) < 3:
                continue
            if NON_PROJECT.match(name):
                continue
            candidates.append(name)
    if candidates:
        return candidates[0]
    explicit = _first_match(
        md,
        [
            r"^\s*\**\s*Project\s*(?:Name)?\s*\**\s*[:\-]\s*(.+?)\s*$",
            r"^\s*\**\s*Proyecto\s*\**\s*[:\-]\s*(.+?)\s*$",
        ],
    )
    if explicit:
        return explicit
    return fallback


def _extract_area_ha(md: str) -> float | int | None:
    raw = _first_match(md, AREA_LABELS)
    return _to_number(raw) if raw is not None else None


_FOOTER_RE = re.compile(
    r"(ministerio\s+de\s+econom|secretar[ií]a\s+de\s+miner|rep[uú]blica\s+argentina)",
    re.IGNORECASE,
)

_MD_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def _drop_md_link_targets(s: str) -> str:
    """Replace '[label](url)' with just 'label' so source text reads cleanly."""
    return _MD_LINK_RE.sub(r"\1", s)


def _is_labeled_line(s: str) -> bool:
    return bool(re.match(r"^\**\s*[A-Za-zÁÉÍÓÚÑáéíóúñ][\w\s/.\-]*\**\s*[:\-]\s", s))


def _extract_sources(md: str) -> list[str]:
    """Collect entries under a 'Sources Consulted' / 'References' heading.

    Handles three list shapes in the same section:
      1. Bulleted (`- foo`, `* foo`, `• foo`) or numbered (`1. foo`).
      2. Indented continuations of a prior bullet.
      3. Plain paragraphs separated by blank lines (one paragraph = one source).
    """
    lines = md.splitlines()
    sources: list[str] = []
    in_section = False
    current_para: list[str] = []

    def _flush_para() -> None:
        if current_para:
            text = " ".join(current_para).strip()
            text = _drop_md_link_targets(text)
            if text and not _FOOTER_RE.search(text):
                sources.append(text)
            current_para.clear()

    for raw_line in lines:
        line = raw_line.rstrip()
        s = _strip_bold(line).strip()

        if s.startswith("#"):
            heading = s.lstrip("#").strip()
            _flush_para()
            in_section = bool(re.search(r"\b(sources?|references?|fuentes?)\b", heading, re.IGNORECASE))
            continue

        if not in_section:
            continue

        if not s:
            _flush_para()
            continue

        # Stop the section if a new top-level marker appears (logo line, etc.).
        if s.startswith("---") or s.startswith("***"):
            _flush_para()
            in_section = False
            continue

        # Bullet / numbered.
        m = re.match(r"^\s*(?:[-*•]|\d+\.)\s+(.+?)\s*$", line)
        if m:
            _flush_para()
            sources.append(_drop_md_link_targets(m.group(1).strip()))
            continue

        # Indented continuation of the previous bullet.
        if (line.startswith("  ") or line.startswith("\t")) and sources and not current_para:
            sources[-1] = (sources[-1] + " " + _drop_md_link_targets(s)).strip()
            continue

        current_para.append(_drop_md_link_targets(s))

    _flush_para()
    return sources


# Province lookup map — used as fallback when the PDF doesn't have a
# "Province: X" label. The province is often embedded in the location
# description text instead.
_PROVINCE_MAP: dict[str, str] = {
    "buenos aires": "Buenos Aires",
    "catamarca": "Catamarca",
    "chaco": "Chaco",
    "chubut": "Chubut",
    "córdoba": "Córdoba",
    "cordoba": "Córdoba",
    "corrientes": "Corrientes",
    "entre ríos": "Entre Ríos",
    "entre rios": "Entre Ríos",
    "formosa": "Formosa",
    "jujuy": "Jujuy",
    "la pampa": "La Pampa",
    "la rioja": "La Rioja",
    "mendoza": "Mendoza",
    "misiones": "Misiones",
    "neuquén": "Neuquén",
    "neuquen": "Neuquén",
    "río negro": "Río Negro",
    "rio negro": "Río Negro",
    "salta": "Salta",
    "san juan": "San Juan",
    "san luis": "San Luis",
    "santa cruz": "Santa Cruz",
    "santa fe": "Santa Fe",
    "santiago del estero": "Santiago del Estero",
    "tierra del fuego": "Tierra del Fuego",
    "tucumán": "Tucumán",
    "tucuman": "Tucumán",
    # City → province mappings for location descriptions that name cities
    "rawson": "Chubut",
    "comodoro rivadavia": "Chubut",
    "puerto madryn": "Chubut",
    "trelew": "Chubut",
    "ushuaia": "Tierra del Fuego",
    "río gallegos": "Santa Cruz",
    "rio gallegos": "Santa Cruz",
    "caleta olivia": "Santa Cruz",
    "el calafate": "Santa Cruz",
    "viedma": "Río Negro",
    "san carlos de bariloche": "Río Negro",
    "bariloche": "Río Negro",
    "valcheta": "Río Negro",
    "general roca": "Río Negro",
    "cipolletti": "Río Negro",
    "neuquén capital": "Neuquén",
    "neuquen capital": "Neuquén",
    "zapala": "Neuquén",
    "malargüe": "Mendoza",
    "malargue": "Mendoza",
    "san rafael": "Mendoza",
    "mendoza capital": "Mendoza",
    "la paz": "Mendoza",
    "san juan capital": "San Juan",
    "jáchal": "San Juan",
    "jachal": "San Juan",
    "iglesia": "San Juan",
    "calingasta": "San Juan",
    "la rioja capital": "La Rioja",
    "famatina": "La Rioja",
    "salta capital": "Salta",
    "cafayate": "Salta",
    "san antonio de los cobres": "Salta",
    "tolar grande": "Salta",
    "la quiaca": "Jujuy",
    "humahuaca": "Jujuy",
    "susques": "Jujuy",
    "tilcara": "Jujuy",
    "tinogasta": "Catamarca",
    "belén": "Catamarca",
    "belen": "Catamarca",
    "antofagasta de la sierra": "Catamarca",
    "fiambalá": "Catamarca",
    "fiambala": "Catamarca",
}


def _extract_province_from_description(desc: str | None) -> str | None:
    """Fallback: try to find a province name in the location description text."""
    if not desc:
        return None
    desc_lower = desc.lower()
    for alias, province in _PROVINCE_MAP.items():
        if alias in desc_lower:
            return province
    return None


def _extract_location_description(md: str) -> str | None:
    """Find a 'Location' section's free-text blurb, if present.

    We look for a heading containing 'Location'/'Ubicación' and take the next
    paragraph (lines until the next heading or blank-blank).
    """
    lines = md.splitlines()
    in_section = False
    buf: list[str] = []
    for raw_line in lines:
        s = raw_line.strip()
        if s.startswith("#"):
            heading = s.lstrip("#").strip()
            if in_section and buf:
                break
            in_section = bool(re.search(r"location|ubicaci", heading, re.IGNORECASE))
            buf = []
            continue
        if not in_section:
            continue
        if not s:
            if buf:
                break
            continue
        # Skip pipe-style tables and labeled lines.
        if s.startswith("|"):
            continue
        if re.match(r"^\s*\**\s*\w[\w\s/.\-]+\s*\**\s*[:\-]\s", s):
            continue
        buf.append(s)
    text = " ".join(buf).strip()
    return text or None


# ----- 7. Geology section extraction ------------------------------------

_GEO_BREAK_AFTER = re.compile(r"^(?:#{1,3}\s+|\*\*|---+|\*{3,}|___+)")


def _extract_section_after_heading(md: str, start_pattern: str, stop_pattern: str) -> str | None:
    """Extract all paragraph text between a start heading and a stop heading.

    Used for free-text sections like 'Regional Geology' and 'Deposit Geology'.
    """
    lines = md.splitlines()
    in_section = False
    buf: list[str] = []
    for raw in lines:
        s = raw.strip()
        # Detect headings
        if s.startswith("#") or s.startswith("**") or s.startswith("---"):
            heading = s.lstrip("#").lstrip("*").lstrip("- ").strip()
            if in_section:
                # If we were already in the section and hit a new heading, stop
                if not re.search(start_pattern, heading, re.IGNORECASE):
                    break
            if re.search(start_pattern, heading, re.IGNORECASE):
                in_section = True
                buf = []
                continue
            if in_section and re.search(stop_pattern, heading, re.IGNORECASE):
                break
            continue
        if not in_section:
            continue
        if not s:
            continue
        # Skip tables and labeled lines
        if s.startswith("|"):
            continue
        if re.match(r"^\s*\**\s*\w[\w\s/.\-]+\s*\**\s*[:\-]\s", s):
            continue
        buf.append(s)
    text = " ".join(buf).strip()
    return text or None


# ----- 8. Per-project parse --------------------------------------------

def parse_markdown(md: str, fallback_name: str | None = None, source_pages: list[int] | None = None) -> dict:
    # Fallbacks: bare DMS lines when labels aren't there; CONTROLLER|OPERATOR
    # block when the inline labels miss.
    bare_lat, bare_lon = _extract_bare_dms(md)
    co_ctrl, co_op = _extract_controller_operator(md)
    explicit_byp = _extract_by_products(md)
    lat_dms = _extract_coord_after_label(md, LOCATION_LABELS["latitude_dms"]) or bare_lat
    lon_dms = _extract_coord_after_label(md, LOCATION_LABELS["longitude_dms"]) or bare_lon

    # Province: try labeled line first, then fall back to description text
    prov_line = _first_match(md, LOCATION_LABELS["province"])
    loc_desc = _extract_location_blurb(md)
    if not prov_line:
        prov_line = _extract_province_from_description(loc_desc)

    # Geology sections
    geology: dict[str, str] = {}
    geo_regional = _extract_section_after_heading(md, r"regional\s+geolog", r"deposit\s+geolog|geolog[aí]a\s+del\s+dep[óo]sito")
    if geo_regional:
        geology["regional"] = geo_regional
    geo_deposit = _extract_section_after_heading(md, r"deposit\s+geolog|geolog[aí]a\s+del\s+dep[óo]sito", r"sources?\s+consult|references?")
    if geo_deposit:
        geology["deposit"] = geo_deposit

    rec: dict = {
        "project_name": _extract_project_name(md, fallback_name),
        "primary_commodity": _first_match(md, TOP_LEVEL_LABELS["primary_commodity"]),
        "by_products": list(explicit_byp),
        "status": _first_match(md, TOP_LEVEL_LABELS["status"]),
        "location": {
            "province": prov_line,
            "country": _first_match(md, LOCATION_LABELS["country"]),
            "description": loc_desc,
            "latitude_dms": lat_dms,
            "longitude_dms": lon_dms,
            "latitude": dms_to_decimal(lat_dms),
            "longitude": dms_to_decimal(lon_dms),
        },
        "deposit_type": _first_match(md, TOP_LEVEL_LABELS["deposit_type"]),
        "owner_controller": _first_match(md, TOP_LEVEL_LABELS["owner_controller"]) or co_ctrl,
        "operator": _first_match(md, TOP_LEVEL_LABELS["operator"]) or co_op,
        "area_ha": _extract_area_ha(md),
        "technical_economic": {
            "since_production": None,
            "estimated_lom_years": None,
            "productive_capacity": _first_match(md, TECH_ECON_LABELS["productive_capacity"]),
            "estimated_annual_production": _first_match(md, TECH_ECON_LABELS["estimated_annual_production"]),
            "capex": _first_match(md, TECH_ECON_LABELS["capex"]),
            "mining_method": _first_match(md, TECH_ECON_LABELS["mining_method"]),
            "product": _first_match(md, TECH_ECON_LABELS["product"]),
        },
        "resources": [],
        "reserves": [],
        "resources_year": None,
        "geology": geology or None,
        "sources_consulted": _extract_sources(md),
        "source_pages": list(source_pages or []),
    }

    sp = _first_match(md, YEAR_LABELS["since_production"])
    if sp:
        rec["technical_economic"]["since_production"] = int(sp)
    lom = _first_match(md, YEAR_LABELS["estimated_lom_years"])
    if lom:
        rec["technical_economic"]["estimated_lom_years"] = _to_number(lom)
    ry = _first_match(md, YEAR_LABELS["resources_year"])
    if ry:
        rec["resources_year"] = int(ry)

    tables = _extract_tables(md)
    bucketed: dict[str, list[dict]] = {"resources": [], "reserves": []}
    for t in tables:
        buckets = _table_to_buckets(t)
        bucketed["resources"].extend(buckets["resources"])
        bucketed["reserves"].extend(buckets["reserves"])
    rec["resources"] = bucketed["resources"]
    rec["reserves"] = bucketed["reserves"]

    if not rec["primary_commodity"]:
        primary, byp = _infer_primary_and_byproducts(bucketed)
        if not primary:
            primary = _extract_banner_commodity(md)
            byp = []
        rec["primary_commodity"] = primary
        # Merge inferred by-products with any explicit ones; preserve order.
        for b in byp:
            if b not in rec["by_products"]:
                rec["by_products"].append(b)
    else:
        # Even if commodity was labeled, surface other metals seen in tables
        # that the page didn't list as explicit by-products.
        _, byp = _infer_primary_and_byproducts(bucketed)
        primary_lower = (rec["primary_commodity"] or "").lower()
        for b in byp:
            if b.lower() == primary_lower:
                continue
            if b not in rec["by_products"]:
                rec["by_products"].append(b)

    return rec


# ----- 8. CLI -----------------------------------------------------------

def parse(ocr_manifest_path: Path, out_dir: Path) -> Path:
    manifest = json.loads(ocr_manifest_path.read_text())
    records: list[dict] = []
    for entry in manifest:
        md_path = out_dir / entry["md_path"]
        if not md_path.exists():
            print(f"[stage3b] missing markdown: {md_path}; skipping")
            continue
        md = md_path.read_text(encoding="utf-8")
        rec = parse_markdown(
            md,
            fallback_name=entry.get("project_name"),
            source_pages=entry.get("page_numbers"),
        )
        records.append(rec)

    out_path = out_dir / "extracted.json"
    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"[stage3b] parsed {len(records)} record(s) → {out_path.name}")
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 3b: parse OCR markdown into records.")
    ap.add_argument("--manifest", type=Path, help="ocr_manifest.json")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    manifest_path = args.manifest or (args.out / "ocr_manifest.json")
    if not manifest_path.exists():
        raise SystemExit(f"Manifest not found: {manifest_path}. Run stage3a first.")
    parse(manifest_path, args.out)


if __name__ == "__main__":
    main()
