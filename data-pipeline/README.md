# mining-extract

Convert large PDF reports of Argentine mining-project fact sheets into
validated JSON + CSV. One record per project, OCR-first with a deterministic
markdown parser — no LLM in the extraction loop.

## Pipeline

```
report.pdf
  │
  ├─[1]  stage1_split     →  out/pages/<source>/page_NNNN.png + out/pages_manifest.json
  ├─[2]  stage2_group     →  out/page_groups.json
  ├─[3a] stage3a_ocr      →  out/ocr/*.md (one per project) + out/ocr_manifest.json
  ├─[3b] stage3b_parse    →  out/extracted.json
  ├─[4]  stage4_validate  →  out/projects.json + out/review_queue.json
  └─[5]  stage5_flatten   →  out/projects.csv (+ out/projects_long.csv with --long)
```

Stage 3a (Mistral OCR) is the only billable step and the only one that needs
network. It caches per-page markdown by image hash, so re-running 3a never
re-bills already-OCR'd pages.

Stage 3b is pure-Python. Iterate the parser freely without re-OCR — point it
at `out/ocr_manifest.json` and rebuild `extracted.json` for free.

## Setup

```bash
# one-time on a fresh clone — uv installs the pinned interpreter and deps
uv sync

# OCR needs a Mistral API key (stage 3a only)
export MISTRAL_API_KEY=...
```

## Run

```bash
# full pipeline on one PDF, fixed 3-pages-per-project grouping
uv run run.py --pdf portfolio_uranium_2026.pptx.pdf --out out_uranium/ \
              --strategy fixed --pages-per-project 3 --workers 4 --long

# cheap dry run on the first 2 project groups (≈6 pages of OCR)
uv run run.py --pdf report.pdf --out out/ --limit 2

# re-run parser+validate+flatten without re-OCR
uv run run.py --pdf report.pdf --out out/ --skip-ocr

# or, after fully OCR'd, only re-run 3b → 5
uv run run.py --pdf any.pdf --out out/ --reparse-only
```

Each stage is also runnable standalone:

```bash
uv run python -m pipeline.stage1_split    --pdf report.pdf --out out/
uv run python -m pipeline.stage2_group    --out out/ --strategy fixed --pages-per-project 3
uv run python -m pipeline.stage3a_ocr     --out out/ --workers 4 --limit 2
uv run python -m pipeline.stage3b_parse   --out out/
uv run python -m pipeline.stage4_validate --out out/
uv run python -m pipeline.stage5_flatten  --out out/ --long
```

## Tests

```bash
uv run pytest
```

All tests run offline — no API key needed. They cover the flattener (union
columns, long-mode), the validator (clean/bad routing, sparse-record check),
fixed-strategy grouping, and the deterministic parser (against fabricated
markdown fixtures for gold/silver and uranium).

## Configuration

Environment variables read by stage 3a:

| Variable             | Default                | Purpose                |
| -------------------- | ---------------------- | ---------------------- |
| `MISTRAL_API_KEY`    | _(required)_           | API auth               |
| `MISTRAL_OCR_MODEL`  | `mistral-ocr-latest`   | OCR model              |

## Schema

`schema.py` holds the authoritative one-record-per-project shape. Common
fields are top-level; commodity-specific numbers live inside
`resources` / `reserves` as `{category, values}` rows where `values` is a
free key→number map. The parser normalizes column headers to
`<Symbol>_<unit>` keys (gold uses `Au_g_t`, `Ag_kOz`; uranium uses `RAR_Tn`,
`pct_U`, `Uranium_t`; commodities not in the symbol table follow the same
`<Symbol>_<unit>` convention).

Two hand-verified records — Cerro Moro (gold) and Don Otto (uranium) — live
in `fixtures/projects_expected.json`, alongside markdown fixtures used by
the parser tests.

## Tuning the parser after a real OCR run

The parser is the cheapest part to iterate. Workflow:

1. Run stage 3a once on a couple of groups: `--limit 2`.
2. Inspect `out/ocr/*.md` — these are the actual Mistral OCR outputs.
3. Adjust `pipeline/stage3b_parse.py`: label regexes
   (`TOP_LEVEL_LABELS` / `LOCATION_LABELS` / `TECH_ECON_LABELS` /
   `YEAR_LABELS` / `AREA_LABELS`), table heading classification, or
   column-header normalization. Add bilingual aliases as needed.
4. Re-run only stage 3b: `python -m pipeline.stage3b_parse --out out/`.
5. Once happy, expand: drop `--limit`, run 3a + 3b + 4 + 5 end-to-end.

Common categories of failure observed in practice:

- **Mistral mis-OCRs subscripts in chemical formulas** (`U3O8 → U.O.`,
  `V2O5 → V_{x}O_{x}`). The parser strips both dots and LaTeX-style
  `_{...}` subscripts; `UO` and `VO` are mapped back to Uranium / Vanadium
  in `SYMBOL_TO_NAME`.
- **Styled icon panels are sometimes dropped entirely.** The
  `TYPE OF DEPOSIT` / `STATUS` / `CONTROLLER | OPERATOR` / `ÁREA` block on
  the second page of each fact sheet is embedded in iconography that
  Mistral occasionally skips. Re-rendering at higher DPI (e.g.
  `--dpi 300`) can recover these.
- **TOC/cover/credits pages** get partial banner-commodity inference; the
  validator's `sparse_record` check routes them to `review_queue.json`.

## Notes

- Coordinates are kept as strings (e.g. `"48° 01' 55\" S"`) so the printed
  form is preserved. Bare-DMS lines (no label) are detected too.
- Numeric fields strip thousands separators (`304,167 ha → 304167`).
- Dash placeholders (`-`, `–`, `—`, `N/A`) become null, not literal strings.
- Records failing validation never reach `projects.json` / `projects.csv`;
  they go to `review_queue.json` with a `_problems` list explaining why.
- The wide CSV is union-of-columns: gold and uranium projects coexist in
  the same file with the other commodity's columns blank.

## Deviation from the original PRD

The PRD's "vision over OCR" decision targeted the Anthropic API as the
extractor. This repo replaces that with Mistral OCR + a deterministic
markdown parser. Trade-offs:

- **+** No LLM in the loop. Parser iterations are free and repeatable.
- **+** Cheaper per page than vision-model extraction.
- **−** Iconography-heavy panels can be partially lost to OCR; the original
  PRD design (one vision call per project) saw those as well as anything
  else on the page. If accuracy on those panels matters, consider running
  a vision-model fix-up over `review_queue.json` records.
