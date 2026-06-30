"""News pipeline backoffice — v0.

Read-only web window onto a pipeline output dir. Shows sources, article counts
and images straight from the emitted artifacts — no DB, no build step. Reads the
files fresh on every request, so it always reflects the latest cron tick. Runs
in the same container as the news cron, reading the same NEWS_OUT_DIR volume.

    uv run dashboard.py --out out_news/            # http://localhost:8800
    uv run dashboard.py --out out_news/ --port 9000
    uv run dashboard.py --selfcheck                # offline aggregation test

Env (for the Coolify deploy):
    NEWS_OUT_DIR     dir to read (default out_news; --out overrides)
    DASHBOARD_PORT   listen port (default 8800; --port overrides)
    DASHBOARD_USER   basic-auth user (default 'admin')
    DASHBOARD_PASS   basic-auth password; if UNSET, the UI is open (local dev)

Reads, if present, under <out>/:
    normalized/news_documents.ndjson   the emitted, validated docs (source of truth)
    state.json                         per-connector watermarks (last seen)
    emit_report.json                   emitted / rejected counts

ponytail: stdlib only, reloads per request. Fine while the doc set is small
(thousands). If it ever gets large, cache by file mtime — not before.
"""

from __future__ import annotations

import argparse
import base64
import hmac
import html
import json
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


# ── data loading / aggregation ───────────────────────────────────────────────


def _read_ndjson(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines()
            if l.strip()]


