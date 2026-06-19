"""Source connectors. One module per source family.

A connector module must expose:

    NAME: str                      — stable key, used in paths/state
    fetch(state, limit) -> (raws, new_state)
        state:  the connector's slice of out/state.json (its watermark)
        raws:   list of raw dicts; each MUST carry a 'source_url' key
        new_state: updated watermark to persist
    normalize(raw) -> dict         — raw dict → Document (news_schema.make_doc)

Add a source by writing the module and registering it in CONNECTORS below.
Stages 1–5 never change when a connector is added.
"""

from __future__ import annotations

from . import gdelt
from . import rss
from . import cnv

# name → module
CONNECTORS = {
    gdelt.NAME: gdelt,
    rss.NAME: rss,
    cnv.NAME: cnv,
}
