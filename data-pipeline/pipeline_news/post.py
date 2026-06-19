"""Ship the emitted Documents to the backend ingest endpoint.

The pipeline never touches Postgres. It POSTs NDJSON batches to a token-guarded
backend route; the backend upserts via Prisma (sole DB writer). This is the
entire pipeline↔backend seam on Coolify, where the two run as separate
containers with no shared filesystem.

Endpoint contract (backend implements):
    POST {url}            Authorization: Bearer {token}
    Content-Type: application/json
    body: {"documents": [Document, ...]}
    → 200 {"upserted": int, "skipped": int, "errors": [...]}  (idempotent, by doc_id)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx

BATCH = 200


def _batches(items: list, n: int):
    for i in range(0, len(items), n):
        yield items[i:i + n]


def post(ndjson_path: Path, url: str, token: str) -> int:
    docs = [json.loads(l) for l in ndjson_path.read_text().splitlines() if l.strip()]
    if not docs:
        print("[post] nothing to send")
        return 0

    sent = 0
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client(timeout=120) as client:
        for batch in _batches(docs, BATCH):
            resp = client.post(url, json={"documents": batch}, headers=headers)
            resp.raise_for_status()
            sent += len(batch)
            print(f"[post] {sent}/{len(docs)} → {resp.json()}")
    return sent


def main() -> int:
    ap = argparse.ArgumentParser(description="POST news documents to backend.")
    ap.add_argument("--file", required=True, type=Path)
    ap.add_argument("--url", required=True)
    ap.add_argument("--token", required=True)
    args = ap.parse_args()
    post(args.file, args.url, args.token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
