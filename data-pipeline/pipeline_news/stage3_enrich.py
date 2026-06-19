"""Stage 3 — enrich: NER, topic tagging, quantitative features. (STUB)

Inputs:  <out>/normalized.ndjson
Outputs: <out>/enriched.ndjson

Currently a pass-through so the skeleton runs end-to-end. This is the only
billable/network-heavy stage when implemented; it must cache by doc_id so a
cron tick never re-enriches an unchanged document.

TODO:
  - entities.{companies,people,projects,blocks,regulators} via spaCy + rules
  - topics from an editorial taxonomy (midstream, GNL, RIGI, M&A, ambiente…)
  - numbers.{oil_bpd,gas_mmm3d,capex_usd,fracture_stages} via regex/units
  - embeddings → feed stage4 semantic clustering
  - importance_score
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def enrich(out_dir: Path) -> Path:
    src = out_dir / "normalized.ndjson"
    dst = out_dir / "enriched.ndjson"
    shutil.copyfile(src, dst)
    print(f"[stage3] (stub) pass-through → {dst.name}")
    return dst


def main() -> int:
    ap = argparse.ArgumentParser(description="News enrich (stage 3, stub).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    enrich(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
