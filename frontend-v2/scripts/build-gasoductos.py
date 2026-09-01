#!/usr/bin/env python3
"""Traza de los gasoductos de transporte, para dibujarlos en el mapa.

frontend/scripts/build-pipelines.py ya bajaba este mismo shapefile, pero sólo
para MEDIRLO: «geometry is read for measurement and then discarded — nothing is
written to /public». Los kilómetros por operador de la sección 13 salen de ahí.
Este script se queda con la geometría.

Fuente: Secretaría de Energía / ENARGAS, «Gasoductos de transporte», shapefile
en WGS84. 296 tramos con NOMBRE, EMPRESA_LI (la licenciataria) y SUBTIPO_DE
(Troncal, Loop, Paralelo, Proyecto).

Salida: public/data/gasoductos.geojson

Uso:   python3 scripts/build-gasoductos.py
Deps:  pyshp   (pip install pyshp)
"""

from __future__ import annotations

import io
import json
import math
import os
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict

import shapefile  # pyshp

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
SALIDA = os.path.join(RAIZ, "public", "data", "gasoductos.geojson")

ZIP = (
    "http://datos.energia.gob.ar/dataset/8758101a-1e0d-413f-8cc5-83e21ece6391/"
    "resource/5af07e15-f356-40b9-a369-63dbf38a938a/download/"
    "gasoductos-de-transporte-enargas-.zip"
)
BASE = "gasoductos-de-transporte-enargas--shp"
FUENTE = "Secretaría de Energía · ENARGAS"

# Simplificación Douglas-Peucker. El archivo crudo trae 655.800 puntos —un
# tramo del Gasoducto Norte tiene 181.613 él solo— y a los zooms a los que se
# mira este mapa (país y cuenca) esa densidad no se ve. 0,004° son unos 440 m.
EPS = 0.001

# Los 44 NOMBRE del shapefile son tramos administrativos, no gasoductos: el
# Norte aparece como N1T, N1P, N1L, N2P, N3P y N4T, y el Centro Oeste como C1T,
# C1P, C2T, C3T, C1L, C2P y C3L. Nadie llama así a un gasoducto.
#
# Se agrupan por el sistema que la gente sí nombra. Las reglas van explícitas y
# en orden: la primera que matchea gana, y lo que no matchea queda con su
# nombre propio, así un gasoducto nuevo en la fuente aparece solo en vez de
# caer en un cajón «otros».
SISTEMAS: list[tuple[str, str]] = [
    (r"^N\d.*Gto\. Norte", "Gasoducto Norte"),
    (r"^C\d.*Gto\. Centro Oeste", "Gasoducto Centro Oeste"),
    (r"^F1.*San Jerónimo - Santa Fe", "San Jerónimo – Santa Fe"),
    (r"^U\d.*Uruguayana", "Gasoducto Uruguayana"),
    (r"^General San Martin", "Gasoducto General San Martín"),
    (r"^Neuba", "Neuba"),
    (r"^Nestor Kirchner", "Perito Moreno (ex Néstor Kirchner)"),
]

# El nombre corto de cada licenciataria, para el badge de la fila.
OPERADOR = {
    "Transportadora de Gas del Sur S.A.": "TGS",
    "Transportadora de Gas del Norte S.A.": "TGN",
    "Transportadora de Gas del Sur S.A. / Transportadora de Gas del Norte S.A.": "TGS / TGN",
    "Gasoducto Atacama Argentina S.A.": "Atacama",
    "Gasoducto Nor Andino Argentina S.A.": "Nor Andino",
    "Gasoducto Gasandes Argentina S.A.": "GasAndes",
    "Gas del Pacífico": "Gas del Pacífico",
    "Cruz del Sur S.A.": "Cruz del Sur",
    "Sin datos": "sin operador declarado",
}


def sistema(nombre: str) -> str:
    for patron, rot in SISTEMAS:
        if re.search(patron, nombre):
            return rot
    return nombre


def largo_km(pts: list[tuple[float, float]]) -> float:
    """Largo de una polilínea en km, con la corrección de coseno por latitud."""
    total = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        lat = math.radians((y1 + y2) / 2)
        total += math.hypot((x2 - x1) * 111.32 * math.cos(lat), (y2 - y1) * 110.57)
    return total


