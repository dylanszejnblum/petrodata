#!/usr/bin/env sh
# Self-contained news-ingest cron loop.
#
# Runs the full pipeline (fetch → normalize → enrich → dedup → emit) and POSTs
# the result to the backend ingest endpoint, then sleeps. Keeps the container
# alive so Coolify can deploy it as a normal long-running app — no dependency
# on Coolify's Scheduled Tasks. A failed tick is logged and retried next round;
# connector watermarks (in NEWS_OUT_DIR) make each tick incremental.
set -eu

: "${BACKEND_INGEST_URL:?BACKEND_INGEST_URL is required (e.g. http://backend:3001/api/v1/news/ingest)}"
: "${NEWS_INGEST_TOKEN:?NEWS_INGEST_TOKEN is required (must match the backend's)}"

INTERVAL="${NEWS_INTERVAL_SECONDS:-21600}"   # default 6h
OUT_DIR="${NEWS_OUT_DIR:-/data/out_news}"     # mount a volume here to persist watermarks
LIMIT_ARG=""
[ -n "${NEWS_LIMIT:-}" ] && LIMIT_ARG="--limit ${NEWS_LIMIT}"

echo "[news-cron] interval=${INTERVAL}s out=${OUT_DIR} target=${BACKEND_INGEST_URL}"

while true; do
  echo "[news-cron] $(date -u +%Y-%m-%dT%H:%M:%SZ) run start"
  if python run_news.py --out "${OUT_DIR}" ${LIMIT_ARG} \
       --post-to "${BACKEND_INGEST_URL}" --token "${NEWS_INGEST_TOKEN}"; then
    echo "[news-cron] run ok"
  else
    echo "[news-cron] run FAILED (continuing; will retry next tick)"
  fi
  echo "[news-cron] sleep ${INTERVAL}s"
  sleep "${INTERVAL}"
done
