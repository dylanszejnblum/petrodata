"""Stage 5 — emit: validate and write the backend-bound artifact.

Inputs:  <out>/clustered.ndjson
Outputs: <out>/normalized/news_documents.ndjson   ← the backend importer reads this
         <out>/emit_report.json                   — counts + any rejects

Validation is the schema contract gate: invalid docs are dropped and reported,
never shipped to the backend.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import news_schema as schema


def emit(out_dir: Path) -> Path:
    src = out_dir / "clustered.ndjson"
    norm_dir = out_dir / "normalized"
    norm_dir.mkdir(parents=True, exist_ok=True)
    dst = norm_dir / "news_documents.ndjson"

    emitted = 0
    rejects: list[dict] = []
    with src.open(encoding="utf-8") as fin, dst.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            doc = json.loads(line)
            errs = schema.validate_doc(doc)
            if errs:
                rejects.append({"doc_id": doc.get("doc_id"),
                                "source_url": doc.get("source_url"),
                                "errors": errs})
                continue
            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")
            emitted += 1

    report = {"emitted": emitted, "rejected": len(rejects), "rejects": rejects}
    (out_dir / "emit_report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False))
    print(f"[stage5] emitted {emitted}, rejected {len(rejects)} → {dst}")
    if rejects:
        print(f"[stage5] see {out_dir / 'emit_report.json'} for rejects")
    return dst


def main() -> int:
    ap = argparse.ArgumentParser(description="News emit (stage 5).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    emit(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
