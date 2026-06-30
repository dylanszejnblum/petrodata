"""Editable source registry for the RSS connector.

The curated feed list used to be a hardcoded constant in connectors/rss.py.
It now lives in a JSON overlay on the pipeline volume so the backoffice can
add/edit/disable feeds without a code deploy. The file is seeded from
DEFAULT_FEEDS on first read and is the single source of truth thereafter.

Both the connector (writer of news) and the dashboard (editor) find the file
via NEWS_OUT_DIR — the same env both processes already share in the container.

Each feed row:
    url           feed URL (RSS/Atom)
    source_name   display name, e.g. "Shale24"
    source_family one of news_schema.SOURCE_FAMILIES
    legal_mode    one of news_schema.LEGAL_MODES
    region        list[str] province tags (optional)
    enabled       bool — disabled feeds are skipped by the connector
    status        "active" | "coming_soon" — coming_soon feeds are not fetched
"""

from __future__ import annotations

import json
import os
from pathlib import Path

DEFAULT_FEEDS: list[dict] = [
    {"url": "https://www.shale24.com/feed/", "source_name": "Shale24",
     "source_family": "medio", "legal_mode": "fulltext_internal",
     "region": [], "enabled": True, "status": "active"},
    {"url": "https://econojournal.com.ar/feed/", "source_name": "EconoJournal",
     "source_family": "medio", "legal_mode": "fulltext_internal",
     "region": [], "enabled": True, "status": "active"},
    {"url": "https://www.energiaonline.com.ar/feed/", "source_name": "Energía Online",
     "source_family": "medio", "legal_mode": "fulltext_internal",
     "region": [], "enabled": True, "status": "active"},
    {"url": "https://www.rionegro.com.ar/feed/", "source_name": "Diario Río Negro",
     "source_family": "medio", "legal_mode": "metadata_only",
     "region": ["Río Negro"], "enabled": True, "status": "active"},
]


def _out_dir(out_dir: Path | None = None) -> Path:
    return out_dir or Path(os.environ.get("NEWS_OUT_DIR", "out_news"))


def path(out_dir: Path | None = None) -> Path:
    return _out_dir(out_dir) / "sources.json"


def all_feeds(out_dir: Path | None = None) -> list[dict]:
    """Full feed list as the dashboard edits it (incl. disabled/coming_soon)."""
    p = path(out_dir)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return [dict(f) for f in DEFAULT_FEEDS]


def active_feeds(out_dir: Path | None = None) -> list[dict]:
    """What the connector actually fetches: enabled + active only."""
    return [f for f in all_feeds(out_dir)
            if f.get("enabled", True) and f.get("status", "active") == "active"]


def save(feeds: list[dict], out_dir: Path | None = None) -> None:
    p = path(out_dir)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(feeds, indent=2, ensure_ascii=False), encoding="utf-8")
