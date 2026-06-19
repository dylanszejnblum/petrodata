"""Schema definitions for the news ingest pipeline.

`DOCUMENT_SCHEMA` is the authoritative shape of one news Document. It is the
contract shared between this pipeline (the writer) and the backend importer
(the reader / sole DB writer). Every stage emits and consumes this shape.

A Document is one piece of editorial/regulatory/corporate content — an article,
a hecho relevante, a resolution, an audiencia edict, a corporate post — after
capture and normalization. Numeric series (production, prices, trade) are NOT
Documents; they live in the existing structured-data seeds.

Mirrors the §metadatos design in Ingest-news.md.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit

# ── Controlled vocabularies ──────────────────────────────────────────────────

SOURCE_FAMILIES = {
    "oficial",            # Secretaría de Energía, datos.gob.ar, Boletín Oficial
    "regulatoria",        # CNV, ENARGAS
    "oficial_provincial", # Neuquén, Río Negro, Mendoza
    "corporativa",        # YPF, PAE, Tecpetrol, Harbour
    "camara",             # CEPH, IAPG
    "think_tank",         # IAE Mosconi
    "ong",                # FARN, OPSur
    "medio",              # Shale24, EconoJournal, Río Negro
    "podcast",            # VM News Radio, Mejor Energía
    "proveedor",          # GDELT, Nexis, Factiva
}

SOURCE_TYPES = {"web", "api", "pdf", "social", "podcast"}

# How we are legally allowed to store/serve the content. The importer keys off
# this: metadata_only never persists full body_text for public serving.
LEGAL_MODES = {"metadata_only", "fulltext_internal", "licensed_fulltext"}

# ── The contract ─────────────────────────────────────────────────────────────

DOCUMENT_SCHEMA: dict = {
    "doc_id": "string (REQUIRED) — deterministic sha1 of canonical source_url",
    "source_name": "string (REQUIRED) — e.g. 'Boletín Oficial', 'shale24.com'",
    "source_family": f"string (REQUIRED) — one of {sorted(SOURCE_FAMILIES)}",
    "source_type": f"string (REQUIRED) — one of {sorted(SOURCE_TYPES)}",
    "source_url": "string (REQUIRED) — canonical URL of the item",
    "discovered_via": "string or null — e.g. 'gdelt' when surfaced by a radar",
    "retrieved_at": "ISO8601 (REQUIRED) — when the pipeline fetched it",
    "published_at": "ISO8601 or null — when the source published it",
    "event_date": "YYYY-MM-DD or null — date of the underlying fact/hecho",
    "title": "string (REQUIRED)",
    "deck": "string or null — short standfirst/lead",
    "body_text": "string or null — cleaned full text (subject to legal_mode)",
    "language": "string — ISO 639-1, default 'es'",
    "region": "array of strings — e.g. ['Neuquén', 'Río Negro']",
    "geo": {
        "province": "string or null",
        "locality": "string or null",
        "lat": "number or null",
        "lon": "number or null",
    },
    "entities": {
        "companies": "array of strings",
        "people": "array of strings",
        "projects": "array of strings",
        "blocks": "array of strings",
        "regulators": "array of strings",
    },
    "topics": "array of strings — editorial tags (midstream, GNL, RIGI, M&A, …)",
    "signals": {
        "is_primary_source": "bool",
        "is_regulatory": "bool",
        "is_interview": "bool",
        "is_opinion": "bool",
        "is_paid_source": "bool",
    },
    "numbers": {
        "oil_bpd": "number or null",
        "gas_mmm3d": "number or null",
        "capex_usd": "number or null",
        "fracture_stages": "number or null",
    },
    "attachments": "array of {type, url, sha256}",
    "cluster_id": "string or null — set by stage4_dedup",
    "novelty_score": "number or null — set by enrich/dedup",
    "importance_score": "number or null — set by enrich",
    "legal_mode": f"string (REQUIRED) — one of {sorted(LEGAL_MODES)}",
    "editor_notes": "string — human-in-the-loop, empty from pipeline",
}

REQUIRED_FIELDS = [
    "doc_id",
    "source_name",
    "source_family",
    "source_type",
    "source_url",
    "retrieved_at",
    "title",
    "legal_mode",
]


# ── Helpers ──────────────────────────────────────────────────────────────────


def canonical_url(url: str) -> str:
    """Normalize a URL for stable identity: drop fragment, lowercase host,
    strip a trailing slash on the path. Querystring is preserved (it can be
    significant for paged gov sites)."""
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower() or "https"
    netloc = parts.netloc.lower()
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((scheme, netloc, path, parts.query, ""))


def doc_id_for(url: str) -> str:
    """Deterministic id from the canonical URL — the upsert key."""
    return hashlib.sha1(canonical_url(url).encode("utf-8")).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_doc(*, source_url: str, source_name: str, source_family: str,
             source_type: str, title: str, legal_mode: str,
             **overrides) -> dict:
    """Build a Document with all keys present and sane defaults. Connectors set
    the fields they know; everything else gets a null/empty default so the
    shape is uniform before enrichment."""
    doc = {
        "doc_id": doc_id_for(source_url),
        "source_name": source_name,
        "source_family": source_family,
        "source_type": source_type,
        "source_url": canonical_url(source_url),
        "discovered_via": None,
        "retrieved_at": now_iso(),
        "published_at": None,
        "event_date": None,
        "title": title,
        "deck": None,
        "body_text": None,
        "language": "es",
        "region": [],
        "geo": {"province": None, "locality": None, "lat": None, "lon": None},
        "entities": {"companies": [], "people": [], "projects": [],
                     "blocks": [], "regulators": []},
        "topics": [],
        "signals": {"is_primary_source": False, "is_regulatory": False,
                    "is_interview": False, "is_opinion": False,
                    "is_paid_source": False},
        "numbers": {"oil_bpd": None, "gas_mmm3d": None, "capex_usd": None,
                    "fracture_stages": None},
        "attachments": [],
        "cluster_id": None,
        "novelty_score": None,
        "importance_score": None,
        "legal_mode": legal_mode,
        "editor_notes": "",
    }
    doc.update(overrides)
    return doc


def validate_doc(doc: dict) -> list[str]:
    """Return a list of human-readable problems; empty list means valid.
    Cheap structural + enum checks — the importer can trust a clean doc."""
    errs: list[str] = []
    for f in REQUIRED_FIELDS:
        if not doc.get(f):
            errs.append(f"missing required field: {f}")
    if doc.get("source_family") and doc["source_family"] not in SOURCE_FAMILIES:
        errs.append(f"bad source_family: {doc['source_family']}")
    if doc.get("source_type") and doc["source_type"] not in SOURCE_TYPES:
        errs.append(f"bad source_type: {doc['source_type']}")
    if doc.get("legal_mode") and doc["legal_mode"] not in LEGAL_MODES:
        errs.append(f"bad legal_mode: {doc['legal_mode']}")
    if doc.get("legal_mode") == "metadata_only" and doc.get("body_text"):
        errs.append("metadata_only doc must not carry body_text")
    return errs
