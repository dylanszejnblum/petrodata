-- CreateTable
CREATE TABLE "news_document" (
    "doc_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_family" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "discovered_via" TEXT,
    "retrieved_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "event_date" DATE,
    "title" TEXT NOT NULL,
    "deck" TEXT,
    "body_text" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "region" TEXT[],
    "geo" JSONB NOT NULL,
    "entities" JSONB NOT NULL,
    "topics" TEXT[],
    "signals" JSONB NOT NULL,
    "numbers" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "cluster_id" TEXT,
    "novelty_score" DOUBLE PRECISION,
    "importance_score" DOUBLE PRECISION,
    "legal_mode" TEXT NOT NULL,
    "editor_notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_document_pkey" PRIMARY KEY ("doc_id")
);

-- CreateIndex
CREATE INDEX "news_document_published_at_idx" ON "news_document"("published_at");

-- CreateIndex
CREATE INDEX "news_document_source_family_idx" ON "news_document"("source_family");

-- CreateIndex
CREATE INDEX "news_document_cluster_id_idx" ON "news_document"("cluster_id");

-- CreateIndex
CREATE INDEX "news_document_legal_mode_idx" ON "news_document"("legal_mode");
