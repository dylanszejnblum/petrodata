"""News ingest pipeline package.

Staged, resumable, mirrors the structured-data pipelines:

    sources
      ├─[1] stage1_fetch      → out/raw/<source>/<doc_id>.json + raw_manifest.json
      ├─[2] stage2_normalize  → out/normalized.ndjson   (raw → Document schema)
      ├─[3] stage3_enrich     → out/enriched.ndjson     (NER, topics, numbers) — stub
      ├─[4] stage4_dedup      → out/clustered.ndjson     (URL/SimHash/semantic) — minimal
      └─[5] stage5_emit       → out/normalized/news_documents.ndjson  ← backend ingests

Each connector keeps a watermark in out/state.json so a cron tick fetches only
new items. Orchestrated by run_news.py.
"""
