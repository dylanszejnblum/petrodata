"""Stage 3b — verify the deterministic parser produces gold-standard records.

The two markdown fixtures (`fixtures/sample_cerro_moro.md`,
`fixtures/sample_don_otto.md`) are hand-written approximations of what Mistral
OCR is expected to emit for the two PRD gold-standard fact sheets. They are a
test fixture, NOT a contract — when real OCR output diverges, the right move
is to update both the fixtures and the parser together, holding the expected
JSON records constant.
"""

from __future__ import annotations

from pathlib import Path

from pipeline.stage3b_parse import dms_to_decimal, normalize_col_header, parse_markdown

FIX = Path(__file__).resolve().parent.parent / "fixtures"


def _read(name: str) -> str:
    return (FIX / name).read_text(encoding="utf-8")


def test_parse_cerro_moro_matches_expected() -> None:
    rec = parse_markdown(_read("sample_cerro_moro.md"), source_pages=[1, 3, 6])

    assert rec["project_name"] == "Cerro Moro"
    assert rec["primary_commodity"] == "Gold"
    assert "Silver" in rec["by_products"]
    assert rec["status"] == "Operation"
    assert rec["deposit_type"] == "Low Sulphidation Epithermal Style (Au-Ag)"
    assert rec["owner_controller"] == "Pan American Silver Corp."
    assert rec["operator"] == "Estelar Resources Limited S.A"
    assert rec["area_ha"] == 304167

    loc = rec["location"]
    assert loc["province"] == "Santa Cruz"
    assert loc["country"] == "Argentina"
    assert loc["latitude_dms"].startswith("48°")
    assert loc["longitude_dms"].startswith("66°")
    assert "Puerto Deseado" in (loc["description"] or "")

    te = rec["technical_economic"]
    assert te["since_production"] == 2018
    assert te["estimated_lom_years"] == 3
    assert te["mining_method"] == "Open-Pit & Underground"
    assert te["product"] == "Gold and silver doré"
    assert "1,100" in (te["productive_capacity"] or "")

    by_cat = {r["category"]: r["values"] for r in rec["resources"]}
    assert by_cat["Measured"]["Au_g_t"] == 4.87
    assert by_cat["Measured"]["Ag_kOz"] == 2200
    assert by_cat["Indicated"]["Au_kOz"] == 135.1
    assert by_cat["Inferred"]["Ag_g_t"] == 164

    rsv = {r["category"]: r["values"] for r in rec["reserves"]}
    assert rsv["Proven"]["Au_g_t"] == 9.94
    assert rsv["Probable"]["Ag_kOz"] == 2900

    assert rec["resources_year"] == 2025
    assert rec["source_pages"] == [1, 3, 6]
    assert any("Pan American Silver" in s for s in rec["sources_consulted"])
    assert any("Yamana Gold" in s for s in rec["sources_consulted"])


def test_parse_don_otto_uranium_matches_expected() -> None:
    rec = parse_markdown(_read("sample_don_otto.md"), source_pages=[2, 4, 5])

    assert rec["project_name"] == "Don Otto"
    assert rec["primary_commodity"] == "Uranium"
    assert rec["by_products"] == []
    assert rec["status"] == "Feasibility"
    assert rec["area_ha"] == 7.5
    assert rec["location"]["province"] == "Salta"
    assert rec["location"]["latitude_dms"].startswith("25°")
    assert rec["technical_economic"]["estimated_lom_years"] == 8
    assert rec["technical_economic"]["estimated_annual_production"] == "30 Tn U"

    assert len(rec["resources"]) == 1
    total = rec["resources"][0]
    assert total["category"] == "Total"
    assert total["values"]["RAR_Tn"] == 180
    assert total["values"]["IR_Tn"] == 250
    assert total["values"]["pct_U"] == 0.1

    assert rec["reserves"] == []
    assert rec["source_pages"] == [2, 4, 5]


def test_column_header_normalizer() -> None:
    assert normalize_col_header("Au (g/t)") == "Au_g_t"
    assert normalize_col_header("Ag (kOz)") == "Ag_kOz"
    assert normalize_col_header("RAR (Tn)") == "RAR_Tn"
    assert normalize_col_header("% U") == "pct_U"
    assert normalize_col_header("U (%)") == "pct_U"
    assert normalize_col_header("Cu (%)") == "pct_Cu"
    assert normalize_col_header("Au g/t") == "Au_g_t"
    assert normalize_col_header("Category") == "Category"  # bare word — caller decides
    assert normalize_col_header("") is None


def test_dms_to_decimal_signs_and_precision() -> None:
    # 48° 01' 55" S → -(48 + 1/60 + 55/3600) ≈ -48.0319444…
    assert dms_to_decimal("48° 01' 55\" S") == round(-(48 + 1 / 60 + 55 / 3600), 6)
    # 66° 33' 45" W → -(66 + 33/60 + 45/3600) = -66.5625
    assert dms_to_decimal("66° 33' 45\" W") == -66.5625
    # Fractional seconds
    assert dms_to_decimal("25° 36' 39.60\" S") == round(-(25 + 36 / 60 + 39.6 / 3600), 6)
    # Northern / Eastern hemispheres should be positive.
    assert dms_to_decimal("12° 0' 0\" N") == 12.0
    assert dms_to_decimal("12° 0' 0\" E") == 12.0
    # Unparseable / None inputs → None.
    assert dms_to_decimal(None) is None
    assert dms_to_decimal("") is None
    assert dms_to_decimal("not a coord") is None


def test_parse_populates_decimal_coords() -> None:
    rec = parse_markdown(_read("sample_don_otto.md"))
    loc = rec["location"]
    # 25° 36' 39.60" S, 65° 55' 37.20" W
    assert loc["latitude"] is not None
    assert loc["longitude"] is not None
    assert -26 < loc["latitude"] < -25
    assert -66 < loc["longitude"] < -65


def test_commodity_inference_when_not_labeled() -> None:
    md = """\
# Some Project

| Category | Au (g/t) | Ag (g/t) |
|----------|----------|----------|
| Total    | 1.0      | 10.0     |
"""
    rec = parse_markdown(md)
    assert rec["primary_commodity"] == "Gold"
    assert rec["by_products"] == ["Silver"]
