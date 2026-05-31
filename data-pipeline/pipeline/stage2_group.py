"""Stage 2 — group: cluster page images into project fact sheets.

Two strategies, selectable by --strategy:

  * title (default): read the title from each page (OCR on the top strip).
    Start a new group when the normalized title changes. Pages with no
    detectable title attach to the current group.

  * fixed: simple page-range grouping, --pages-per-project N pages per group.

The output `page_groups.json` is a list of {project_name, pages: [image_path]}
entries (a list, not a dict, so order is preserved and duplicate names are
allowed downstream).
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

# OCR imports are deferred so the offline 'fixed' strategy doesn't require
# pytesseract/Pillow to be installed.


_NUM_PREFIX = re.compile(r"^\s*\d+\s*[|\-–:]\s*")


def normalize_title(raw: str) -> str:
    """Strip leading 'N |' numbering, collapse whitespace, lower-case."""
    if not raw:
        return ""
    s = _NUM_PREFIX.sub("", raw.strip())
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()


def group_fixed(manifest: list[dict], pages_per_project: int) -> list[dict]:
    """Split the manifest into fixed-size groups, naming each by global page range."""
    if pages_per_project <= 0:
        raise ValueError("pages-per-project must be >= 1")
    groups: list[dict] = []
    for i in range(0, len(manifest), pages_per_project):
        chunk = manifest[i : i + pages_per_project]
        first = chunk[0]["page"]
        last = chunk[-1]["page"]
        groups.append(
            {
                "project_name": f"project_p{first:04d}_p{last:04d}",
                "pages": [c["image_path"] for c in chunk],
                "page_numbers": [c["page"] for c in chunk],
            }
        )
    return groups


def _read_title_ocr(image_path: Path, top_fraction: float = 0.2) -> str:
    """OCR the top strip of an image and return its first non-empty line."""
    try:
        from PIL import Image  # type: ignore
        import pytesseract  # type: ignore
    except ImportError as e:
        raise SystemExit(
            "OCR-based title grouping requires the 'ocr' extra. "
            "Install with: uv sync --extra ocr (and ensure tesseract is on PATH)."
        ) from e

    with Image.open(image_path) as im:
        w, h = im.size
        strip = im.crop((0, 0, w, int(h * top_fraction)))
        text = pytesseract.image_to_string(strip)
    for line in text.splitlines():
        line = line.strip()
        if line:
            return line
    return ""


def group_by_title(manifest: list[dict], out_dir: Path) -> list[dict]:
    """Detect the prominent title on each page and start a new group on change."""
    groups: list[dict] = []
    current: dict | None = None

    for entry in manifest:
        img_path = out_dir / entry["image_path"]
        raw_title = _read_title_ocr(img_path)
        norm = normalize_title(raw_title)

        if not norm and current is not None:
            current["pages"].append(entry["image_path"])
            current["page_numbers"].append(entry["page"])
            continue

        if current is None or norm != current["_norm"]:
            current = {
                "project_name": raw_title.strip() or f"page_{entry['page']:04d}",
                "_norm": norm,
                "pages": [entry["image_path"]],
                "page_numbers": [entry["page"]],
            }
            groups.append(current)
        else:
            current["pages"].append(entry["image_path"])
            current["page_numbers"].append(entry["page"])

    for g in groups:
        g.pop("_norm", None)
    return groups


def group_by_ocr_titles(manifest: list[dict], out_dir: Path) -> list[dict]:
    """Group pages by detecting project-name H1s in cached Mistral OCR markdown.

    Reads per-page markdown from `out/ocr/_pages/<sha>.md` (populated by a
    prior stage 3a run on any earlier grouping). A new group starts on each
    page whose markdown contains a project-name H1 that survives the same
    filter the parser uses (length ≥ 3 chars, not a section/disclaimer
    heading). Pages with no project H1 attach to the current group.

    Requires stage 3a to have been run at least once on this directory so
    the per-page cache exists.
    """
    cache_dir = out_dir / "ocr" / "_pages"
    if not cache_dir.exists():
        raise SystemExit(
            f"OCR cache not found at {cache_dir}. Run stage 3a first with "
            "any grouping (e.g. fixed --pages-per-project 3) to populate "
            "the per-page cache, then re-run stage 2 with --strategy ocr-titles."
        )

    # Use the same hash function stage 3a used so cache lookups succeed.
    from pipeline.stage3a_ocr import _page_hash
    from pipeline.stage3b_parse import _extract_project_name

    groups: list[dict] = []
    current: dict | None = None

    for entry in manifest:
        img_path = out_dir / entry["image_path"]
        digest = _page_hash(img_path)
        md_path = cache_dir / f"{digest}.md"
        md = md_path.read_text(encoding="utf-8") if md_path.exists() else ""
        name = _extract_project_name(md, fallback=None) if md else None

        if name and (current is None or name != current["project_name"]):
            current = {
                "project_name": name,
                "pages": [entry["image_path"]],
                "page_numbers": [entry["page"]],
            }
            groups.append(current)
            continue

        if current is None:
            # No project H1 has been seen yet — gather these pages into a
            # 'preamble' bucket (cover, TOC, etc.); the validator will route
            # it to review.
            current = {
                "project_name": "preamble",
                "pages": [entry["image_path"]],
                "page_numbers": [entry["page"]],
            }
            groups.append(current)
        else:
            current["pages"].append(entry["image_path"])
            current["page_numbers"].append(entry["page"])

    return groups


def group(
    manifest_path: Path,
    out_dir: Path,
    strategy: str,
    pages_per_project: int | None = None,
) -> Path:
    manifest = json.loads(manifest_path.read_text())
    if strategy == "fixed":
        if not pages_per_project:
            raise SystemExit("--pages-per-project is required with --strategy fixed")
        groups = group_fixed(manifest, pages_per_project)
    elif strategy == "title":
        groups = group_by_title(manifest, out_dir)
    elif strategy == "ocr-titles":
        groups = group_by_ocr_titles(manifest, out_dir)
    else:
        raise SystemExit(f"Unknown grouping strategy: {strategy}")

    out_path = out_dir / "page_groups.json"
    out_path.write_text(json.dumps(groups, indent=2))
    print(
        f"[stage2] grouped {len(manifest)} pages into {len(groups)} project(s) "
        f"using strategy={strategy} → {out_path.name}"
    )
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 2: group pages into projects.")
    ap.add_argument("--manifest", type=Path, help="pages_manifest.json (defaults to <out>/pages_manifest.json)")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--strategy", choices=["title", "fixed", "ocr-titles"], default="title")
    ap.add_argument("--pages-per-project", type=int, default=None)
    args = ap.parse_args()

    manifest_path = args.manifest or (args.out / "pages_manifest.json")
    if not manifest_path.exists():
        raise SystemExit(f"Manifest not found: {manifest_path}. Run stage1 first.")
    group(manifest_path, args.out, args.strategy, args.pages_per_project)


if __name__ == "__main__":
    main()
