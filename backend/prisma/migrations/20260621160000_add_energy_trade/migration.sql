-- CreateTable
CREATE TABLE "fact_energy_trade" (
    "id" SERIAL NOT NULL,
    "period" DATE NOT NULL,
    "granularity" TEXT NOT NULL,
    "energy_exports_usd" DOUBLE PRECISION,
    "energy_imports_usd" DOUBLE PRECISION,
    "energy_surplus_usd" DOUBLE PRECISION,
    "agro_exports_usd" DOUBLE PRECISION,
    "source_label" TEXT NOT NULL,
    "source_url" TEXT,
    "source_as_of" TEXT,

    CONSTRAINT "fact_energy_trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_energy_trade_granularity_period_idx" ON "fact_energy_trade"("granularity", "period");

-- CreateIndex
CREATE UNIQUE INDEX "fact_energy_trade_period_granularity_key" ON "fact_energy_trade"("period", "granularity");