def coser(partes: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Une los tramos sueltos en polilíneas continuas.

    Sin esto la simplificación no hace nada, y cuesta un rato darse cuenta: el
    shapefile NO trae polilíneas. Trae 45.705 partes de las cuales 45.167 son
    segmentos de DOS puntos —un traza dibujada punto contra punto— y
    Douglas-Peucker sobre una recta de dos puntos devuelve la misma recta. Con
    el archivo tal como viene, subir la tolerancia de 0,004° a 0,015° sacaba
    mil puntos de noventa y tres mil.

    Se arma un grafo con los extremos como nodos —redondeados a 5 decimales,
    que es un metro, porque los extremos que se tocan no son bit a bit
    idénticos— y se recorren cadenas maximales. Arranca por los nodos de grado
    1, que son las puntas reales de la red; lo que quede sin visitar después
    son ciclos, y esos arrancan por cualquier lado.
    """
    clave = lambda p: (round(p[0], 5), round(p[1], 5))
    ady: dict[tuple, list[int]] = defaultdict(list)
    for i, tr in enumerate(partes):
        ady[clave(tr[0])].append(i)
        ady[clave(tr[-1])].append(i)

    usado = [False] * len(partes)
    cadenas: list[list[tuple[float, float]]] = []

    def caminar(inicio: tuple, i0: int) -> list[tuple[float, float]]:
        tr = partes[i0]
        if clave(tr[0]) != inicio:
            tr = tr[::-1]
        usado[i0] = True
        cadena = list(tr)
        while True:
            fin = clave(cadena[-1])
            sig = next((j for j in ady[fin] if not usado[j]), None)
            if sig is None:
                return cadena
            t = partes[sig]
            if clave(t[0]) != fin:
                t = t[::-1]
            usado[sig] = True
            cadena.extend(t[1:])

    # Primero las puntas: una cadena que arranca en el medio se parte en dos.
    for nodo, incidentes in ady.items():
        if len(incidentes) != 1:
            continue
        i = incidentes[0]
        if not usado[i]:
            cadenas.append(caminar(nodo, i))
    # Lo que queda son ciclos o tramos con los dos extremos compartidos.
    for i, tr in enumerate(partes):
        if not usado[i]:
            cadenas.append(caminar(clave(tr[0]), i))
    return cadenas


def dp(pts: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    """Douglas-Peucker iterativo. Recursivo se pasa del límite de pila con los
    tramos de 181.613 puntos."""
    if len(pts) < 3:
        return pts
    guarda = [False] * len(pts)
    guarda[0] = guarda[-1] = True
    pila = [(0, len(pts) - 1)]
    while pila:
        i, j = pila.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        peor, k = -1.0, i
        for m in range(i + 1, j):
            px, py = pts[m]
            if norm == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > peor:
                peor, k = d, m
        if peor > eps:
            guarda[k] = True
            pila.append((i, k))
            pila.append((k, j))
    return [p for p, g in zip(pts, guarda) if g]


def main() -> int:
    print(f"bajando {ZIP.rsplit('/', 1)[-1]} …")
    with urllib.request.urlopen(ZIP, timeout=300) as resp:
        z = zipfile.ZipFile(io.BytesIO(resp.read()))
    r = shapefile.Reader(
        shp=io.BytesIO(z.read(BASE + ".shp")),
        dbf=io.BytesIO(z.read(BASE + ".dbf")),
        shx=io.BytesIO(z.read(BASE + ".shx")),
    )
    campos = [f[0] for f in r.fields[1:]]
    print(f"  {len(r)} tramos · {r.shapeTypeName}")

    acum: dict[str, dict] = defaultdict(
        lambda: {"km": 0.0, "tramos": 0, "partes": [], "lineas": [], "ops": defaultdict(float),
                 "subs": defaultdict(int), "crudos": 0}
    )

    for sr in r.shapeRecords():
        d = dict(zip(campos, sr.record))
        clave = sistema(str(d["NOMBRE"]).strip())
        e = acum[clave]
        partes = list(sr.shape.parts) + [len(sr.shape.points)]
        for a, b in zip(partes, partes[1:]):
            pts = [(round(x, 5), round(y, 5)) for x, y in sr.shape.points[a:b]]
            if len(pts) < 2:
                continue
            # Los km se miden sobre la traza CRUDA. Simplificada, una curva
            # cortada por la cuerda mide menos, y el largo es un dato.
            e["km"] += largo_km(pts)
            e["crudos"] += len(pts)
            e["partes"].append(pts)
        e["tramos"] += 1
        e["ops"][OPERADOR.get(str(d["EMPRESA_LI"]).strip(), str(d["EMPRESA_LI"]).strip())] += 1
        e["subs"][str(d["SUBTIPO_DE"]).strip()] += 1

    for e in acum.values():
        e["lineas"] = [dp(c, EPS) for c in coser(e["partes"])]

    feats = []
    for clave, e in sorted(acum.items(), key=lambda x: -x[1]["km"]):
        op = max(e["ops"].items(), key=lambda x: x[1])[0]
        feats.append({
            "type": "Feature",
            "properties": {
                "id": re.sub(r"[^a-z0-9]+", "-", clave.lower()).strip("-"),
                "nombre": clave,
                "operador": op,
                # Si un sistema tiene tramos de más de una licenciataria se
                # dice, en vez de atribuirlo entero al que más tramos aporta.
                "operadores": sorted(e["ops"], key=lambda o: -e["ops"][o]),
                "km": round(e["km"]),
                "tramos": e["tramos"],
                "subtipos": dict(sorted(e["subs"].items(), key=lambda x: -x[1])),
            },
            "geometry": {"type": "MultiLineString", "coordinates": e["lineas"]},
        })

    doc = {
        "type": "FeatureCollection",
        "properties": {
            "fuente": FUENTE,
            "url": "https://datos.energia.gob.ar/dataset/transporte-hidrocarburos-ductos-troncales-gasoductos",
            "simplificacion_grados": EPS,
        },
        "features": feats,
    }

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, separators=(",", ":"))

    crudos = sum(e["crudos"] for e in acum.values())
    simpl = sum(len(l) for e in acum.values() for l in e["lineas"])
    peso = os.path.getsize(SALIDA)
    print(f"\n  {len(feats)} sistemas · {sum(f['properties']['km'] for f in feats):,} km")
    print(f"  puntos {crudos:,} → {simpl:,}  ({simpl/crudos*100:.1f}%)")
    print(f"  {SALIDA}  ({peso/1024:.0f} kB)")
    for f in feats:
        p = f["properties"]
        print(f"    {p['km']:>6,} km · {p['tramos']:>2} tr · {p['operador']:<18} {p['nombre']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
