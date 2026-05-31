"""Stage 5 — flatten: emit CSV from projects.json.

Default (wide): one row per project; union of columns across all projects.
  - Scalars at top-level become columns of the same name.
  - location.* and technical_economic.* become dotted-column names.
  - Resource rows become wide columns: res_<Category>_<key>.
  - Reserve rows become wide columns: rsv_<Category>_<key>.
  - List fields (by_products, sources_consulted, source_pages) are
    pipe-joined into a single cell.

`--long` adds a second CSV, projects_long.csv, with one row per
(project, bucket, category, metric, value) — better for pivot tables.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from schema import LIST_FIELDS_JOINED, LIST_JOIN_SEP, NESTED_OBJECTS, SCALAR_TOP_LEVEL


def _join_list(v) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return LIST_JOIN_SEP.join(str(x) for x in v)
    return str(v)


def _project_to_wide_row(rec: dict) -> dict[str, object]:
    row: dict[str, object] = {}

    for f in SCALAR_TOP_LEVEL:
        row[f] = rec.get(f)

    for f in LIST_FIELDS_JOINED:
        row[f] = _join_list(rec.get(f))

    for parent in NESTED_OBJECTS:
        nested = rec.get(parent) or {}
        if not isinstance(nested, dict):
            continue
        for k, v in nested.items():
            row[f"{parent}.{k}"] = v

    for bucket, prefix in (("resources", "res"), ("reserves", "rsv")):
        rows = rec.get(bucket) or []
        if not isinstance(rows, list):
            continue
        for item in rows:
            if not isinstance(item, dict):
                continue
            cat = item.get("category") or "Unknown"
            values = item.get("values") or {}
            if not isinstance(values, dict):
                continue
            for k, v in values.items():
                row[f"{prefix}_{cat}_{k}"] = v

    return row


def flatten_wide(records: list[dict], out_path: Path) -> Path:
    rows = [_project_to_wide_row(r) for r in records]

    fixed_cols: list[str] = []
    fixed_cols.extend(SCALAR_TOP_LEVEL)
    for parent in NESTED_OBJECTS:
        # Preserve schema-driven order for nested fields by collecting only
        # the keys seen, but in insertion order across all rows.
        seen_keys: list[str] = []
        for r in rows:
            for k in r:
                if k.startswith(f"{parent}.") and k not in seen_keys:
                    seen_keys.append(k)
        fixed_cols.extend(seen_keys)
    fixed_cols.extend(LIST_FIELDS_JOINED)

    res_cols: list[str] = []
    rsv_cols: list[str] = []
    for r in rows:
        for k in r:
            if k.startswith("res_") and k not in res_cols:
                res_cols.append(k)
            elif k.startswith("rsv_") and k not in rsv_cols:
                rsv_cols.append(k)

    columns = fixed_cols + sorted(res_cols) + sorted(rsv_cols)

    with out_path.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            writer.writerow({c: ("" if r.get(c) is None else r.get(c)) for c in columns})

    print(f"[stage5] wrote {len(rows)} row(s) × {len(columns)} col(s) → {out_path.name}")
    return out_path


def flatten_long(records: list[dict], out_path: Path) -> Path:
    long_rows: list[dict] = []
    for rec in records:
        name = rec.get("project_name")
        commodity = rec.get("primary_commodity")
        for bucket in ("resources", "reserves"):
            items = rec.get(bucket) or []
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                cat = item.get("category")
                values = item.get("values") or {}
                if not isinstance(values, dict):
                    continue
                for metric, value in values.items():
                    long_rows.append(
                        {
                            "project_name": name,
                            "primary_commodity": commodity,
                            "bucket": bucket,
                            "category": cat,
                            "metric": metric,
                            "value": value,
                        }
                    )

    cols = ["project_name", "primary_commodity", "bucket", "category", "metric", "value"]
    with out_path.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=cols)
        writer.writeheader()
        writer.writerows(long_rows)
    print(f"[stage5] wrote {len(long_rows)} long row(s) → {out_path.name}")
    return out_path


def flatten(in_path: Path, out_dir: Path, long: bool = False) -> Path:
    records: list[dict] = json.loads(in_path.read_text())
    wide_path = flatten_wide(records, out_dir / "projects.csv")
    if long:
        flatten_long(records, out_dir / "projects_long.csv")
    return wide_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 5: flatten projects.json to CSV.")
    ap.add_argument("--in", dest="inp", type=Path, help="projects.json (defaults to <out>/projects.json)")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--long", action="store_true", help="also emit projects_long.csv")
    args = ap.parse_args()
    in_path = args.inp or (args.out / "projects.json")
    if not in_path.exists():
        raise SystemExit(f"Input not found: {in_path}. Run stage4 first.")
    flatten(in_path, args.out, long=args.long)


if __name__ == "__main__":
    main()
