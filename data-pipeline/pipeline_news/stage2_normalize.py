"""Stage 2 — normalize: raw records → Document schema (NDJSON).

Inputs:
    <out>/raw_manifest.json
    <out>/raw/<source>/<doc_id>.json

Outputs:
    <out>/normalized.ndjson   — one Document per line

Pure, deterministic, free. Each raw item is handed to its connector's
normalize(); iterate connectors without re-fetching.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline_news.connectors import CONNECTORS


def normalize(out_dir: Path) -> Path:
    manifest = json.loads((out_dir / "raw_manifest.json").read_text())
    out_path = out_dir / "normalized.ndjson"

    n = 0
    with out_path.open("w", encoding="utf-8") as fh:
        for entry in manifest:
            conn = CONNECTORS.get(entry["source"])
            if conn is None:
                continue
            raw = json.loads((out_dir / entry["raw_path"]).read_text())
            doc = conn.normalize(raw)
            fh.write(json.dumps(doc, ensure_ascii=False) + "\n")
            n += 1

    print(f"[stage2] normalized {n} document(s) → {out_path.name}")
    return out_path


def main() -> int:
    ap = argparse.ArgumentParser(description="News normalize (stage 2).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    normalize(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
