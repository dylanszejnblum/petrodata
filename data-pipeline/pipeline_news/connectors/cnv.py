"""CNV Hechos Relevantes connector — primary regulatory source.

The CNV publishes every issuer's material disclosures (hechos relevantes) as a
server-rendered HTML table. We scrape it with plain HTTP and keep only the
O&G-relevant rows (the feed is all-issuers — banks, financials, etc.).

These are public regulatory documents, so legal_mode = fulltext_internal: we
may store the disclosure text/PDF. We capture metadata + the document URL here;
fetching/OCR-ing the PDF body is left to enrichment.

Source: https://www.cnv.gov.ar/SitioWeb/HechosRelevantes
"""

from __future__ import annotations

import html
import re
from datetime import datetime, timedelta, timezone

import httpx

import news_schema as schema

NAME = "cnv"

URL = "https://www.cnv.gov.ar/SitioWeb/HechosRelevantes"

# Keep a row if the issuer name OR the description matches the sector. Tunable.
ENTITY_HINTS = [
    "YPF", "PAMPA", "VISTA", "PAN AMERICAN", "TECPETROL", "CAPEX", "CGC",
    "COMPAÑÍA GENERAL DE COMBUSTIBLES", "PLUSPETROL", "TRANSPORTADORA DE GAS",
    "TGS", "TGN", "GENNEIA", "CENTRAL PUERTO", "PETROLERA", "PETROLE",
    "PETRÓLEO", "HIDROCARBUR", "REFINOR", "RAIZEN", "RAÍZEN", "OIL & GAS",
    "ENERGÍA", "ENERGIA",
]
DESC_HINTS = [
    "VACA MUERTA", "OLEODUCTO", "GASODUCTO", "HIDROCARBUR", "GNL", "LNG",
    "RIGI", "SHALE", "NO CONVENCIONAL", "CONCESIÓN", "CONCESION", "CRUDO",
    "UPSTREAM", "MIDSTREAM", "REGAL", "NETBACK",
]

# Spanish month abbreviations as printed: "18 jun. 2026 18:38"
_MONTHS = {
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6, "jul": 7,
    "ago": 8, "sep": 9, "set": 9, "oct": 10, "nov": 11, "dic": 12,
}
_DATE_RE = re.compile(
    r"(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?", re.I)

_TR_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
_TD_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.S | re.I)
_HREF_RE = re.compile(r'href="([^"]+)"', re.I)
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# CNV's local timezone (America/Argentina/Buenos_Aires is UTC-3, no DST).
_ART = timezone(timedelta(hours=-3))


def _clean(s: str) -> str:
    return _WS_RE.sub(" ", html.unescape(_TAG_RE.sub(" ", s))).strip()


def _parse_date(s: str) -> str | None:
    m = _DATE_RE.search(s)
    if not m:
        return None
    day, mon, year, hh, mm = m.groups()
    month = _MONTHS.get(mon[:3].lower())
    if not month:
        return None
    dt = datetime(int(year), month, int(day),
                  int(hh) if hh else 0, int(mm) if mm else 0, tzinfo=_ART)
    return dt.astimezone(timezone.utc).isoformat()


def _is_relevant(entity: str, desc: str) -> bool:
    e, d = entity.upper(), desc.upper()
    return (any(h in e for h in ENTITY_HINTS)
            or any(h in d for h in DESC_HINTS))


def fetch(state: dict, limit: int | None = None) -> tuple[list[dict], dict]:
    state = state or {}
    last_seen = state.get("last_seen")

    resp = httpx.get(URL, timeout=40, follow_redirects=True,
                     headers={"User-Agent": "vacamuerta-news-ingest/0.1"})
    resp.raise_for_status()
    body = resp.text

    raws: list[dict] = []
    max_seen = last_seen
    for tr in _TR_RE.findall(body):
        cells = [_clean(c) for c in _TD_RE.findall(tr)]
        if len(cells) < 4:
            continue  # header / layout row
        fecha, entity, desc, docnum = cells[0], cells[1], cells[2], cells[3]
        iso = _parse_date(fecha)
        if not iso:
            continue
        if not _is_relevant(entity, desc):
            continue
        if last_seen and iso <= last_seen:
            continue
        hrefs = _HREF_RE.findall(tr)
        doc_url = next((h for h in hrefs if "publicview" in h.lower()),
                       hrefs[0] if hrefs else None)
        # Stable identity: prefer the per-disclosure document URL.
        source_url = doc_url or f"{URL}#{docnum}"
        raws.append({
            "source_url": source_url,
            "title": desc,
            "entity": entity.rstrip("."),
            "doc_number": docnum,
            "doc_url": doc_url,
            "published_iso": iso,
        })
        if not max_seen or iso > max_seen:
            max_seen = iso
        if limit and len(raws) >= limit:
            break

    print(f"[cnv] {len(raws)} new O&G hecho(s) (watermark={max_seen})")
    return raws, {"last_seen": max_seen}


def normalize(raw: dict) -> dict:
    attachments = []
    if raw.get("doc_url"):
        attachments.append({"type": "pdf", "url": raw["doc_url"], "sha256": None})
    return schema.make_doc(
        source_url=raw["source_url"],
        source_name="CNV",
        source_family="regulatoria",
        source_type="web",
        title=raw["title"],
        legal_mode="fulltext_internal",
        published_at=raw.get("published_iso"),
        event_date=(raw.get("published_iso") or "")[:10] or None,
        entities={"companies": [raw["entity"]] if raw.get("entity") else [],
                  "people": [], "projects": [], "blocks": [],
                  "regulators": ["CNV"]},
        signals={"is_primary_source": True, "is_regulatory": True,
                 "is_interview": False, "is_opinion": False,
                 "is_paid_source": False},
        attachments=attachments,
        language="es",
    )
