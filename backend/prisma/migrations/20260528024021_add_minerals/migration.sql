-- CreateTable
CREATE TABLE "mining_project" (
    "id" SERIAL NOT NULL,
    "project_name" TEXT NOT NULL,
    "primary_commodity" TEXT NOT NULL,
    "by_products" TEXT,
    "status" TEXT,
    "deposit_type" TEXT,
    "owner_controller" TEXT,
    "operator" TEXT,
    "area_ha" DOUBLE PRECISION,
    "province" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "since_production" INTEGER,
    "estimated_lom_years" INTEGER,
    "productive_capacity" TEXT,
    "estimated_annual_production" TEXT,
    "capex" TEXT,
    "mining_method" TEXT,
    "product" TEXT,
    "source_pipeline" TEXT,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resources" JSONB,
    "reserves" JSONB,

    CONSTRAINT "mining_project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mining_project_project_name_key" ON "mining_project"("project_name");

-- CreateIndex
CREATE INDEX "mining_project_primary_commodity_idx" ON "mining_project"("primary_commodity");

-- CreateIndex
CREATE INDEX "mining_project_status_idx" ON "mining_project"("status");

-- CreateIndex
CREATE INDEX "mining_project_province_idx" ON "mining_project"("province");
