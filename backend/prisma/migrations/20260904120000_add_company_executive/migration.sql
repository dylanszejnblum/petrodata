-- CreateTable
CREATE TABLE "company_executive" (
    "company_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "source_date" DATE,
    "in_role_since" TEXT,
    "bio" TEXT,
    "photo_url" TEXT,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_executive_pkey" PRIMARY KEY ("company_slug")
);

-- CreateIndex
CREATE INDEX "company_executive_confirmed_idx" ON "company_executive"("confirmed");
