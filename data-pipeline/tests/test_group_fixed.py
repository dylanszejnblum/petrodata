"""Stage 2 (fixed strategy) — verify 6 pages with pages-per-project=3 yields 2 groups."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.stage2_group import group, group_fixed, normalize_title


def _manifest_of(n: int) -> list[dict]:
    return [
        {
            "page": i,
            "image_path": f"pages/report/page_{i:04d}.png",
            "source_pdf": "report.pdf",
            "page_in_source": i,
        }
        for i in range(1, n + 1)
    ]


def test_group_fixed_six_pages_three_per_project() -> None:
    groups = group_fixed(_manifest_of(6), pages_per_project=3)
    assert len(groups) == 2
    assert [len(g["pages"]) for g in groups] == [3, 3]
    assert groups[0]["page_numbers"] == [1, 2, 3]
    assert groups[1]["page_numbers"] == [4, 5, 6]


def test_group_fixed_remainder_in_final_group() -> None:
    groups = group_fixed(_manifest_of(7), pages_per_project=3)
    assert [len(g["pages"]) for g in groups] == [3, 3, 1]


def test_group_fixed_via_cli_entrypoint(tmp_path: Path) -> None:
    manifest_path = tmp_path / "pages_manifest.json"
    manifest_path.write_text(json.dumps(_manifest_of(6)))
    out_path = group(manifest_path, tmp_path, strategy="fixed", pages_per_project=3)
    groups = json.loads(out_path.read_text())
    assert len(groups) == 2


def test_normalize_title_strips_numbering() -> None:
    assert normalize_title("1 | Don Otto") == "don otto"
    assert normalize_title("  12 | Cerro Moro  ") == "cerro moro"
    assert normalize_title("Cerro Moro") == "cerro moro"
    assert normalize_title("") == ""
