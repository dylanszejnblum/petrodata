"""Stage 1 — fetch: run connectors, persist raw items, advance watermarks.

Inputs:
    --out       output dir
    --source    connector name(s) to run; default = all registered
    --limit     cap raw items per connector (dev)

Outputs:
    <out>/raw/<source>/<doc_id>.json   — one raw record per item
    <out>/raw_manifest.json            — [{source, doc_id, raw_path, source_url}]
    <out>/state.json                   — per-connector watermark (incremental)

Designed to run every cron tick: watermarks in state.json keep each fetch to
only-new items, so re-running is cheap and idempotent.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import news_schema as schema
from pipeline_news.connectors import CONNECTORS


def _load_json(path: Path, default):
    return json.loads(path.read_text()) if path.exists() else default


def fetch(out_dir: Path, sources: list[str] | None = None,
          limit: int | None = None) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    raw_root = out_dir / "raw"
    raw_root.mkdir(exist_ok=True)

    state = _load_json(out_dir / "state.json", {})
    names = sources or list(CONNECTORS)
    manifest: list[dict] = []

    for name in names:
        conn = CONNECTORS.get(name)
        if conn is None:
            print(f"[stage1] unknown source '{name}', skipping")
            continue
        print(f"[stage1] {name}: fetching…")
        try:
            raws, new_state = conn.fetch(state.get(name, {}), limit)
        except Exception as exc:  # one flaky source must not abort the cron
            print(f"[stage1] {name}: FETCH FAILED ({exc!r}); "
                  f"keeping prior watermark, continuing")
            continue
        state[name] = new_state

        src_dir = raw_root / name
        src_dir.mkdir(exist_ok=True)
        for raw in raws:
            doc_id = schema.doc_id_for(raw["source_url"])
            raw_path = src_dir / f"{doc_id}.json"
            raw_path.write_text(json.dumps(raw, indent=2, ensure_ascii=False))
            manifest.append({
                "source": name,
                "doc_id": doc_id,
                "raw_path": str(raw_path.relative_to(out_dir)),
                "source_url": raw["source_url"],
            })
        print(f"[stage1] {name}: {len(raws)} new item(s); "
              f"watermark={new_state}")
        for raw in raws[:5]:  # sample so the log shows we got real, relevant data
            title = (raw.get("title") or "").strip()[:80]
            print(f"[stage1]   • {raw.get('source_url', '')[:60]}  «{title}»")
        if len(raws) > 5:
            print(f"[stage1]   … +{len(raws) - 5} more")

    (out_dir / "raw_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False))
    (out_dir / "state.json").write_text(
        json.dumps(state, indent=2, ensure_ascii=False))
    print(f"[stage1] {len(manifest)} item(s) across {len(names)} source(s)")
    return out_dir / "raw_manifest.json"


def main() -> int:
    ap = argparse.ArgumentParser(description="News fetch (stage 1).")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--source", action="append", default=None)
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()
    fetch(args.out, args.source, args.limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
