-- CreateTable
CREATE TABLE "rigi_project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "operator" TEXT,
    "province" TEXT,
    "investment_musd" DOUBLE PRECISION,
    "approval_date" DATE,
    "source_label" TEXT,
    "source_url" TEXT,

    CONSTRAINT "rigi_project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rigi_project_name_key" ON "rigi_project"("name");

-- CreateIndex
CREATE INDEX "rigi_project_sector_idx" ON "rigi_project"("sector");
