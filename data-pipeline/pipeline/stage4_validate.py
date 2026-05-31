"""Stage 4 — validate: split extracted records into clean vs. review.

Checks:
  - Required fields present and non-empty: project_name, primary_commodity.
  - area_ha numeric if present.
  - Every value inside resources[].values / reserves[].values numeric.
  - since_production and resources_year are plausible 4-digit years (1900–2100)
    if present.
  - latitude_dms / longitude_dms match a DMS-ish shape if present.
  - Any record carrying an `_error` (from stage 3) is auto-routed to review.

Outputs:
  - projects.json       — clean records (no validation problems)
  - review_queue.json   — failed records, each with a `_problems` list

Pure function of input; runs offline.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from schema import REQUIRED_FIELDS

_DMS_RE = re.compile(
    r"""^\s*\d+\s*°\s*\d+\s*['’]\s*\d+(?:\.\d+)?\s*["”]\s*[NSEW]\s*$""",
    re.VERBOSE,
)


def _is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _plausible_year(y: Any) -> bool:
    return isinstance(y, int) and not isinstance(y, bool) and 1900 <= y <= 2100


def validate_record(rec: dict) -> list[str]:
    """Return a list of problem strings; empty list means clean."""
    problems: list[str] = []

    if rec.get("_error"):
        problems.append(f"stage3_error: {rec['_error']}")

    for f in REQUIRED_FIELDS:
        v = rec.get(f)
        if not v or not isinstance(v, str) or not v.strip():
            problems.append(f"missing_required: {f}")

    area = rec.get("area_ha")
    if area is not None and not _is_number(area):
        problems.append(f"area_ha_not_numeric: {area!r}")

    te = rec.get("technical_economic") or {}
    sp = te.get("since_production")
    if sp is not None and not _plausible_year(sp):
        problems.append(f"since_production_implausible: {sp!r}")

    ry = rec.get("resources_year")
    if ry is not None and not _plausible_year(ry):
        problems.append(f"resources_year_implausible: {ry!r}")

    for bucket in ("resources", "reserves"):
        rows = rec.get(bucket) or []
        if not isinstance(rows, list):
            problems.append(f"{bucket}_not_a_list")
            continue
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                problems.append(f"{bucket}[{i}]_not_object")
                continue
            cat = row.get("category")
            if not cat or not isinstance(cat, str):
                problems.append(f"{bucket}[{i}]_missing_category")
            values = row.get("values")
            if values is None:
                continue
            if not isinstance(values, dict):
                problems.append(f"{bucket}[{i}].values_not_object")
                continue
            for k, v in values.items():
                if not _is_number(v):
                    problems.append(f"{bucket}[{i}].values.{k}_not_numeric: {v!r}")

    loc = rec.get("location") or {}
    for coord_key in ("latitude_dms", "longitude_dms"):
        c = loc.get(coord_key)
        if c and not _DMS_RE.match(c):
            problems.append(f"{coord_key}_pattern: {c!r}")

    # Sparse records: a real project page produces at least a few populated
    # fields. If only name + commodity are set (everything else null/empty),
    # it's almost certainly a TOC, cover, or boilerplate page misclassified
    # as a project — route it to review for a human glance.
    te = rec.get("technical_economic") or {}
    substantive_scalars = [
        rec.get("area_ha"),
        rec.get("deposit_type"),
        rec.get("status"),
        rec.get("owner_controller"),
        rec.get("operator"),
        loc.get("description"),
        loc.get("latitude_dms"),
        te.get("mining_method"),
        te.get("product"),
        te.get("productive_capacity"),
        te.get("estimated_annual_production"),
        te.get("estimated_lom_years"),
    ]
    substantive_count = sum(1 for v in substantive_scalars if v)
    list_count = (
        len(rec.get("resources") or [])
        + len(rec.get("reserves") or [])
        + len(rec.get("sources_consulted") or [])
        + len(rec.get("by_products") or [])
    )
    if substantive_count == 0 and list_count == 0:
        problems.append("sparse_record: only name+commodity populated")

    return problems


def validate(extracted_path: Path, out_dir: Path) -> tuple[Path, Path]:
    records: list[dict] = json.loads(extracted_path.read_text())

    clean: list[dict] = []
    review: list[dict] = []

    for rec in records:
        problems = validate_record(rec)
        if problems:
            tagged = dict(rec)
            tagged["_problems"] = problems
            review.append(tagged)
        else:
            clean.append(rec)

    clean_path = out_dir / "projects.json"
    review_path = out_dir / "review_queue.json"
    clean_path.write_text(json.dumps(clean, ensure_ascii=False, indent=2))
    review_path.write_text(json.dumps(review, ensure_ascii=False, indent=2))

    total = len(records)
    pass_rate = (len(clean) / total * 100) if total else 0.0
    print(
        f"[stage4] {len(clean)}/{total} clean ({pass_rate:.1f}%), "
        f"{len(review)} for review → {clean_path.name}, {review_path.name}"
    )
    return clean_path, review_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 4: validate extracted records.")
    ap.add_argument("--in", dest="inp", type=Path, help="extracted.json (defaults to <out>/extracted.json)")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    extracted_path = args.inp or (args.out / "extracted.json")
    if not extracted_path.exists():
        raise SystemExit(f"Input not found: {extracted_path}. Run stage3 first.")
    validate(extracted_path, args.out)


if __name__ == "__main__":
    main()
