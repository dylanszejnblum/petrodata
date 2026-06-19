"""GDELT DOC 2.0 connector — the radar.

Pure JSON API, no scraping, no DRM. Surfaces media coverage matching the Vaca
Muerta query; we store metadata only (rights stay with the publisher), so
`legal_mode = metadata_only` and we never carry body_text.

Docs: https://api.gdeltproject.org/api/v2/doc/doc
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

import httpx

import news_schema as schema

NAME = "gdelt"

API = "https://api.gdeltproject.org/api/v2/doc/doc"

# O&G-specific net, restricted to AR sources. Bare province names are
# deliberately excluded — they pulled in football/tourism/etc. Every term here
# is sector-specific, so the radar stays on-topic without an extra filter.
QUERY = (
    '("Vaca Muerta" OR "cuenca neuquina" OR hidrocarburos OR shale OR GNL OR '
    'oleoducto OR gasoducto OR fracking OR "no convencional") sourcecountry:AR'
)

DEFAULT_TIMESPAN = "3d"   # cron runs more often than this; watermark trims dupes
MAX_RECORDS = 250         # GDELT artlist hard cap


def _parse_seendate(s: str) -> str | None:
    """GDELT 'seendate' is '20260615T120000Z' → ISO8601, or None."""
    try:
        dt = datetime.strptime(s, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except (ValueError, TypeError):
        return None


def fetch(state: dict, limit: int | None = None) -> tuple[list[dict], dict]:
    """Pull the recent artlist; emit only items newer than the watermark."""
    state = state or {}
    last_seen = state.get("last_seen")  # ISO string or None

    params = {
        "query": QUERY,
        "mode": "artlist",
        "format": "json",
        "timespan": DEFAULT_TIMESPAN,
        "sort": "datedesc",
        "maxrecords": str(MAX_RECORDS),
    }
    # GDELT throttles hard per-IP (≈1 req / 5s). Back off on 429/503.
    headers = {"User-Agent": "vacamuerta-news-ingest/0.1"}
    resp = None
    for attempt in range(4):
        resp = httpx.get(API, params=params, timeout=60, headers=headers)
        if resp.status_code in (429, 503):
            wait = 6 * (attempt + 1)
            print(f"[gdelt] {resp.status_code}; backing off {wait}s "
                  f"(attempt {attempt + 1}/4)")
            time.sleep(wait)
            continue
        break
    resp.raise_for_status()
    # GDELT occasionally returns empty body / non-JSON on no results.
    try:
        articles = resp.json().get("articles", []) or []
    except ValueError:
        articles = []

    raws: list[dict] = []
    max_seen = last_seen
    for art in articles:
        url = art.get("url")
        if not url:
            continue
        seen_iso = _parse_seendate(art.get("seendate", ""))
        if last_seen and seen_iso and seen_iso <= last_seen:
            continue  # already ingested on a prior tick
        raws.append({
            "source_url": url,
            "title": art.get("title") or "",
            "domain": art.get("domain") or "",
            "seendate_iso": seen_iso,
            "language": (art.get("language") or "spanish").lower(),
            "sourcecountry": art.get("sourcecountry"),
        })
        if seen_iso and (not max_seen or seen_iso > max_seen):
            max_seen = seen_iso
        if limit and len(raws) >= limit:
            break

    return raws, {"last_seen": max_seen}


_LANG2 = {"spanish": "es", "english": "en", "portuguese": "pt"}


def normalize(raw: dict) -> dict:
    """Raw GDELT artlist item → Document. Metadata only."""
    return schema.make_doc(
        source_url=raw["source_url"],
        source_name=raw.get("domain") or "gdelt",
        source_family="medio",
        source_type="web",
        title=raw.get("title") or "(sin título)",
        legal_mode="metadata_only",
        discovered_via=NAME,
        published_at=raw.get("seendate_iso"),
        language=_LANG2.get(raw.get("language", ""), "es"),
    )
