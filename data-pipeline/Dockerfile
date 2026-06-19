# syntax=docker/dockerfile:1
# News-ingest cron worker for Coolify.
# Builds a uv-managed env and runs run-news-cron (loop → pipeline → POST backend).
FROM python:3.11-slim

# uv binary (no pip bootstrap needed)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies first (cached layer). --no-install-project: this project
# has no build backend and the news pipeline imports by path, so we only need deps.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Only the files the news pipeline needs (keeps the image lean; see .dockerignore)
COPY news_schema.py run_news.py ./
COPY pipeline_news ./pipeline_news
COPY docker/run-news-cron.sh /usr/local/bin/run-news-cron
RUN chmod +x /usr/local/bin/run-news-cron && mkdir -p /data

# Default config (override in Coolify env). BACKEND_INGEST_URL + NEWS_INGEST_TOKEN are required.
ENV NEWS_INTERVAL_SECONDS=21600 \
    NEWS_OUT_DIR=/data/out_news

CMD ["run-news-cron"]
