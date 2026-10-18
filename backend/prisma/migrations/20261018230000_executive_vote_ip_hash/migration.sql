-- AlterTable
ALTER TABLE "executive_vote" ADD COLUMN "ip_hash" TEXT;

-- CreateIndex
CREATE INDEX "executive_vote_ip_hash_week_start_idx" ON "executive_vote"("ip_hash", "week_start");
