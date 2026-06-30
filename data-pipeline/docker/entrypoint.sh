#!/usr/bin/env sh
# One container, two jobs: the news-ingest cron loop (background) + the
# read-only backoffice web UI (foreground). Both read/write the same
# NEWS_OUT_DIR volume, so the UI always shows the latest tick.
#
# The dashboard is the foreground process: if it dies the container dies and
# Coolify restarts it. The cron loop self-heals per tick (own `while true`),
# so a single failed ingest never takes the container down.
# ponytail: no supervisor — if the backgrounded cron loop itself ever exits,
# ingest stops silently until the next deploy. Add a supervisor only if that
# actually happens.
set -eu

run-news-cron &

exec python dashboard.py \
  --out "${NEWS_OUT_DIR:-/data/out_news}" \
  --port "${DASHBOARD_PORT:-8800}"
