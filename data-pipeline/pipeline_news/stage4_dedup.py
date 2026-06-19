"""Stage 4 — dedup & cluster.

Inputs:  <out>/enriched.ndjson
Outputs: <out>/clustered.ndjson

Implemented now: exact dedup by doc_id (canonical-URL identity) within a run.
Each surviving doc gets a cluster_id (its own id for now).

TODO (the doc's full design):
  - SimHash/MinHash over title+lead to fold near-duplicate headlines
  - semantic clustering over embeddings to unite "same hecho" across sources
  - elect a master story per cluster
Cross-run "same event" clustering belongs in the backend, which holds history;
here we only collapse duplicates seen in this batch.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def dedup(out_dir: Path) -> Path:
    src = out_dir / "enriched.ndjson"
    dst = out_dir / "clustered.ndjson"

    seen: set[str] = set()
    kept = 0
    dropped = 0
    with src.open(encoding="utf-8") as fin, dst.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            doc = json.loads(line)
            did = doc["doc_id"]
            if did in seen:
                dropped += 1
                continue
            seen.add(did)
            doc["cluster_id"] = doc.get("cluster_id") or did
            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")
            kept += 1

    print(f"[stage4] kept {kept}, dropped {dropped} exact dup(s) → {dst.name}")
    return dst


def main() -> int:
    ap = argparse.ArgumentParser(description="News dedup (stage 4).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    dedup(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
