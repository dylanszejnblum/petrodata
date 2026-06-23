-- CreateTable
CREATE TABLE "fact_world_production" (
    "id" SERIAL NOT NULL,
    "product" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "fact_world_production_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_world_production_product_period_idx" ON "fact_world_production"("product", "period");

-- CreateIndex
CREATE UNIQUE INDEX "fact_world_production_product_iso3_period_key" ON "fact_world_production"("product", "iso3", "period");
