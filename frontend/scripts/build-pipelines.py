#!/usr/bin/env python3
"""Build the Argentine trunk-pipeline overlay from official Secretaría de Energía /
ENARGAS open data.

Sources (datos.energia.gob.ar):
  - Gasoductos de Transporte (ENARGAS)  — trunk gas pipelines, geometry in a WGS84
    shapefile. Dataset: transporte-hidrocarburos-ductos-troncales-gasoductos.
  - Ductos de hidrocarburos y agua (Res. 319/93) — national duct declarations; we
    keep only the OLEODUCTO segments classified TRONCAL (the main oil arteries).
    The geometry is embedded as a `geojson` column in the CSV.

Neither dataset carries throughput/capacity — only geometry + physical specs — so
the overlay is honest about what it shows: operator, type, diameter (oil), length.

Outputs (regenerate after the upstream datasets refresh):
  - public/data/ar-pipelines.geojson                              (map overlay)
  - src/components/Petrodata/indicadores/pipelineStats.ts         (indicador block)

Run:  python3 scripts/build-pipelines.py
Deps: pyshp  (pip install pyshp)
"""

from __future__ import annotations

import csv
import io
import json
import math
import os
import sys
import urllib.request
import zipfile

import shapefile  # pyshp

csv.field_size_limit(10**9)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GEOJSON_OUT = os.path.join(ROOT, "public", "data", "ar-pipelines.geojson")
STATS_OUT = os.path.join(
    ROOT, "src", "components", "Petrodata", "indicadores", "pipelineStats.ts"
)

GAS_SHP_ZIP = (
    "http://datos.energia.gob.ar/dataset/8758101a-1e0d-413f-8cc5-83e21ece6391/"
    "resource/5af07e15-f356-40b9-a369-63dbf38a938a/download/"
    "gasoductos-de-transporte-enargas-.zip"
)
OIL_CSV = (
    "http://datos.energia.gob.ar/dataset/84681f81-dbbb-49eb-be30-e61778736ad9/"
    "resource/857bd3ad-9a8b-4cf9-8e25-a8bc73f3282f/download/"
    "instalaciones-hidrocarburos-ductos-res-319-93.csv"
)
# Gas compressor plants (ENARGAS) — the infrastructure "nodes" along the trunk
# lines. Point geometry embedded in the CSV's `geojson` column (WGS84).
NODES_CSV = (
    "http://datos.energia.gob.ar/dataset/8758101a-1e0d-413f-8cc5-83e21ece6391/"
    "resource/7b0c0bc3-4bc5-4aac-8004-348619a39c26/download/"
    "plantas-compresoras-de-transporte-de-gas-enargas-.csv"
)

SOURCE_LABEL = "Secretaría de Energía · ENARGAS"
SOURCE_URL = "https://datos.energia.gob.ar/dataset/transporte-hidrocarburos-ductos-troncales-gasoductos"
AS_OF = "2024"  # upstream snapshot year; bump on regeneration

# Geometry simplification: at the country/basin zoom levels this overlay is viewed,
# ~550 m tolerance is invisible, and it cuts the artifact from ~28 MB to ~1 MB.
SIMPLIFY_EPS = 0.005  # degrees (~550 m)
COORD_DECIMALS = 5  # ~1.1 m, ample for trunk lines

# Oil: the 319/93 `trdu="TRONCAL"` tag is sparsely applied and misses real
# long-haul lines (Oldelval, OTASA, Trasandino…), so we also keep any OLEODUCTO
# segment longer than this — long enough to be transport, not an in-field flowline.
OIL_MIN_KM = 15.0


