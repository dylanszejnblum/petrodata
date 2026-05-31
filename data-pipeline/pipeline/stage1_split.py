"""Stage 1 — split: rasterize PDF(s) into per-page PNG images.

Inputs:
    --pdf       one or more PDF paths (or a folder of PDFs)
    --out       output dir; pages land in <out>/pages/<source>/page_NNNN.png
    --dpi       rendering resolution (default 220)

Outputs:
    <out>/pages/<source_stem>/page_NNNN.png
    <out>/pages_manifest.json  — list of {page, image_path, source_pdf, page_in_source}

`page` is the global page index across all input PDFs (1-indexed, contiguous).
`page_in_source` is the original page index inside the source PDF (1-indexed).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import fitz  # pymupdf


def _collect_pdfs(inputs: list[Path]) -> list[Path]:
    pdfs: list[Path] = []
    for p in inputs:
        if p.is_dir():
            pdfs.extend(sorted(p.glob("*.pdf")))
        elif p.suffix.lower() == ".pdf":
            pdfs.append(p)
        else:
            raise SystemExit(f"Not a PDF or directory: {p}")
    if not pdfs:
        raise SystemExit("No PDFs found in inputs.")
    return pdfs


def split(inputs: list[Path], out_dir: Path, dpi: int = 220) -> Path:
    pdfs = _collect_pdfs(inputs)
    pages_root = out_dir / "pages"
    pages_root.mkdir(parents=True, exist_ok=True)

    manifest: list[dict] = []
    global_idx = 0

    for pdf_path in pdfs:
        stem = pdf_path.stem
        target = pages_root / stem
        target.mkdir(parents=True, exist_ok=True)

        with fitz.open(pdf_path) as doc:
            for local_idx, page in enumerate(doc, start=1):
                global_idx += 1
                pix = page.get_pixmap(dpi=dpi)
                img_path = target / f"page_{global_idx:04d}.png"
                pix.save(img_path)
                manifest.append(
                    {
                        "page": global_idx,
                        "image_path": str(img_path.relative_to(out_dir)),
                        "source_pdf": pdf_path.name,
                        "page_in_source": local_idx,
                    }
                )

    manifest_path = out_dir / "pages_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(
        f"[stage1] split {len(pdfs)} PDF(s) into {len(manifest)} pages "
        f"at {dpi} DPI → {pages_root}"
    )
    return manifest_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 1: rasterize PDFs to PNGs.")
    ap.add_argument("--pdf", nargs="+", required=True, type=Path, help="PDF file(s) or directory")
    ap.add_argument("--out", required=True, type=Path, help="Output directory")
    ap.add_argument("--dpi", type=int, default=220)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    split(args.pdf, args.out, dpi=args.dpi)


if __name__ == "__main__":
    main()
