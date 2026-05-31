"""End-to-end orchestrator: PDF(s) → projects.json + projects.csv.

Chains stages 1, 2, 3a, 3b, 4, 5. Each stage writes a checkpoint artifact in
--out so the run can be resumed by re-invoking with the same --out directory.

Stage 3 is split into:
  3a) OCR with Mistral (the billable step; per-page markdown is cached)
  3b) Deterministic markdown → schema parser (free; iterate without re-OCR)

Usage:
    uv run run.py --pdf report.pdf --out out/
    uv run run.py --pdf report.pdf --out out/ --limit 2
    uv run run.py --pdf reports_dir/ --out out/ --strategy fixed --pages-per-project 3
    uv run run.py --pdf report.pdf --out out/ --skip-ocr   # re-run parser only
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pipeline import (
    stage1_split,
    stage2_group,
    stage3a_ocr,
    stage3b_parse,
    stage4_validate,
    stage5_flatten,
)


def main() -> int:
    ap = argparse.ArgumentParser(description="Mining fact-sheet extraction pipeline.")
    ap.add_argument("--pdf", nargs="+", required=True, type=Path, help="PDF file(s) or directory")
    ap.add_argument("--out", required=True, type=Path, help="Output directory")
    ap.add_argument("--dpi", type=int, default=220)
    ap.add_argument("--strategy", choices=["title", "fixed", "ocr-titles"], default="title")
    ap.add_argument("--pages-per-project", type=int, default=None)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=None, help="process only the first N projects")
    ap.add_argument("--long", action="store_true", help="also emit projects_long.csv")
    ap.add_argument("--skip-ocr", action="store_true", help="skip stage 3a (use existing OCR markdown)")
    ap.add_argument("--reparse-only", action="store_true", help="run stage 3b → 5 only")
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)

    if not args.reparse_only:
        manifest_path = args.out / "pages_manifest.json"
        if manifest_path.exists():
            print(f"[run] pages_manifest.json exists; skipping stage 1")
        else:
            stage1_split.split(args.pdf, args.out, dpi=args.dpi)

        groups_path = args.out / "page_groups.json"
        if groups_path.exists():
            print(f"[run] page_groups.json exists; skipping stage 2")
        else:
            stage2_group.group(
                manifest_path,
                args.out,
                strategy=args.strategy,
                pages_per_project=args.pages_per_project,
            )

        ocr_manifest = args.out / "ocr_manifest.json"
        if args.skip_ocr:
            if not ocr_manifest.exists():
                print("[run] --skip-ocr set but ocr_manifest.json is missing", file=sys.stderr)
                return 1
            print("[run] --skip-ocr set; using existing OCR markdown")
        else:
            stage3a_ocr.ocr(groups_path, args.out, workers=args.workers, limit=args.limit)

    ocr_manifest = args.out / "ocr_manifest.json"
    if not ocr_manifest.exists():
        print(f"[run] ocr_manifest.json not found in {args.out}", file=sys.stderr)
        return 1

    stage3b_parse.parse(ocr_manifest, args.out)
    stage4_validate.validate(args.out / "extracted.json", args.out)
    stage5_flatten.flatten(args.out / "projects.json", args.out, long=args.long)

    print(f"[run] done → {args.out}/projects.json, {args.out}/projects.csv")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