def fetch(url: str) -> bytes:
    print(f"  GET {url.split('/')[-1]}")
    req = urllib.request.Request(url, headers={"User-Agent": "vacamuerta-pipelines/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def haversine_km(a, b) -> float:
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    dlon, dlat = lon2 - lon1, lat2 - lat1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371.0088 * 2 * math.asin(math.sqrt(h))


def line_length_km(coords) -> float:
    return sum(haversine_km(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def geom_length_km(geom) -> float:
    """Cheap full-resolution length (no simplification) for filtering decisions."""
    t = geom["type"]
    lines = geom["coordinates"] if t == "MultiLineString" else [geom["coordinates"]]
    total = 0.0
    for ln in lines:
        pts = [[float(x), float(y)] for x, y in ln]
        if len(pts) >= 2:
            total += line_length_km(pts)
    return total


def rdp(pts, eps):
    """Ramer–Douglas–Peucker on a single ring of [lon,lat] points."""
    if len(pts) < 3:
        return pts

    def perp(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return math.hypot(x - x1, y - y1)
        t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))
        return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))

    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = perp(pts[i], pts[0], pts[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[: idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def round_pt(p):
    return [round(p[0], COORD_DECIMALS), round(p[1], COORD_DECIMALS)]


def simplify_multiline(geom):
    """Return (simplified MultiLineString geometry, full-resolution length in km)."""
    t = geom["type"]
    lines = geom["coordinates"] if t == "MultiLineString" else [geom["coordinates"]]
    out, total_km = [], 0.0
    for ln in lines:
        pts = [[float(x), float(y)] for x, y in ln]
        if len(pts) < 2:
            continue
        total_km += line_length_km(pts)
        simp = [round_pt(p) for p in rdp(pts, SIMPLIFY_EPS)]
        out.append(simp)
    return {"type": "MultiLineString", "coordinates": out}, total_km


def short_operator(name: str) -> str:
    """Compact licenciataria names for chips/leaderboards."""
    if not name:
        return "Sin datos"
    n = name.strip()
    table = {
        "Transportadora de Gas del Sur S.A.": "TGS",
        "Transportadora de Gas del Norte S.A.": "TGN",
        "Transportadora de Gas del Sur S.A. / Transportadora de Gas del Norte S.A.": "TGS / TGN",
        "Gasoducto Gasandes Argentina S.A.": "GasAndes",
        "Gasoducto Nor Andino Argentina S.A.": "Nor Andino",
        "Gasoducto Atacama Argentina S.A.": "Atacama",
        "Gas del Pacífico": "Gas del Pacífico",
        "Cruz del Sur S.A.": "Cruz del Sur",
    }
    return table.get(n, n)


def build_gas(features, operator_km):
    raw = fetch(GAS_SHP_ZIP)
    zf = zipfile.ZipFile(io.BytesIO(raw))
    base = next(n[:-4] for n in zf.namelist() if n.endswith(".shp"))
    rdr = shapefile.Reader(
        shp=io.BytesIO(zf.read(base + ".shp")),
        dbf=io.BytesIO(zf.read(base + ".dbf")),
        shx=io.BytesIO(zf.read(base + ".shx")),
        encoding="utf-8",  # .cpg declares UTF-8
    )
    flds = [f[0] for f in rdr.fields[1:]]
    n = 0
    for sr in rdr.shapeRecords():
        rec = dict(zip(flds, list(sr.record)))
        geom = sr.shape.__geo_interface__
        if geom["type"] not in ("LineString", "MultiLineString"):
            continue
        simp, km = simplify_multiline(geom)
        if not simp["coordinates"]:
            continue
        operator_full = (rec.get("EMPRESA_LI") or "").strip()
        op = short_operator(operator_full)
        subtype = (rec.get("SUBTIPO_DE") or "").strip() or "Sin determinar"
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "kind": "gas",
                    "name": (rec.get("NOMBRE") or "").strip(),
                    "tramo": (rec.get("NOMBRE_DE_") or "").strip() or None,
                    "operator": op,
                    "operator_full": operator_full or None,
                    "subtype": subtype,
                    "diameter_in": None,
                    "length_km": round(km, 1),
                },
                "geometry": simp,
            }
        )
        # Only count realised (non-projected) trunk km toward the operator network.
        if subtype.lower() != "proyecto":
            operator_km[op] = operator_km.get(op, 0.0) + km
        n += 1
    print(f"  gas trunk segments: {n}")


def build_oil(features):
    raw = fetch(OIL_CSV).decode("utf-8-sig")
    n = 0
    for row in csv.DictReader(io.StringIO(raw)):
        if row.get("tipo") != "OLEODUCTO":
            continue
        g = (row.get("geojson") or "").strip()
        if not g:
            continue
        try:
            geom = json.loads(g)
        except json.JSONDecodeError:
            continue
        # Cheap length first, so we only simplify (expensive) the segments we keep.
        is_troncal = row.get("trdu") == "TRONCAL"
        if not is_troncal and geom_length_km(geom) < OIL_MIN_KM:
            continue
        simp, km = simplify_multiline(geom)
        if not simp["coordinates"]:
            continue
        diam = None
        try:
            d = float(row.get("diametro") or 0)
            diam = round(d, 1) if d > 0 else None
        except ValueError:
            pass
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "kind": "oil",
                    "name": (row.get("du") or "").strip(),
                    "tramo": None,
                    "operator": (row.get("empresa_informante") or "").strip() or None,
                    "operator_full": (row.get("empresa_informante") or "").strip() or None,
                    "subtype": "Troncal" if is_troncal else "Transporte",
                    "diameter_in": diam,
                    "length_km": round(km, 1),
                },
                "geometry": simp,
            }
        )
        n += 1
    print(f"  oil trunk segments: {n}")


