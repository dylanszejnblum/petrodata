"""End-to-end news ingest: sources → news_documents.ndjson → backend.

Chains stages 1→5, then optionally POSTs the result to the backend ingest
endpoint. Built to run on a recurring cron tick: connector watermarks
(state.json) keep each fetch incremental, so re-running is cheap.

Usage:
    # local dev: fetch a few, run the whole chain, inspect the artifact
    uv run run_news.py --out out_news/ --limit 10

    # one source only
    uv run run_news.py --out out_news/ --source gdelt

    # re-run 2→5 on already-fetched raw (no network)
    uv run run_news.py --out out_news/ --no-fetch

    # production cron: full chain + ship to backend
    uv run run_news.py --out out_news/ \
        --post-to "$BACKEND_INGEST_URL" --token "$NEWS_INGEST_TOKEN"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pipeline_news import (
    stage1_fetch,
    stage2_normalize,
    stage3_enrich,
    stage4_dedup,
    stage5_emit,
    post as post_mod,
)


def main() -> int:
    ap = argparse.ArgumentParser(description="News ingest pipeline.")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--source", action="append", default=None,
                    help="connector name(s); default = all")
    ap.add_argument("--limit", type=int, default=None,
                    help="cap raw items per connector (dev)")
    ap.add_argument("--no-fetch", action="store_true",
                    help="skip stage 1; re-run 2→5 on existing raw")
    ap.add_argument("--post-to", default=None,
                    help="backend ingest URL; if set, POST the result")
    ap.add_argument("--token", default=None, help="bearer token for --post-to")
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)

    if not args.no_fetch:
        stage1_fetch.fetch(args.out, args.source, args.limit)
    stage2_normalize.normalize(args.out)
    stage3_enrich.enrich(args.out)
    stage4_dedup.dedup(args.out)
    artifact = stage5_emit.emit(args.out)

    if args.post_to:
        if not args.token:
            print("[run_news] --post-to requires --token", file=sys.stderr)
            return 2
        post_mod.post(artifact, args.post_to, args.token)

    print("[run_news] done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
