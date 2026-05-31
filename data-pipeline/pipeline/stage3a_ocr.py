"""Stage 3a — OCR each page group with Mistral's OCR API into markdown.

Reads page_groups.json. For each project group, OCRs every page in the group
(in parallel, then concatenated) and writes:
  - out/ocr/<idx>_<safename>.md   — combined markdown per project
  - out/ocr/_pages/<sha>.md       — per-page cache (so retries don't re-bill)
  - out/ocr_manifest.json         — {group_idx, project_name, page_numbers, md_path}

Stage 3b reads the manifest and parses the markdown deterministically.

The Mistral SDK call uses model 'mistral-ocr-latest' on a data:image/png;base64
document_url. Responses come back with `.pages[*].markdown`; we concatenate
across pages and store the result.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

DEFAULT_MODEL = os.environ.get("MISTRAL_OCR_MODEL", "mistral-ocr-latest")

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def _safename(s: str) -> str:
    return _SAFE.sub("_", s).strip("_") or "project"


def _page_hash(path: Path) -> str:
    """Stable hash of a page image so per-page OCR results can be cached."""
    h = hashlib.sha256()
    with path.open("rb") as fp:
        for chunk in iter(lambda: fp.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()[:24]


def _ocr_one_page(client, image_path: Path, model: str) -> str:
    """Send one page to Mistral OCR and return its markdown."""
    b64 = base64.standard_b64encode(image_path.read_bytes()).decode("ascii")
    response = client.ocr.process(
        model=model,
        document={
            "type": "image_url",
            "image_url": f"data:image/png;base64,{b64}",
        },
    )
    parts = []
    for page in getattr(response, "pages", []) or []:
        md = getattr(page, "markdown", None)
        if md:
            parts.append(md)
    return "\n\n".join(parts).strip()


def _get_or_ocr(
    client,
    image_path: Path,
    cache_dir: Path,
    model: str,
) -> str:
    """Cache OCR results per page so retries / parser tweaks don't re-bill."""
    digest = _page_hash(image_path)
    cache_path = cache_dir / f"{digest}.md"
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8")
    md = _ocr_one_page(client, image_path, model)
    cache_path.write_text(md, encoding="utf-8")
    return md


def ocr(
    groups_path: Path,
    out_dir: Path,
    workers: int = 4,
    limit: int | None = None,
    model: str = DEFAULT_MODEL,
) -> Path:
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise SystemExit(
            "MISTRAL_API_KEY is not set. Export it before running stage 3a."
        )

    try:
        # The 2.x SDK exposes the client under `mistralai.client`.
        from mistralai.client import Mistral
    except ImportError:
        try:
            from mistralai import Mistral  # 1.x fallback
        except ImportError as e:
            raise SystemExit("mistralai SDK not installed. Run: uv sync") from e

    client = Mistral(api_key=api_key)
    groups: list[dict] = json.loads(groups_path.read_text())
    if limit is not None:
        groups = groups[:limit]

    ocr_dir = out_dir / "ocr"
    cache_dir = ocr_dir / "_pages"
    ocr_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)

    manifest_lock = Lock()
    manifest: list[dict] = []

    def _worker(idx: int, group: dict) -> dict:
        page_paths = [out_dir / p for p in group["pages"]]
        per_page = [_get_or_ocr(client, p, cache_dir, model) for p in page_paths]
        combined = "\n\n---\n\n".join(per_page).strip() + "\n"

        name = group.get("project_name", f"project_{idx:04d}")
        md_path = ocr_dir / f"{idx:04d}_{_safename(name)}.md"
        md_path.write_text(combined, encoding="utf-8")

        entry = {
            "group_idx": idx,
            "project_name": name,
            "page_numbers": group.get("page_numbers", []),
            "md_path": str(md_path.relative_to(out_dir)),
        }
        with manifest_lock:
            manifest.append(entry)
        return entry

    print(f"[stage3a] OCR {len(groups)} group(s) with model={model}, workers={workers}")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_worker, i, g): (i, g) for i, g in enumerate(groups)}
        done = 0
        for fut in as_completed(futures):
            done += 1
            try:
                e = fut.result()
                print(f"[stage3a] {done}/{len(groups)} {e['project_name']}", file=sys.stderr)
            except Exception as exc:  # network, API
                i, g = futures[fut]
                print(
                    f"[stage3a] {done}/{len(groups)} FAILED {g.get('project_name')}: {exc}",
                    file=sys.stderr,
                )

    manifest.sort(key=lambda e: e["group_idx"])
    manifest_path = out_dir / "ocr_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"[stage3a] wrote {len(manifest)} markdown file(s) → {ocr_dir.name}/")
    return manifest_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 3a: OCR page groups with Mistral.")
    ap.add_argument("--groups", type=Path, help="page_groups.json")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--model", default=DEFAULT_MODEL)
    args = ap.parse_args()
    groups_path = args.groups or (args.out / "page_groups.json")
    if not groups_path.exists():
        raise SystemExit(f"Groups file not found: {groups_path}. Run stage2 first.")
    ocr(groups_path, args.out, workers=args.workers, limit=args.limit, model=args.model)


if __name__ == "__main__":
    main()
