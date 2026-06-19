"""Stage 3 — enrich: tag entities & topics, drop off-topic items.

Inputs:  <out>/normalized.ndjson
Outputs: <out>/enriched.ndjson
         <out>/enrich_report.json   — kept/dropped counts + dropped titles

Deterministic dictionary matching over title + deck (all we have for
metadata_only docs). No LLM, no network → no caching needed. Fills entities,
topics, light numbers and an importance_score, and drops media docs that show
no oil & gas signal (the mining/sports/etc. noise that slips through RSS).
Primary/regulatory docs (e.g. CNV) are always kept.

TODO (when body_text exists for fulltext_internal docs): richer NER, geo,
embeddings for stage4 semantic clustering.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pipeline_news import taxonomy as tax

# ── matcher: word-boundary, accent-aware, case-insensitive ───────────────────

_BOUND = r"(?<![0-9a-zàáâäéèêëíìîïóòôöúùûüñç]){}(?![0-9a-zàáâäéèêëíìîïóòôöúùûüñç])"


def _compile(terms: list[str]) -> list[re.Pattern]:
    return [re.compile(_BOUND.format(re.escape(t.lower()))) for t in terms]


def _compile_map(d: dict[str, list[str]]) -> dict[str, list[re.Pattern]]:
    return {canon: _compile(aliases) for canon, aliases in d.items()}


# Reverse alias → canonical map, to fold connector-supplied legal names
# (e.g. "PLUSPETROL SA", "YPF S.A") into the taxonomy canonical.
_ALIAS2CANON: dict[str, str] = {}
for _canon, _aliases in tax.COMPANIES.items():
    _ALIAS2CANON[_canon.lower()] = _canon
    for _a in _aliases:
        _ALIAS2CANON[_a.lower()] = _canon

_LEGAL_SUFFIX = re.compile(
    r"\s+(s\.?a\.?u?\.?|s\.?r\.?l\.?|s\.?a\.?s\.?|s\.?a\.?i\.?c\.?|ltda?\.?|inc\.?|corp\.?|plc|llc|n\.?v\.?)\.?$",
    re.I)


def _canon_company(name: str) -> str:
    """Map a company surface form to its taxonomy canonical, or return it
    unchanged if unknown (CNV names are authoritative)."""
    base = name.strip().rstrip(".")
    key = _LEGAL_SUFFIX.sub("", base.lower()).strip().rstrip(".,").strip()
    return _ALIAS2CANON.get(key) or _ALIAS2CANON.get(base.lower()) or name


_COMPANIES = _compile_map(tax.COMPANIES)
_PEOPLE = _compile_map(tax.PEOPLE)
_PROJECTS = _compile_map(tax.PROJECTS)
_BLOCKS = _compile_map({b: [b] for b in tax.BLOCKS})
_REGULATORS = _compile_map(tax.REGULATORS)
_TOPICS = _compile_map(tax.TOPICS)
_RELEVANCE = _compile(tax.RELEVANCE_TERMS)


def _hits(text: str, compiled: dict[str, list[re.Pattern]]) -> list[str]:
    return sorted(c for c, pats in compiled.items() if any(p.search(text) for p in pats))


# ── light numbers extraction (conservative; null when unsure) ────────────────

_CAPEX_RE = re.compile(
    r"(?:us\$|u\$s|usd|\$)\s?([\d.,]+)\s?(mil millones|millones|mill[oó]n|bill[oó]n|mm)", re.I)
_OIL_RE = re.compile(r"([\d.,]+)\s?(?:mil\s)?(?:barriles|bbl)", re.I)


def _to_float(s: str) -> float | None:
    s = s.strip().replace(".", "").replace(",", ".")  # es-AR: 1.234,5 → 1234.5
    try:
        return float(s)
    except ValueError:
        return None


def _numbers(text: str) -> dict:
    out: dict = {}
    m = _CAPEX_RE.search(text)
    if m:
        v = _to_float(m.group(1))
        if v is not None:
            unit = m.group(2).lower()
            mult = 1_000_000_000 if ("mil mill" in unit or "bill" in unit) else 1_000_000
            out["capex_usd"] = v * mult
    m = _OIL_RE.search(text)
    if m:
        v = _to_float(m.group(1))
        if v is not None:
            out["oil_bpd"] = v * 1000 if "mil" in m.group(0).lower() else v
    return out


# ── relevance + importance ───────────────────────────────────────────────────

def _is_relevant(doc: dict, ents: dict, topics: list[str], text: str) -> bool:
    sig = doc.get("signals", {})
    if sig.get("is_regulatory") or sig.get("is_primary_source"):
        return True
    if doc.get("source_family") in ("regulatoria", "oficial", "oficial_provincial"):
        return True
    if any(ents.values()) or topics:
        return True
    return any(p.search(text) for p in _RELEVANCE)


def _importance(doc: dict, ents: dict, topics: list[str]) -> float:
    score = 0.0
    sig = doc.get("signals", {})
    if sig.get("is_primary_source") or sig.get("is_regulatory"):
        score += 0.4
    score += min(0.3, 0.15 * sum(len(v) for v in ents.values()))
    high = {"m_a", "midstream", "gnl", "rigi", "exportacion"}
    score += min(0.3, 0.1 * len(set(topics) & high) + 0.05 * len(topics))
    return round(min(1.0, score), 2)


def _merge(existing: dict, found: dict) -> dict:
    out = dict(existing or {})
    for key in ("companies", "people", "projects", "blocks", "regulators"):
        merged = list(dict.fromkeys((out.get(key) or []) + found.get(key, [])))
        out[key] = merged
    return out


def enrich(out_dir: Path) -> Path:
    src = out_dir / "normalized.ndjson"
    dst = out_dir / "enriched.ndjson"

    kept = 0
    dropped: list[str] = []
    with src.open(encoding="utf-8") as fin, dst.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            doc = json.loads(line)
            text = f"{doc.get('title', '')} {doc.get('deck') or ''}".lower()

            found = {
                "companies": _hits(text, _COMPANIES),
                "people": _hits(text, _PEOPLE),
                "projects": _hits(text, _PROJECTS),
                "blocks": _hits(text, _BLOCKS),
                "regulators": _hits(text, _REGULATORS),
            }
            topics = _hits(text, _TOPICS)

            if not _is_relevant(doc, found, topics, text):
                dropped.append(doc.get("title", "")[:80])
                continue

            merged = _merge(doc.get("entities", {}), found)
            # Canonicalize + dedupe company surface forms (order-preserving).
            merged["companies"] = list(dict.fromkeys(
                _canon_company(c) for c in merged["companies"]))
            doc["entities"] = merged
            doc["topics"] = sorted(set((doc.get("topics") or []) + topics))
            nums = _numbers(text)
            if nums:
                doc["numbers"] = {**doc.get("numbers", {}), **nums}
            doc["importance_score"] = _importance(doc, found, topics)

            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")
            kept += 1

    (out_dir / "enrich_report.json").write_text(
        json.dumps({"kept": kept, "dropped": len(dropped), "dropped_titles": dropped},
                   indent=2, ensure_ascii=False))
    print(f"[stage3] enriched {kept}, dropped {len(dropped)} off-topic → {dst.name}")
    for t in dropped[:8]:
        print(f"[stage3]   ✕ dropped: {t}")
    return dst


def main() -> int:
    ap = argparse.ArgumentParser(description="News enrich (stage 3).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    enrich(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
