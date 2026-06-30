"""News pipeline backoffice — v1.

A small web backoffice for the news pipeline, served from the same container as
the ingest cron (shared NEWS_OUT_DIR volume). It:

  • shows sources, article counts, images and the emitted docs (read fresh per
    request from the pipeline artifacts — no DB);
  • lets you add / edit / enable / disable RSS sources (persisted to
    <out>/sources.json, which the connector reads);
  • triggers a news fetch on demand (spawns run_news.py in the background);
  • is gated by a cookie-session login when DASHBOARD_PASS is set.

    uv run dashboard.py --out out_news/            # http://localhost:8800
    uv run dashboard.py --selfcheck               # offline tests

Env (Coolify):
    NEWS_OUT_DIR     dir to read/write (default out_news; --out overrides)
    DASHBOARD_PORT   listen port (default 8800)
    DASHBOARD_USER   login user (default 'admin')
    DASHBOARD_PASS   login password + session-signing key. If UNSET the UI is
                     OPEN (local dev only) — always set it in production.
    BACKEND_INGEST_URL / NEWS_INGEST_TOKEN
                     if both set, a manual run also POSTs to the backend.

ponytail: stdlib only, files reloaded per request. Fine at this scale (low
thousands of docs). Cache by mtime only if it ever gets slow.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import html
import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))  # import pipeline pkgs
import news_schema as schema  # noqa: E402
from pipeline_news import sources  # noqa: E402

APP_DIR = Path(__file__).resolve().parent


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
    last_run = _read_json(out_dir / "last_run.json", {})

    by_source: dict[str, dict] = {}
    total_images = 0
    fetched_at = None
    for d in docs:
        imgs = _images(d)
        total_images += len(imgs)
        ra = d.get("retrieved_at")
        if ra and (fetched_at is None or ra > fetched_at):
            fetched_at = ra
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
        "counts_by_name": {n: v["count"] for n, v in by_source.items()},
        "state": state,
        "report": report,
        "last_run": last_run,
        "totals": {
            "articles": len(docs),
            "sources": len(by_source),
            "images": total_images,
            "with_body": sum(1 for d in docs if d.get("body_text")),
            "last_run": fetched_at,
            "rejected": report.get("rejected", 0),
        },
    }


# ── manual run ───────────────────────────────────────────────────────────────

_run_lock = threading.Lock()
_running = {"flag": False}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_running() -> bool:
    return _running["flag"]


def trigger_run(out_dir: Path, source: str | None) -> bool:
    """Kick a pipeline run in the background. Returns False if one is already up."""
    with _run_lock:
        if _running["flag"]:
            return False
        _running["flag"] = True
    threading.Thread(target=_run_worker, args=(out_dir, source), daemon=True).start()
    return True


def _run_worker(out_dir: Path, source: str | None) -> None:
    cmd = [sys.executable, "run_news.py", "--out", str(out_dir)]
    if source and source != "all":
        cmd += ["--source", source]
    display = " ".join(cmd)  # before the token is appended — never log secrets
    url, tok = os.environ.get("BACKEND_INGEST_URL"), os.environ.get("NEWS_INGEST_TOKEN")
    if url and tok:
        cmd += ["--post-to", url, "--token", tok]
        display += f" --post-to {url} --token ***"

    rec = {"source": source or "all", "started": _now_iso(),
           "finished": None, "ok": None, "returncode": None}
    (out_dir / "last_run.json").write_text(json.dumps({**rec, "running": True}))
    log = out_dir / "last_run.log"
    try:
        with log.open("w", encoding="utf-8") as f:
            f.write(f"$ {display}\n\n")
            f.flush()
            p = subprocess.run(cmd, cwd=str(APP_DIR), stdout=f,
                               stderr=subprocess.STDOUT)
        rec["returncode"], rec["ok"] = p.returncode, p.returncode == 0
    except Exception as exc:  # never let the worker die silently
        rec["ok"], rec["returncode"] = False, -1
        with log.open("a", encoding="utf-8") as f:
            f.write(f"\n[dashboard] run failed: {exc!r}\n")
    finally:
        rec["finished"] = _now_iso()
        (out_dir / "last_run.json").write_text(json.dumps({**rec, "running": False}))
        with _run_lock:
            _running["flag"] = False


# ── auth (cookie session) ────────────────────────────────────────────────────


def _key() -> str | None:
    return os.environ.get("DASHBOARD_PASS")


def _user() -> str:
    return os.environ.get("DASHBOARD_USER", "admin")


def _sign(msg: str) -> str:
    return hmac.new(_key().encode(), msg.encode(), hashlib.sha256).hexdigest()


def make_session() -> str:
    ts = str(int(time.time()))
    return f"{ts}.{_sign(ts)}"


def valid_session(tok: str | None, max_age: int = 7 * 86400) -> bool:
    if not _key():
        return True  # auth disabled (dev)
    if not tok or "." not in tok:
        return False
    ts, sig = tok.split(".", 1)
    if not hmac.compare_digest(sig, _sign(ts)):
        return False
    try:
        return (time.time() - int(ts)) < max_age
    except ValueError:
        return False


def check_login(user: str, pw: str) -> bool:
    key = _key()
    return bool(key) and hmac.compare_digest(user, _user()) and \
        hmac.compare_digest(pw, key)


# ── rendering ────────────────────────────────────────────────────────────────

CSS = """
:root{--bg:#0c0e12;--panel:#15181f;--line:#252a34;--ink:#e7ebf0;--mut:#8a94a6;
--acc:#3aa0ff;--good:#3ad29f;--warn:#f5a623;--bad:#f56565}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
header{padding:18px 28px;border-bottom:1px solid var(--line);display:flex;
align-items:center;gap:18px}header h1{font-size:16px;margin:0;font-weight:650}
header nav{display:flex;gap:16px;font-size:13px}header .right{margin-left:auto;
color:var(--mut);font-size:12px}.wrap{max-width:1100px;margin:0 auto;padding:24px 28px}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.card .n{font-size:26px;font-weight:680}.card .l{color:var(--mut);font-size:12px;margin-top:2px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:30px 0 12px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);
border-radius:10px;overflow:hidden}th,td{text-align:left;padding:10px 14px;
border-bottom:1px solid var(--line);font-size:13px;vertical-align:middle}
th{color:var(--mut);font-weight:550;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
tr:last-child td{border-bottom:none}td.num{text-align:right;font-variant-numeric:tabular-nums}
.tag{display:inline-block;background:#1d2230;border:1px solid var(--line);color:var(--mut);
border-radius:20px;padding:1px 9px;font-size:11px;margin:0 4px 4px 0}
.art{display:flex;gap:14px;padding:14px;border:1px solid var(--line);background:var(--panel);
border-radius:10px;margin-bottom:10px}.art img{width:120px;height:80px;object-fit:cover;
border-radius:7px;background:#1d2230;flex:none}.art .t{font-weight:600;margin:0 0 4px}
.art .m{color:var(--mut);font-size:12px;margin-bottom:6px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.gal a img{width:100%;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--line)}
.body{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px 24px;
white-space:pre-wrap;max-width:760px}
.pill{font-size:11px;padding:1px 8px;border-radius:6px;border:1px solid var(--line)}
.pill.full{color:var(--good);border-color:#1e4a3a}.pill.meta{color:var(--mut)}
.pill.on{color:var(--good);border-color:#1e4a3a}.pill.off{color:var(--mut)}
.pill.soon{color:var(--warn);border-color:#4a3a1e}
.empty{color:var(--mut);padding:40px;text-align:center;border:1px dashed var(--line);border-radius:10px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px}
input,select,button{font:inherit;color:var(--ink);background:#0f1217;border:1px solid var(--line);
border-radius:8px;padding:8px 11px}button{cursor:pointer;background:#1d2230}
button.primary{background:var(--acc);color:#04121f;border-color:var(--acc);font-weight:600}
button.danger{color:var(--bad);border-color:#4a1e1e;background:#1d1417}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.flash{padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:13px}
.flash.ok{background:#10271f;color:var(--good)}.flash.err{background:#271414;color:var(--bad)}
form.inline{display:inline}.login{max-width:340px;margin:80px auto}
.login input{width:100%;margin-bottom:10px}
"""


def _esc(s) -> str:
    return html.escape(str(s if s is not None else ""))


def _fmt_dt(iso: str | None) -> str:
    if not iso:
        return "—"
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M")
    except (ValueError, AttributeError):
        return str(iso)[:16]


def _legal_pill(mode: str) -> str:
    cls = "full" if mode and mode != "metadata_only" else "meta"
    return f'<span class="pill {cls}">{_esc(mode)}</span>'


def _page(title: str, body: str, flash: tuple[str, str] | None = None) -> str:
    fl = (f"<div class='flash {flash[0]}'>{_esc(flash[1])}</div>" if flash else "")
    return (f"<!doctype html><html><head><meta charset=utf-8>"
            f"<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>{_esc(title)} · News backoffice</title><style>{CSS}</style></head><body>"
            f"<header><h1>📰 News Pipeline</h1>"
            f"<nav><a href='/'>Overview</a><a href='/sources'>Sources</a>"
            f"<a href='/images'>Images</a></nav>"
            f"<span class=right>{_esc(title)}"
            + ("" if not _key() else " · <a href='/logout'>logout</a>")
            + f"</span></header><div class=wrap>{fl}{body}</div></body></html>")


def render_run_card(data: dict) -> str:
    lr = data.get("last_run") or {}
    if is_running():
        status = "<span class='pill soon'>running…</span>"
    elif lr.get("ok") is True:
        status = "<span class='pill on'>last run ok</span>"
    elif lr.get("ok") is False:
        status = "<span class='pill off' style='color:var(--bad)'>last run failed</span>"
    else:
        status = "<span class='pill off'>never run here</span>"
    when = _fmt_dt(lr.get("finished") or lr.get("started"))
    log_link = " · <a href='/run/log'>view log</a>" if lr else ""
    opts = "".join(f"<option value='{s}'>{s}</option>"
                   for s in ("all", "rss", "gdelt", "cnv"))
    return (f"<div class=panel><div class=row style='justify-content:space-between'>"
            f"<div>{status} <span style='color:var(--mut)'>· {_esc(lr.get('source') or '—')} "
            f"· {when}{log_link}</span></div>"
            f"<form class=inline method=post action='/run'><div class=row>"
            f"<select name=source>{opts}</select>"
            f"<button class=primary type=submit"
            + (" disabled" if is_running() else "")
            + ">▶ Run fetch now</button></div></form></div></div>")


def render_overview(data: dict, source_filter: str | None) -> str:
    t = data["totals"]
    cards = [(t["articles"], "articles"), (t["sources"], "sources"),
             (t["images"], "images"), (t["with_body"], "with full text"),
             (t["rejected"], "rejected")]
    cards_html = "".join(
        f"<div class=card><div class=n>{n}</div><div class=l>{l}</div></div>"
        for n, l in cards)

    rows = "".join(
        f"<tr><td><a href='/?source={quote(s['source_name'])}'>{_esc(s['source_name'])}</a></td>"
        f"<td>{_esc(s['family'])}</td><td>{_legal_pill(s['legal_mode'])}</td>"
        f"<td class=num>{s['count']}</td><td class=num>{s['images']}</td>"
        f"<td>{_fmt_dt(s['latest'])}</td></tr>" for s in data["sources"])
    src_table = (
        "<table><tr><th>Source</th><th>Family</th><th>Legal</th><th class=num>Articles</th>"
        f"<th class=num>Images</th><th>Latest</th></tr>{rows}</table>" if data["sources"]
        else "<div class=empty>No articles ingested here yet — hit "
             "<b>Run fetch now</b> above, or add sources in "
             "<a href='/sources'>Sources</a>.</div>")

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
            f"· {_legal_pill(d.get('legal_mode'))}</div><div>{topics}</div></div></div>")
    filt = (f" — <a href='/'>{_esc(source_filter)} ✕</a>" if source_filter else "")
    arts_html = "".join(arts) or "<div class=empty>No articles.</div>"

    return (f"<div class=cards>{cards_html}</div>"
            f"<h2>Fetch</h2>{render_run_card(data)}"
            f"<h2>Sources</h2>{src_table}"
            f"<h2>Articles{filt}</h2>{arts_html}")


# Connectors that aren't per-feed editable (single, code-driven sources).
SYSTEM_CONNECTORS = [
    ("gdelt", "GDELT DOC 2.0 — wide media radar (AR, O&G query), metadata-only.", "active"),
    ("cnv", "CNV Hechos Relevantes — regulatory disclosures, fulltext_internal.", "active"),
]
COMING_SOON = [
    "Boletín Oficial (oficial)", "Secretaría de Energía / datos.gob.ar (oficial)",
    "Neuquén · Río Negro · Mendoza boletines (oficial_provincial)",
    "YPF · PAE · Tecpetrol newsrooms (corporativa)",
    "CEPH · IAPG (cámara)", "Podcasts: VM News Radio, Mejor Energía (podcast)",
]


def render_sources(data: dict) -> str:
    feeds = sources.all_feeds()
    counts = data["counts_by_name"]
    rows = ""
    for i, f in enumerate(feeds):
        en = f.get("enabled", True)
        st = f.get("status", "active")
        en_pill = (f"<span class='pill {'on' if en else 'off'}'>{'enabled' if en else 'disabled'}</span>"
                   if st == "active" else "<span class='pill soon'>coming soon</span>")
        region = ", ".join(f.get("region") or [])
        rows += (
            f"<tr><td>{_esc(f.get('source_name'))}<br>"
            f"<span style='color:var(--mut);font-size:11px'>{_esc(f.get('url'))}</span></td>"
            f"<td>{_esc(f.get('source_family'))}</td><td>{_legal_pill(f.get('legal_mode'))}</td>"
            f"<td>{_esc(region) or '—'}</td>"
            f"<td class=num>{counts.get(f.get('source_name'), 0)}</td>"
            f"<td>{en_pill}</td>"
            f"<td><form class=inline method=post action='/sources/edit'>"
            f"<input type=hidden name=action value=toggle>"
            f"<input type=hidden name=i value={i}>"
            f"<button type=submit>{'Disable' if en else 'Enable'}</button></form> "
            f"<form class=inline method=post action='/sources/edit' "
            f"onsubmit=\"return confirm('Delete this source?')\">"
            f"<input type=hidden name=action value=delete>"
            f"<input type=hidden name=i value={i}>"
            f"<button class=danger type=submit>Delete</button></form></td></tr>")
    feed_table = (
        "<table><tr><th>Source</th><th>Family</th><th>Legal</th><th>Region</th>"
        f"<th class=num>Articles</th><th>Status</th><th>Actions</th></tr>{rows}</table>"
        if feeds else "<div class=empty>No feeds configured.</div>")

    fam_opts = "".join(f"<option value='{s}'>{s}</option>"
                       for s in sorted(schema.SOURCE_FAMILIES))
    legal_opts = "".join(f"<option value='{s}'>{s}</option>"
                         for s in sorted(schema.LEGAL_MODES))
    add_form = (
        "<div class=panel><form method=post action='/sources/edit'>"
        "<input type=hidden name=action value=add>"
        "<div class=row>"
        "<input name=source_name placeholder='Source name' required style='flex:1;min-width:160px'>"
        "<input name=url placeholder='https://site/feed/' required style='flex:2;min-width:240px'>"
        "</div><div class=row style='margin-top:10px'>"
        f"<select name=source_family>{fam_opts}</select>"
        f"<select name=legal_mode>{legal_opts}</select>"
        "<input name=region placeholder='Region (optional, comma-sep)'>"
        "<button class=primary type=submit>+ Add RSS source</button>"
        "</div></form></div>")

    sysrows = "".join(
        f"<tr><td>{_esc(n)}</td><td style='color:var(--mut)'>{_esc(desc)}</td>"
        f"<td class=num>{counts.get(n, 0)}</td>"
        f"<td><span class='pill on'>{_esc(st)}</span></td></tr>"
        for n, desc, st in SYSTEM_CONNECTORS)
    sys_table = ("<table><tr><th>Connector</th><th>What</th><th class=num>Articles</th>"
                 f"<th>Status</th></tr>{sysrows}</table>")

    soon = "".join(f"<li>{_esc(x)}</li>" for x in COMING_SOON)

    return (f"<h2>Curated RSS feeds (editable)</h2>{feed_table}"
            f"<h2>Add a source</h2>{add_form}"
            f"<h2>System connectors</h2>{sys_table}"
            f"<h2>Coming soon</h2><div class=panel><ul style='margin:0;padding-left:18px;"
            f"color:var(--mut)'>{soon}</ul></div>")


def render_doc(data: dict, doc_id: str) -> str | None:
    doc = next((d for d in data["docs"] if d.get("doc_id") == doc_id), None)
    if not doc:
        return None
    imgs = _images(doc)
    img_html = "".join(f"<img src='{_esc(u)}' style='max-width:100%;border-radius:10px;"
                       f"margin:0 0 14px' alt=''>" for u in imgs)
    topics = "".join(f"<span class=tag>{_esc(x)}</span>" for x in (doc.get("topics") or []))
    ents = doc.get("entities") or {}
    ent_html = "".join(f"<div class=m><b>{_esc(k)}:</b> {_esc(', '.join(v))}</div>"
                       for k, v in ents.items() if v)
    body = doc.get("body_text") or doc.get("deck") or "(no body — metadata only)"
    meta = (f"{_esc(doc.get('source_name'))} · {_esc(doc.get('source_family'))} · "
            f"{_fmt_dt(doc.get('published_at'))} · {_legal_pill(doc.get('legal_mode'))}")
    return (f"<p><a href='/'>← back</a></p>"
            f"<h1 style='max-width:760px'>{_esc(doc.get('title'))}</h1>"
            f"<div class=m style='margin:-6px 0 16px;color:var(--mut)'>{meta} · "
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


def render_login(error: str | None = None) -> str:
    err = f"<div class='flash err'>{_esc(error)}</div>" if error else ""
    return (f"<div class=login><div class=panel>"
            f"<h2 style='margin-top:0'>Sign in</h2>{err}"
            f"<form method=post action='/login'>"
            f"<input name=user placeholder='User' autofocus>"
            f"<input name=password type=password placeholder='Password'>"
            f"<button class=primary type=submit style='width:100%'>Sign in</button>"
            f"</form></div></div>")


# ── sources mutations ────────────────────────────────────────────────────────


def apply_source_edit(form: dict) -> tuple[str, str]:
    """Mutate sources.json from a posted form. Returns (flash_kind, message)."""
    action = (form.get("action") or [""])[0]
    feeds = sources.all_feeds()
    if action == "add":
        name = (form.get("source_name") or [""])[0].strip()
        url = (form.get("url") or [""])[0].strip()
        fam = (form.get("source_family") or [""])[0].strip()
        legal = (form.get("legal_mode") or [""])[0].strip()
        if not (name and url.startswith("http")):
            return ("err", "Name and a valid http(s) URL are required.")
        if fam not in schema.SOURCE_FAMILIES:
            return ("err", f"Unknown family '{fam}'.")
        if legal not in schema.LEGAL_MODES:
            return ("err", f"Unknown legal mode '{legal}'.")
        if any(f.get("url") == url for f in feeds):
            return ("err", "That feed URL is already configured.")
        region = [r.strip() for r in (form.get("region") or [""])[0].split(",") if r.strip()]
        feeds.append({"url": url, "source_name": name, "source_family": fam,
                      "legal_mode": legal, "region": region,
                      "enabled": True, "status": "active"})
        sources.save(feeds)
        return ("ok", f"Added “{name}”.")

    try:
        i = int((form.get("i") or [""])[0])
        feed = feeds[i]
    except (ValueError, IndexError):
        return ("err", "Source not found.")
    if action == "toggle":
        feed["enabled"] = not feed.get("enabled", True)
        sources.save(feeds)
        return ("ok", f"{'Enabled' if feed['enabled'] else 'Disabled'} “{feed.get('source_name')}”.")
    if action == "delete":
        removed = feeds.pop(i)
        sources.save(feeds)
        return ("ok", f"Deleted “{removed.get('source_name')}”.")
    return ("err", "Unknown action.")


# ── server ───────────────────────────────────────────────────────────────────


def make_handler(out_dir: Path):
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

        def _redirect(self, location: str, cookie: str | None = None):
            h = {"Location": location}
            if cookie:
                h["Set-Cookie"] = cookie
            self._send("", 303, h)

        def _cookie(self, name: str) -> str | None:
            raw = self.headers.get("Cookie")
            if not raw:
                return None
            c = SimpleCookie()
            c.load(raw)
            return c[name].value if name in c else None

        def _authed(self) -> bool:
            return valid_session(self._cookie("sid"))

        def _form(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            return parse_qs(self.rfile.read(n).decode("utf-8")) if n else {}

        def _flash(self) -> tuple[str, str] | None:
            q = parse_qs(urlsplit(self.path).query)
            if "msg" in q:
                return (q.get("kind", ["ok"])[0], q["msg"][0])
            return None

        # — GET —
        def do_GET(self):  # noqa: N802
            path = urlsplit(self.path).path
            if path == "/healthz":
                self._send("ok")
                return
            if path == "/login":
                self._send(_page("login", render_login()))
                return
            if path == "/logout":
                self._redirect("/login", "sid=; Path=/; Max-Age=0")
                return
            if not self._authed():
                self._redirect("/login")
                return

            data = load(out_dir)
            if path == "/":
                src = parse_qs(urlsplit(self.path).query).get("source", [None])[0]
                self._send(_page("overview", render_overview(data, src), self._flash()))
            elif path == "/sources":
                self._send(_page("sources", render_sources(data), self._flash()))
            elif path == "/images":
                self._send(_page("images", render_images(data)))
            elif path == "/run/log":
                log = (out_dir / "last_run.log")
                txt = log.read_text(encoding="utf-8") if log.exists() else "(no run yet)"
                self._send(_page("run log",
                                 f"<p><a href='/'>← back</a></p><div class=body>{_esc(txt)}</div>"))
            elif path.startswith("/doc/"):
                doc_html = render_doc(data, path[len("/doc/"):])
                self._send(_page("article", doc_html), 200) if doc_html else \
                    self._send(_page("not found", "<div class=empty>Doc not found.</div>"), 404)
            else:
                self._send(_page("not found", "<div class=empty>Not found.</div>"), 404)

        # — POST —
        def do_POST(self):  # noqa: N802
            path = urlsplit(self.path).path
            if path == "/login":
                form = self._form()
                user = (form.get("user") or [""])[0]
                pw = (form.get("password") or [""])[0]
                if check_login(user, pw):
                    cookie = (f"sid={make_session()}; HttpOnly; Path=/; "
                              f"SameSite=Strict; Max-Age={7 * 86400}")
                    self._redirect("/", cookie)
                else:
                    self._send(_page("login", render_login("Wrong user or password.")), 401)
                return
            if not self._authed():
                self._redirect("/login")
                return

            if path == "/sources/edit":
                kind, msg = apply_source_edit(self._form())
                self._redirect(f"/sources?kind={kind}&msg={quote(msg)}")
            elif path == "/run":
                source = (self._form().get("source") or ["all"])[0]
                ok = trigger_run(out_dir, source)
                msg = "Fetch started." if ok else "A run is already in progress."
                self._redirect(f"/?kind={'ok' if ok else 'err'}&msg={quote(msg)}")
            else:
                self._send(_page("not found", "<div class=empty>Not found.</div>"), 404)

        def log_message(self, *a):
            pass

    return Handler


def serve(out_dir: Path, port: int) -> None:
    os.environ.setdefault("NEWS_OUT_DIR", str(out_dir))  # connector + subprocess agree
    if not _key():
        print("[dashboard] WARNING: DASHBOARD_PASS unset — UI is OPEN (local dev only)")
    httpd = ThreadingHTTPServer(("0.0.0.0", port), make_handler(out_dir))
    print(f"[dashboard] serving {out_dir} at http://localhost:{port}  (ctrl-c to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[dashboard] bye")


# ── self-check ───────────────────────────────────────────────────────────────


def _selfcheck() -> None:
    import tempfile
    docs = [
        {"doc_id": "a", "source_name": "EconoJournal", "source_family": "medio",
         "legal_mode": "fulltext_internal", "published_at": "2026-06-30T00:00:00+00:00",
         "retrieved_at": "2026-06-30T10:00:00+00:00", "body_text": "x",
         "attachments": [{"type": "image", "url": "http://i/1.jpg"}]},
        {"doc_id": "b", "source_name": "EconoJournal", "source_family": "medio",
         "legal_mode": "fulltext_internal", "retrieved_at": "2026-06-30T11:00:00+00:00"},
        {"doc_id": "c", "source_name": "Shale24", "source_family": "medio",
         "legal_mode": "metadata_only", "retrieved_at": "2026-06-30T09:00:00+00:00"},
    ]
    with tempfile.TemporaryDirectory() as td:
        out = Path(td)
        (out / "normalized").mkdir()
        (out / "normalized" / "news_documents.ndjson").write_text(
            "\n".join(json.dumps(d) for d in docs))
        (out / "emit_report.json").write_text('{"emitted":3,"rejected":1}')
        os.environ["NEWS_OUT_DIR"] = str(out)
        data = load(out)
        t = data["totals"]
        assert (t["articles"], t["sources"], t["images"], t["with_body"], t["rejected"]) \
            == (3, 2, 1, 1, 1), t
        assert data["counts_by_name"]["EconoJournal"] == 2
        assert render_doc(data, "a") and render_doc(data, "zzz") is None

        # sources roundtrip
        assert len(sources.active_feeds(out)) == 4  # seeded defaults
        k, m = apply_source_edit({"action": ["add"], "source_name": ["Test"],
                                  "url": ["https://t.example/feed"],
                                  "source_family": ["medio"],
                                  "legal_mode": ["metadata_only"], "region": ["Neuquén"]})
        assert k == "ok", (k, m)
        assert any(f["source_name"] == "Test" for f in sources.all_feeds(out))
        n = len(sources.all_feeds(out))
        apply_source_edit({"action": ["toggle"], "i": [str(n - 1)]})
        assert sources.all_feeds(out)[n - 1]["enabled"] is False
        apply_source_edit({"action": ["delete"], "i": [str(n - 1)]})
        assert len(sources.all_feeds(out)) == n - 1
        bad, _ = apply_source_edit({"action": ["add"], "source_name": ["x"],
                                    "url": ["nope"], "source_family": ["medio"],
                                    "legal_mode": ["metadata_only"]})
        assert bad == "err"

    # auth: signed session verifies, tamper fails
    os.environ["DASHBOARD_PASS"] = "secret"
    tok = make_session()
    assert valid_session(tok)
    assert not valid_session(tok + "x")
    assert not valid_session("999.deadbeef")
    assert check_login("admin", "secret") and not check_login("admin", "nope")
    del os.environ["DASHBOARD_PASS"]
    assert valid_session(None)  # auth disabled when key unset
    print("selfcheck ok")


def main() -> int:
    ap = argparse.ArgumentParser(description="News pipeline backoffice (v1).")
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
