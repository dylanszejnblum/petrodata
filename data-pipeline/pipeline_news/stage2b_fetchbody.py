"""Stage 2b — fetch body: download & extract full text + lead image for the docs
we are licensed to reproduce.

Inputs:  <out>/normalized.ndjson
Outputs: <out>/bodied.ndjson
         <out>/fetchbody_report.json   — fetched/skipped/failed counts

Only docs whose legal_mode permits reproduction (fulltext_internal /
licensed_fulltext) are fetched; metadata_only docs pass through untouched so the
`validate_doc` invariant (metadata_only must not carry body_text) stays intact.

Per doc, best-effort and isolated — any network/parse failure leaves that doc
unchanged and the run continues:
  • PDF target (e.g. a CNV disclosure) → text via PyMuPDF.
  • HTML target                       → main article text via trafilatura, plus
                                        the OG/Twitter lead image as an attachment.

Runs before stage3 so the entity/topic/number tagger sees the full body, not
just title + deck.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import re
import socket
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import fitz  # PyMuPDF — already a dependency
import httpx
import trafilatura

_HEADERS = {"User-Agent": "vacamuerta-news-ingest/0.1"}
_FETCHABLE_MODES = {"fulltext_internal", "licensed_fulltext"}

# Guardrails: skip absurdly short extractions (nav/boilerplate) and cap storage.
_MIN_BODY_CHARS = 200
_MAX_BODY_CHARS = 40_000
_MAX_BYTES = 25 * 1024 * 1024  # un PDF de la CNV entra holgado
_MAX_REDIRECTS = 5

# JS-rendered viewers (e.g. CNV's publicview SPA) serve a loading shell to plain
# HTTP — extracting that yields placeholder chrome, not the document. Reject it
# so the doc falls back to metadata + attachment link instead of storing junk.
_JUNK_RE = re.compile(
    r"cargando informaci[oó]n|espera por favor|"
    r"(?:habilit[ae]|enable|requires?).{0,20}javascript|"
    r"please enable javascript|loading…",
    re.I,
)

# OG/Twitter lead image, in source order (first match wins).
_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::url)?|twitter:image)["\']'
    r'[^>]*content=["\']([^"\']+)["\']',
    re.I,
)


def _public(url: str) -> bool:
    """Sólo http(s) a hosts que resuelven a IPs públicas. Las URLs salen de
    feeds de terceros: sin esto un link (o un redirect) podía hacer que el
    contenedor leyera servicios internos (http://backend:3001, 169.254.169.254)
    y guardara la respuesta como body_text."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        return False
    try:
        infos = socket.getaddrinfo(parts.hostname, None)
    except OSError:
        return False
    return all(ipaddress.ip_address(i[4][0].split("%")[0]).is_global for i in infos)


def _fetch(url: str) -> httpx.Response | None:
    # Redirects a mano para validar cada salto; el body se corta en _MAX_BYTES.
    # ponytail: resuelve DNS antes que httpx (DNS rebinding sigue posible); fijar la IP si importa
    try:
        with httpx.Client(timeout=40, headers=_HEADERS) as client:
            for _ in range(_MAX_REDIRECTS + 1):
                if not _public(url):
                    raise ValueError("host no público")
                with client.stream("GET", url) as resp:
                    if resp.is_redirect:
                        url = urljoin(url, resp.headers["location"])
                        continue
                    resp.raise_for_status()
                    body = bytearray()
                    for chunk in resp.iter_bytes():
                        body += chunk
                        if len(body) > _MAX_BYTES:
                            raise ValueError("respuesta demasiado grande")
                    headers = {k: v for k, v in resp.headers.items()
                               if k.lower() not in ("content-encoding", "content-length", "transfer-encoding")}
                    return httpx.Response(resp.status_code, headers=headers,
                                          content=bytes(body), request=resp.request)
            raise ValueError("demasiados redirects")
    except Exception as exc:  # one bad URL must not sink the run
        print(f"[stage2b]   ✕ fetch failed {url}: {exc!r}")
        return None


def _looks_pdf(resp: httpx.Response, url: str) -> bool:
    ctype = resp.headers.get("content-type", "").lower()
    return "application/pdf" in ctype or url.lower().split("?")[0].endswith(".pdf")


def _extract_pdf(content: bytes) -> str | None:
    try:
        with fitz.open(stream=content, filetype="pdf") as pdf:
            text = "\n\n".join(page.get_text("text") for page in pdf)
    except Exception as exc:
        print(f"[stage2b]   ✕ pdf parse failed: {exc!r}")
        return None
    text = text.strip()
    return text or None


def _extract_html(resp: httpx.Response) -> tuple[str | None, str | None]:
    """Return (body_text, lead_image_url) from an HTML response."""
    html = resp.text
    body = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=False,
        favor_recall=True,
        url=str(resp.url),
    )
    img = None
    m = _OG_IMAGE_RE.search(html)
    if m:
        img = urljoin(str(resp.url), m.group(1).strip())
    return (body.strip() if body else None), img


def _pdf_target(doc: dict) -> str | None:
    for att in doc.get("attachments") or []:
        url = att.get("url") if isinstance(att, dict) else None
        if not url:
            continue
        if att.get("type") == "pdf" or url.lower().split("?")[0].endswith(".pdf"):
            return url
    return None


def _has_image(doc: dict) -> bool:
    return any(
        isinstance(a, dict)
        and (a.get("type") == "image"
             or (isinstance(a.get("url"), str)
                 and re.search(r"\.(jpe?g|png|webp|gif|avif)(\?.*)?$", a["url"], re.I)))
        for a in (doc.get("attachments") or [])
    )


def _enrich_doc(doc: dict) -> str:
    """Mutate `doc` in place with body_text / lead image. Returns an outcome tag
    ('fetched' | 'empty' | 'failed') for the report."""
    target = _pdf_target(doc) or doc.get("source_url")
    if not target:
        return "failed"

    resp = _fetch(target)
    if resp is None:
        return "failed"

    body: str | None
    if _looks_pdf(resp, target):
        body = _extract_pdf(resp.content)
    else:
        body, image_url = _extract_html(resp)
        if image_url and not _has_image(doc):
            doc.setdefault("attachments", []).append(
                {"type": "image", "url": image_url, "sha256": None})

    if not body or len(body) < _MIN_BODY_CHARS or _JUNK_RE.search(body):
        return "empty"

    doc["body_text"] = body[:_MAX_BODY_CHARS]
    return "fetched"


def fetchbody(out_dir: Path) -> Path:
    src = out_dir / "normalized.ndjson"
    dst = out_dir / "bodied.ndjson"

    fetched = skipped = empty = failed = 0
    with src.open(encoding="utf-8") as fin, dst.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            doc = json.loads(line)

            if doc.get("legal_mode") in _FETCHABLE_MODES and not doc.get("body_text"):
                outcome = _enrich_doc(doc)
                fetched += outcome == "fetched"
                empty += outcome == "empty"
                failed += outcome == "failed"
            else:
                skipped += 1

            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")

    (out_dir / "fetchbody_report.json").write_text(
        json.dumps({"fetched": fetched, "empty": empty,
                    "failed": failed, "skipped": skipped},
                   indent=2, ensure_ascii=False))
    print(f"[stage2b] body fetched {fetched}, empty {empty}, "
          f"failed {failed}, skipped {skipped} (metadata-only/cached) → {dst.name}")
    return dst


def main() -> int:
    ap = argparse.ArgumentParser(description="News fetch-body (stage 2b).")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    fetchbody(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
