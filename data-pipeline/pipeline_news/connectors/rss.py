"""RSS/Atom connector — curated feeds from known sources.

Unlike GDELT (a wide, noisy net for unknown sources), this pulls a hand-picked
list of feeds. No throttling, no off-topic noise — you control the source list.
Most Argentine O&G media, corporate news pages, YouTube channels and podcasts
expose RSS/Atom under the hood, so one connector covers many sources.

Per-feed watermark: state is {feed_url: last_seen_iso}; a tick emits only
entries newer than the last one seen for that feed. One bad feed never aborts
the others.

legal_mode note: media feeds are stored metadata-only (title, link, short
snippet in `deck` — never full body_text), per Ingest-news.md's guidance for
copyrighted media.
"""

from __future__ import annotations

import calendar
import html
import re
from datetime import datetime, timezone

import feedparser
import httpx

import news_schema as schema

NAME = "rss"

# Each feed carries its own identity + legal handling. Add a source = add a row.
# Optional "region": tags docs with a province (general feeds rely on stage3 to
# drop the non-O&G items).
FEEDS = [
    {
        "url": "https://www.shale24.com/feed/",
        "source_name": "Shale24",
        "source_family": "medio",
        "legal_mode": "metadata_only",
    },
    {
        "url": "https://econojournal.com.ar/feed/",
        "source_name": "EconoJournal",
        "source_family": "medio",
        "legal_mode": "metadata_only",
    },
    {
        "url": "https://www.energiaonline.com.ar/feed/",
        "source_name": "Energía Online",
        "source_family": "medio",
        "legal_mode": "metadata_only",
    },
    {
        # General regional outlet — no O&G-specific feed exists; stage3 filters.
        "url": "https://www.rionegro.com.ar/feed/",
        "source_name": "Diario Río Negro",
        "source_family": "medio",
        "legal_mode": "metadata_only",
        "region": ["Río Negro"],
    },
]

SNIPPET_MAX = 300  # cap the stored excerpt; metadata-only, not full text

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def _clean(text: str | None) -> str | None:
    """Strip HTML tags + entities, collapse whitespace."""
    if not text:
        return None
    t = html.unescape(_TAG_RE.sub(" ", text))
    t = _WS_RE.sub(" ", t).strip()
    return t or None


def _entry_iso(entry) -> str | None:
    """feedparser gives published_parsed/updated_parsed as UTC struct_time."""
    st = entry.get("published_parsed") or entry.get("updated_parsed")
    if not st:
        return None
    return datetime.fromtimestamp(calendar.timegm(st), tz=timezone.utc).isoformat()


def fetch(state: dict, limit: int | None = None) -> tuple[list[dict], dict]:
    state = dict(state or {})
    raws: list[dict] = []

    for feed in FEEDS:
        url = feed["url"]
        last_seen = state.get(url)
        try:
            resp = httpx.get(url, timeout=40, follow_redirects=True,
                             headers={"User-Agent": "vacamuerta-news-ingest/0.1"})
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
        except Exception as exc:  # one bad feed must not sink the rest
            print(f"[rss] {feed['source_name']}: FAILED ({exc!r}); skipping")
            continue

        max_seen = last_seen
        kept = 0
        for entry in parsed.entries:
            link = entry.get("link")
            if not link:
                continue
            iso = _entry_iso(entry)
            if last_seen and iso and iso <= last_seen:
                continue
            raws.append({
                "source_url": link,
                "title": _clean(entry.get("title")) or "(sin título)",
                "snippet": _clean(entry.get("summary")),
                "published_iso": iso,
                "feed_url": url,
                "source_name": feed["source_name"],
                "source_family": feed["source_family"],
                "legal_mode": feed["legal_mode"],
                "region": feed.get("region", []),
            })
            kept += 1
            if iso and (not max_seen or iso > max_seen):
                max_seen = iso
            if limit and kept >= limit:
                break

        state[url] = max_seen
        print(f"[rss] {feed['source_name']}: {kept} new "
              f"(of {len(parsed.entries)} in feed)")

    return raws, state


def normalize(raw: dict) -> dict:
    deck = raw.get("snippet")
    if deck and len(deck) > SNIPPET_MAX:
        deck = deck[:SNIPPET_MAX].rstrip() + "…"
    return schema.make_doc(
        source_url=raw["source_url"],
        source_name=raw["source_name"],
        source_family=raw["source_family"],
        source_type="web",
        title=raw["title"],
        legal_mode=raw["legal_mode"],
        discovered_via=NAME,
        published_at=raw.get("published_iso"),
        deck=deck,          # short excerpt only; body_text stays null
        language="es",
        region=raw.get("region", []),
    )