def build_nodes(features):
    raw = fetch(NODES_CSV).decode("utf-8-sig")
    n = 0
    for row in csv.DictReader(io.StringIO(raw)):
        g = (row.get("geojson") or "").strip()
        if not g:
            continue
        try:
            geom = json.loads(g)
        except json.JSONDecodeError:
            continue
        if geom.get("type") != "Point" or len(geom.get("coordinates") or []) < 2:
            continue
        geom["coordinates"] = round_pt(geom["coordinates"])
        operator_full = (row.get("licenciataria") or "").strip()
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "kind": "node",
                    "name": (row.get("nombre") or "").strip(),
                    "gasoducto": (row.get("gasoducto") or "").strip() or None,
                    "tramo": (row.get("tramo") or "").strip() or None,
                    "operator": short_operator(operator_full),
                    "operator_full": operator_full or None,
                },
                "geometry": geom,
            }
        )
        n += 1
    print(f"  gas compressor nodes: {n}")


def write_stats(features, operator_km):
    gas = [f for f in features if f["properties"]["kind"] == "gas"]
    oil = [f for f in features if f["properties"]["kind"] == "oil"]
    gas_km = sum(
        f["properties"]["length_km"]
        for f in gas
        if f["properties"]["subtype"].lower() != "proyecto"
    )
    oil_km = sum(f["properties"]["length_km"] for f in oil)
    operators = sorted(
        (
            {"operator": k, "km": round(v)}
            for k, v in operator_km.items()
            if k != "Sin datos" and v >= 50
        ),
        key=lambda x: -x["km"],
    )
    payload = {
        "totalKm": round(gas_km + oil_km),
        "gasKm": round(gas_km),
        "oilKm": round(oil_km),
        "gasSegments": len(gas),
        "oilSegments": len(oil),
        "operators": operators,
        "source": {"label": SOURCE_LABEL, "url": SOURCE_URL, "asOf": AS_OF},
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    ts = (
        "// AUTO-GENERATED by scripts/build-pipelines.py — do not edit by hand.\n"
        "// Aggregates of Argentina's trunk pipeline network (km by transport\n"
        "// operator + totals), derived from the official Secretaría de Energía /\n"
        "// ENARGAS open datasets. Regenerate when the upstream data refreshes.\n\n"
        "export interface PipelineOperatorKm {\n"
        "  operator: string\n"
        "  km: number\n"
        "}\n\n"
        "export interface PipelineStats {\n"
        "  totalKm: number\n"
        "  gasKm: number\n"
        "  oilKm: number\n"
        "  gasSegments: number\n"
        "  oilSegments: number\n"
        "  operators: PipelineOperatorKm[]\n"
        "  source: { label: string; url: string; asOf: string }\n"
        "}\n\n"
        f"export const PIPELINE_STATS: PipelineStats = {body}\n"
    )
    with open(STATS_OUT, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"  wrote {os.path.relpath(STATS_OUT, ROOT)}")
    return payload


def main():
    features, operator_km = [], {}
    print("Gas (ENARGAS):")
    build_gas(features, operator_km)
    print("Oil (Res. 319/93):")
    build_oil(features)
    print("Nodes (ENARGAS compressor plants):")
    build_nodes(features)

    os.makedirs(os.path.dirname(GEOJSON_OUT), exist_ok=True)
    fc = {
        "type": "FeatureCollection",
        "metadata": {"source": SOURCE_LABEL, "url": SOURCE_URL, "asOf": AS_OF},
        "features": features,
    }
    with open(GEOJSON_OUT, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = os.path.getsize(GEOJSON_OUT) // 1024
    print(f"  wrote {os.path.relpath(GEOJSON_OUT, ROOT)} ({len(features)} features, {size_kb} KB)")

    stats = write_stats(features, operator_km)
    print(
        f"Done. network {stats['totalKm']:,} km "
        f"(gas {stats['gasKm']:,} / oil {stats['oilKm']:,})."
    )


if __name__ == "__main__":
    main()