def _read_json(path: Path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def _images(doc: dict) -> list[str]:
    return [a["url"] for a in (doc.get("attachments") or [])
            if a.get("type") == "image" and a.get("url")]


def load(out_dir: Path) -> dict:
    """Load + aggregate everything the dashboard renders from one out dir."""
    docs = _read_ndjson(out_dir / "normalized" / "news_documents.ndjson")
    state = _read_json(out_dir / "state.json", {})
    report = _read_json(out_dir / "emit_report.json", {})

    by_source: dict[str, dict] = {}
    total_images = 0
    last_run = None
    for d in docs:
        imgs = _images(d)
        total_images += len(imgs)
        ra = d.get("retrieved_at")
        if ra and (last_run is None or ra > last_run):
            last_run = ra

        name = d.get("source_name", "?")
        s = by_source.setdefault(name, {
            "source_name": name, "family": d.get("source_family", "?"),
            "legal_mode": d.get("legal_mode", "?"), "count": 0,
            "images": 0, "latest": None,
        })
        s["count"] += 1
        s["images"] += len(imgs)
        pub = d.get("published_at")
        if pub and (s["latest"] is None or pub > s["latest"]):
            s["latest"] = pub

    return {
        "docs": docs,
        "sources": sorted(by_source.values(), key=lambda s: -s["count"]),
        "state": state,
        "report": report,
        "totals": {
            "articles": len(docs),
            "sources": len(by_source),
            "images": total_images,
            "with_body": sum(1 for d in docs if d.get("body_text")),
            "last_run": last_run,
            "rejected": report.get("rejected", 0),
        },
    }


# ── rendering ────────────────────────────────────────────────────────────────

CSS = """
:root{--bg:#0c0e12;--panel:#15181f;--line:#252a34;--ink:#e7ebf0;--mut:#8a94a6;
--acc:#3aa0ff;--good:#3ad29f;--warn:#f5a623}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
header{padding:20px 28px;border-bottom:1px solid var(--line);display:flex;
align-items:baseline;gap:14px}header h1{font-size:17px;margin:0;font-weight:650}
header .sub{color:var(--mut);font-size:12px}.wrap{max-width:1100px;margin:0 auto;
padding:24px 28px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;
margin-bottom:26px}.card{background:var(--panel);border:1px solid var(--line);
border-radius:10px;padding:14px 16px}.card .n{font-size:26px;font-weight:680}
.card .l{color:var(--mut);font-size:12px;margin-top:2px}h2{font-size:13px;
text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:30px 0 12px}
table{width:100%;border-collapse:collapse;background:var(--panel);
border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);font-size:13px}
th{color:var(--mut);font-weight:550;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
tr:last-child td{border-bottom:none}td.num{text-align:right;font-variant-numeric:tabular-nums}
.tag{display:inline-block;background:#1d2230;border:1px solid var(--line);color:var(--mut);
border-radius:20px;padding:1px 9px;font-size:11px;margin:0 4px 4px 0}
.art{display:flex;gap:14px;padding:14px;border:1px solid var(--line);
background:var(--panel);border-radius:10px;margin-bottom:10px}
.art img{width:120px;height:80px;object-fit:cover;border-radius:7px;background:#1d2230;flex:none}
.art .t{font-weight:600;margin:0 0 4px}.art .m{color:var(--mut);font-size:12px;margin-bottom:6px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.gal a img{width:100%;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--line)}
.body{background:var(--panel);border:1px solid var(--line);border-radius:10px;
padding:20px 24px;white-space:pre-wrap;max-width:760px}
.pill{font-size:11px;padding:1px 8px;border-radius:6px;border:1px solid var(--line)}
.pill.full{color:var(--good);border-color:#1e4a3a}.pill.meta{color:var(--mut)}
.empty{color:var(--mut);padding:40px;text-align:center;border:1px dashed var(--line);border-radius:10px}
"""


def _esc(s) -> str:
    return html.escape(str(s if s is not None else ""))


def _fmt_dt(iso: str | None) -> str:
    if not iso:
        return "—"
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return iso[:16]


def _legal_pill(mode: str) -> str:
    cls = "full" if mode and mode != "metadata_only" else "meta"
    return f'<span class="pill {cls}">{_esc(mode)}</span>'


def _page(title: str, body: str) -> str:
    return (f"<!doctype html><html><head><meta charset=utf-8>"
            f"<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>{_esc(title)}</title><style>{CSS}</style></head><body>"
            f"<header><h1>📰 News Pipeline</h1>"
            f"<span class=sub>{_esc(title)}</span>"
            f"<span class=sub style='margin-left:auto'><a href='/'>overview</a> · "
            f"<a href='/images'>images</a></span></header>"
            f"<div class=wrap>{body}</div></body></html>")


def render_overview(data: dict, source_filter: str | None) -> str:
    t = data["totals"]
    cards = [
        (t["articles"], "articles"), (t["sources"], "sources"),
        (t["images"], "images"), (t["with_body"], "with full text"),
        (t["rejected"], "rejected"),
    ]
    cards_html = "".join(
        f"<div class=card><div class=n>{n}</div><div class=l>{l}</div></div>"
        for n, l in cards)

    # sources table
    rows = "".join(
        f"<tr><td><a href='/?source={_esc(s['source_name'])}'>{_esc(s['source_name'])}</a></td>"
        f"<td>{_esc(s['family'])}</td><td>{_legal_pill(s['legal_mode'])}</td>"
        f"<td class=num>{s['count']}</td><td class=num>{s['images']}</td>"
        f"<td>{_fmt_dt(s['latest'])}</td></tr>"
        for s in data["sources"])
    src_table = (
        "<table><tr><th>Source</th><th>Family</th><th>Legal</th>"
        "<th class=num>Articles</th><th class=num>Images</th><th>Latest</th></tr>"
        f"{rows}</table>" if data["sources"]
        else "<div class=empty>No articles yet. Run <code>uv run run_news.py "
             "--out out_news/</code>.</div>")

    # connector watermarks
    wm_rows = ""
    for conn, slice_ in (data["state"] or {}).items():
        if isinstance(slice_, dict):
            for feed, seen in slice_.items():
                wm_rows += (f"<tr><td>{_esc(conn)}</td><td style='color:var(--mut);"
                            f"font-size:12px'>{_esc(feed)}</td><td>{_fmt_dt(seen)}</td></tr>")
        else:
            wm_rows += f"<tr><td>{_esc(conn)}</td><td>—</td><td>{_esc(slice_)}</td></tr>"
    wm = (f"<table><tr><th>Connector</th><th>Feed / key</th><th>Last seen</th></tr>"
          f"{wm_rows}</table>" if wm_rows else "")

    # articles
    docs = data["docs"]
    if source_filter:
        docs = [d for d in docs if d.get("source_name") == source_filter]
    docs = sorted(docs, key=lambda d: d.get("published_at") or "", reverse=True)

    arts = []
    for d in docs:
        imgs = _images(d)
        thumb = (f"<img src='{_esc(imgs[0])}' loading=lazy alt=''>" if imgs
                 else "<img alt='' src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E\">")
        topics = "".join(f"<span class=tag>{_esc(x)}</span>" for x in (d.get("topics") or []))
        arts.append(
            f"<div class=art>{thumb}<div>"
            f"<div class=t><a href='/doc/{_esc(d['doc_id'])}'>{_esc(d.get('title'))}</a></div>"
            f"<div class=m>{_esc(d.get('source_name'))} · {_fmt_dt(d.get('published_at'))} "
            f"· {_legal_pill(d.get('legal_mode'))}</div>"
            f"<div>{topics}</div></div></div>")
    filt = (f" — <a href='/'>{_esc(source_filter)} ✕</a>" if source_filter else "")
    arts_html = "".join(arts) or "<div class=empty>No articles.</div>"

    return (f"<div class=cards>{cards_html}</div>"
            f"<div class=l style='color:var(--mut)'>Last run: {_fmt_dt(t['last_run'])}</div>"
            f"<h2>Sources</h2>{src_table}"
            + (f"<h2>Connector watermarks</h2>{wm}" if wm else "")
            + f"<h2>Articles{filt}</h2>{arts_html}")


def render_doc(data: dict, doc_id: str) -> str | None:
    doc = next((d for d in data["docs"] if d.get("doc_id") == doc_id), None)
    if not doc:
        return None
    imgs = _images(doc)
    img_html = "".join(f"<img src='{_esc(u)}' style='max-width:100%;border-radius:10px;"
                       f"margin:0 0 14px' alt=''>" for u in imgs)
    topics = "".join(f"<span class=tag>{_esc(x)}</span>" for x in (doc.get("topics") or []))
    ents = doc.get("entities") or {}
    ent_html = "".join(
        f"<div class=m><b>{_esc(k)}:</b> {_esc(', '.join(v))}</div>"
        for k, v in ents.items() if v)
    body = doc.get("body_text") or doc.get("deck") or "(no body — metadata only)"
    meta = (f"{_esc(doc.get('source_name'))} · {_esc(doc.get('source_family'))} · "
            f"{_fmt_dt(doc.get('published_at'))} · {_legal_pill(doc.get('legal_mode'))}")
    return (f"<p><a href='/'>← back</a></p>"
            f"<h1 style='max-width:760px'>{_esc(doc.get('title'))}</h1>"
            f"<div class=m style='margin:-6px 0 16px'>{meta} · "
            f"<a href='{_esc(doc.get('source_url'))}' target=_blank>source ↗</a></div>"
            f"<div style='margin-bottom:10px'>{topics}</div>"
            f"{img_html}<div class=body>{_esc(body)}</div>"
            + (f"<h2>Entities</h2>{ent_html}" if ent_html else ""))


def render_images(data: dict) -> str:
    cells = []
    for d in data["docs"]:
        for u in _images(d):
            cells.append(f"<a href='/doc/{_esc(d['doc_id'])}' title=\"{_esc(d.get('title'))}\">"
                         f"<img src='{_esc(u)}' loading=lazy alt=''></a>")
    grid = "".join(cells) or "<div class=empty>No images captured yet.</div>"
    return f"<h2>Images ({len(cells)})</h2><div class=gal>{grid}</div>"


# ── server ───────────────────────────────────────────────────────────────────


def make_handler(out_dir: Path, auth: str | None):
    """auth: the expected 'user:pass' string, or None to leave the UI open."""

    class Handler(BaseHTTPRequestHandler):
        def _send(self, body: str, code: int = 200, headers: dict | None = None):
            payload = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(payload)

        def _authed(self) -> bool:
            if not auth:
                return True
            hdr = self.headers.get("Authorization", "")
            if not hdr.startswith("Basic "):
                return False
            try:
                got = base64.b64decode(hdr[6:]).decode("utf-8")
            except Exception:
                return False
            return hmac.compare_digest(got, auth)  # constant-time

        def do_GET(self):  # noqa: N802
            parts = urlsplit(self.path)
            path = parts.path
            if path == "/healthz":  # unauthenticated, for Coolify health checks
                self._send("ok")
                return
            if not self._authed():
                self._send("<h1>401</h1>", 401,
                           {"WWW-Authenticate": 'Basic realm="news-backoffice"'})
                return
            data = load(out_dir)  # fresh every request
            if path == "/":
                q = parse_qs(parts.query)
                src = q.get("source", [None])[0]
                self._send(_page("overview", render_overview(data, src)))
            elif path == "/images":
                self._send(_page("images", render_images(data)))
            elif path.startswith("/doc/"):
                doc_html = render_doc(data, path[len("/doc/"):])
                if doc_html is None:
                    self._send(_page("not found", "<div class=empty>Doc not found.</div>"), 404)
                else:
                    self._send(_page("article", doc_html))
            else:
                self._send(_page("not found", "<div class=empty>Not found.</div>"), 404)

        def log_message(self, *a):  # quieter logs
            pass

    return Handler


def serve(out_dir: Path, port: int) -> None:
    user = os.environ.get("DASHBOARD_USER", "admin")
    pw = os.environ.get("DASHBOARD_PASS")
    auth = f"{user}:{pw}" if pw else None
    if not auth:
        print("[dashboard] WARNING: DASHBOARD_PASS unset — UI is OPEN (fine for local dev)")
    httpd = ThreadingHTTPServer(("0.0.0.0", port), make_handler(out_dir, auth))
    print(f"[dashboard] serving {out_dir} at http://localhost:{port}  (ctrl-c to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[dashboard] bye")


def _selfcheck() -> None:
    docs = [
        {"doc_id": "a", "source_name": "EconoJournal", "source_family": "medio",
         "legal_mode": "fulltext_internal", "published_at": "2026-06-30T00:00:00+00:00",
         "retrieved_at": "2026-06-30T10:00:00+00:00", "body_text": "x",
         "attachments": [{"type": "image", "url": "http://i/1.jpg"}]},
        {"doc_id": "b", "source_name": "EconoJournal", "source_family": "medio",
         "legal_mode": "fulltext_internal", "published_at": "2026-06-29T00:00:00+00:00",
         "retrieved_at": "2026-06-30T11:00:00+00:00", "attachments": []},
        {"doc_id": "c", "source_name": "Shale24", "source_family": "medio",
         "legal_mode": "metadata_only", "retrieved_at": "2026-06-30T09:00:00+00:00"},
    ]
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        out = Path(td)
        (out / "normalized").mkdir()
        (out / "normalized" / "news_documents.ndjson").write_text(
            "\n".join(json.dumps(d) for d in docs))
        (out / "emit_report.json").write_text('{"emitted":3,"rejected":1}')
        data = load(out)
    t = data["totals"]
    assert t["articles"] == 3, t
    assert t["sources"] == 2, t
    assert t["images"] == 1, t
    assert t["with_body"] == 1, t
    assert t["rejected"] == 1, t
    assert t["last_run"] == "2026-06-30T11:00:00+00:00", t
    assert data["sources"][0]["source_name"] == "EconoJournal"  # sorted by count
    assert data["sources"][0]["count"] == 2
    assert render_doc(data, "a") and render_doc(data, "zzz") is None
    print("selfcheck ok")


def main() -> int:
    ap = argparse.ArgumentParser(description="News pipeline backoffice (v0).")
    ap.add_argument("--out", type=Path,
                    default=Path(os.environ.get("NEWS_OUT_DIR", "out_news")))
    ap.add_argument("--port", type=int,
                    default=int(os.environ.get("DASHBOARD_PORT", "8800")))
    ap.add_argument("--selfcheck", action="store_true")
    args = ap.parse_args()
    if args.selfcheck:
        _selfcheck()
        return 0
    serve(args.out, args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
