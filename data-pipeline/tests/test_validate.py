"""Stage 4 — verify each kind of bad record is routed to review with reasons."""

from __future__ import annotations

import copy
import json
from pathlib import Path

from pipeline.stage4_validate import validate, validate_record

FIXTURE = Path(__file__).resolve().parent.parent / "fixtures" / "projects_expected.json"


def _clean_template() -> dict:
    return copy.deepcopy(json.loads(FIXTURE.read_text())[0])  # Cerro Moro


def test_clean_record_passes() -> None:
    assert validate_record(_clean_template()) == []


def test_non_numeric_area_ha_flagged() -> None:
    rec = _clean_template()
    rec["area_ha"] = "lots of hectares"
    problems = validate_record(rec)
    assert any(p.startswith("area_ha_not_numeric") for p in problems)


def test_bad_year_flagged() -> None:
    rec = _clean_template()
    rec["resources_year"] = "twenty-twenty-five"
    rec["technical_economic"]["since_production"] = 1700  # outside 1900–2100
    problems = validate_record(rec)
    assert any(p.startswith("resources_year_implausible") for p in problems)
    assert any(p.startswith("since_production_implausible") for p in problems)


def test_missing_project_name_flagged() -> None:
    rec = _clean_template()
    rec["project_name"] = ""
    problems = validate_record(rec)
    assert any(p == "missing_required: project_name" for p in problems)


def test_non_numeric_resource_value_flagged() -> None:
    rec = _clean_template()
    rec["resources"][0]["values"]["Au_g_t"] = "4.87 g/t"
    problems = validate_record(rec)
    assert any("resources[0].values.Au_g_t_not_numeric" in p for p in problems)


def test_validate_splits_clean_vs_review(tmp_path: Path) -> None:
    clean = _clean_template()
    bad_area = _clean_template()
    bad_area["project_name"] = "BadArea"
    bad_area["area_ha"] = "twelve"
    bad_year = _clean_template()
    bad_year["project_name"] = "BadYear"
    bad_year["resources_year"] = "not-a-year"
    missing_name = _clean_template()
    missing_name["project_name"] = ""

    src = tmp_path / "extracted.json"
    src.write_text(json.dumps([clean, bad_area, bad_year, missing_name]))

    clean_path, review_path = validate(src, tmp_path)
    clean_out = json.loads(clean_path.read_text())
    review_out = json.loads(review_path.read_text())

    assert len(clean_out) == 1
    assert clean_out[0]["project_name"] == "Cerro Moro"
    assert len(review_out) == 3
    # Each bad record carries reasons.
    for r in review_out:
        assert r["_problems"]
