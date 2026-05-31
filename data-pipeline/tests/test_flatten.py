"""Stage 5 — verify the wide CSV has union columns and fills the right cells."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from pipeline.stage5_flatten import flatten

FIXTURE = Path(__file__).resolve().parent.parent / "fixtures" / "projects_expected.json"


def _read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as fp:
        reader = csv.DictReader(fp)
        rows = list(reader)
        return reader.fieldnames or [], rows


def test_flatten_union_columns(tmp_path: Path) -> None:
    # Stage 4 normally writes projects.json; we feed the fixture directly.
    src = tmp_path / "projects.json"
    src.write_text(FIXTURE.read_text())

    flatten(src, tmp_path)
    cols, rows = _read_csv(tmp_path / "projects.csv")

    assert len(rows) == 2

    by_name = {r["project_name"]: r for r in rows}
    assert set(by_name) == {"Cerro Moro", "Don Otto"}

    # Union of columns: both gold and uranium columns must exist.
    assert "res_Measured_Au_g_t" in cols
    assert "res_Total_RAR_Tn" in cols

    cerro = by_name["Cerro Moro"]
    don = by_name["Don Otto"]

    # Cerro Moro fills gold cells, leaves uranium cells blank.
    assert float(cerro["res_Measured_Au_g_t"]) == 4.87
    assert cerro["res_Total_RAR_Tn"] == ""

    # Don Otto fills uranium cells, leaves gold cells blank.
    assert float(don["res_Total_RAR_Tn"]) == 180
    assert don["res_Measured_Au_g_t"] == ""

    # Nested objects flattened with dotted names.
    assert cerro["location.province"] == "Santa Cruz"
    assert cerro["technical_economic.mining_method"] == "Open-Pit & Underground"

    # List fields pipe-joined.
    assert "Pan American Silver" in cerro["sources_consulted"]
    assert " | " in cerro["sources_consulted"]
    assert cerro["source_pages"] == "1 | 3 | 6"


def test_flatten_long_mode(tmp_path: Path) -> None:
    src = tmp_path / "projects.json"
    src.write_text(FIXTURE.read_text())
    flatten(src, tmp_path, long=True)
    long_path = tmp_path / "projects_long.csv"
    assert long_path.exists()
    _, rows = _read_csv(long_path)
    # Cerro Moro: 3 resource cats × 4 metrics + 2 reserve cats × 4 = 20.
    # Don Otto: 1 resource × 3 metrics + 0 reserves = 3.
    assert len(rows) == 20 + 3
    don_rows = [r for r in rows if r["project_name"] == "Don Otto"]
    assert all(r["bucket"] in ("resources", "reserves") for r in don_rows)
