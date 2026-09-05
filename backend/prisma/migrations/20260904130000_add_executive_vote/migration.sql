-- CreateTable
CREATE TABLE "executive_vote" (
    "id" SERIAL NOT NULL,
    "voter_hash" TEXT NOT NULL,
    "company_slug" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "vote_day" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "executive_vote_voter_hash_company_slug_week_start_key" ON "executive_vote"("voter_hash", "company_slug", "week_start");

-- CreateIndex
CREATE INDEX "executive_vote_week_start_idx" ON "executive_vote"("week_start");

-- CreateIndex
CREATE INDEX "executive_vote_vote_day_idx" ON "executive_vote"("vote_day");

-- CreateIndex
CREATE INDEX "executive_vote_company_slug_idx" ON "executive_vote"("company_slug");
