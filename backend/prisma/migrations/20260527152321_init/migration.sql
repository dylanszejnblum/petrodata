-- CreateTable
CREATE TABLE "dim_operator" (
    "operator_slug" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "aliases" TEXT NOT NULL,

    CONSTRAINT "dim_operator_pkey" PRIMARY KEY ("operator_slug")
);

-- CreateTable
CREATE TABLE "dim_formation" (
    "formation_slug" TEXT NOT NULL,
    "formation_name" TEXT NOT NULL,
    "formation_vaca_muerta" BOOLEAN NOT NULL,

    CONSTRAINT "dim_formation_pkey" PRIMARY KEY ("formation_slug")
);

-- CreateTable
CREATE TABLE "dim_well" (
    "well_id" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "operator_slug" TEXT NOT NULL,
    "formation_slug" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "basin" TEXT NOT NULL,
    "concession" TEXT NOT NULL,
    "yacimiento" TEXT NOT NULL,
    "well_type" TEXT NOT NULL,
    "extraction_type" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "sub_resource_type" TEXT NOT NULL,
    "depth_m" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "dim_well_pkey" PRIMARY KEY ("well_id")
);

-- CreateTable
CREATE TABLE "fact_production_monthly" (
    "id" SERIAL NOT NULL,
    "date_month" DATE NOT NULL,
    "well_id" TEXT NOT NULL,
    "operator_slug" TEXT NOT NULL,
    "formation_slug" TEXT NOT NULL,
    "concession" TEXT NOT NULL,
    "yacimiento" TEXT NOT NULL,
    "basin" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "well_type" TEXT NOT NULL,
    "extraction_type" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "tipo_recurso" TEXT NOT NULL,
    "depth_m" DOUBLE PRECISION,
    "coord_x" DOUBLE PRECISION,
    "coord_y" DOUBLE PRECISION,
    "oil_m3" DOUBLE PRECISION NOT NULL,
    "gas_thousand_m3" DOUBLE PRECISION NOT NULL,
    "oil_bbl" DOUBLE PRECISION NOT NULL,
    "oil_bbl_d" DOUBLE PRECISION NOT NULL,
    "oil_boe" DOUBLE PRECISION NOT NULL,
    "gas_mm3_d" DOUBLE PRECISION NOT NULL,
    "gas_mcf" DOUBLE PRECISION NOT NULL,
    "gas_mmcf_d" DOUBLE PRECISION NOT NULL,
    "gas_boe" DOUBLE PRECISION NOT NULL,
    "boe" DOUBLE PRECISION NOT NULL,
    "formation_vaca_muerta" BOOLEAN NOT NULL,
    "unconventional" BOOLEAN NOT NULL,
    "vm_combined" BOOLEAN NOT NULL,

    CONSTRAINT "fact_production_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agg_monthly_by_operator" (
    "id" SERIAL NOT NULL,
    "date_month" DATE NOT NULL,
    "operator_slug" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "concession" TEXT NOT NULL,
    "yacimiento" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "formation_slug" TEXT NOT NULL,
    "vm_combined" BOOLEAN NOT NULL,
    "oil_m3" DOUBLE PRECISION NOT NULL,
    "oil_bbl" DOUBLE PRECISION NOT NULL,
    "oil_bbl_d" DOUBLE PRECISION NOT NULL,
    "gas_thousand_m3" DOUBLE PRECISION NOT NULL,
    "gas_mm3_d" DOUBLE PRECISION NOT NULL,
    "gas_mcf" DOUBLE PRECISION NOT NULL,
    "gas_mmcf_d" DOUBLE PRECISION NOT NULL,
    "boe" DOUBLE PRECISION NOT NULL,
    "active_wells" INTEGER NOT NULL,

    CONSTRAINT "agg_monthly_by_operator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dim_well_operator_slug_idx" ON "dim_well"("operator_slug");

-- CreateIndex
CREATE INDEX "dim_well_formation_slug_idx" ON "dim_well"("formation_slug");

-- CreateIndex
CREATE INDEX "dim_well_province_idx" ON "dim_well"("province");

-- CreateIndex
CREATE INDEX "dim_well_basin_idx" ON "dim_well"("basin");

-- CreateIndex
CREATE INDEX "fact_production_monthly_date_month_operator_slug_idx" ON "fact_production_monthly"("date_month", "operator_slug");

-- CreateIndex
CREATE INDEX "fact_production_monthly_date_month_vm_combined_idx" ON "fact_production_monthly"("date_month", "vm_combined");

-- CreateIndex
CREATE INDEX "fact_production_monthly_well_id_date_month_idx" ON "fact_production_monthly"("well_id", "date_month");

-- CreateIndex
CREATE INDEX "fact_production_monthly_formation_slug_date_month_idx" ON "fact_production_monthly"("formation_slug", "date_month");

-- CreateIndex
CREATE INDEX "fact_production_monthly_operator_slug_idx" ON "fact_production_monthly"("operator_slug");

-- CreateIndex
CREATE INDEX "fact_production_monthly_province_idx" ON "fact_production_monthly"("province");

-- CreateIndex
CREATE INDEX "agg_monthly_by_operator_date_month_operator_slug_idx" ON "agg_monthly_by_operator"("date_month", "operator_slug");

-- CreateIndex
CREATE INDEX "agg_monthly_by_operator_date_month_vm_combined_idx" ON "agg_monthly_by_operator"("date_month", "vm_combined");

-- AddForeignKey
ALTER TABLE "dim_well" ADD CONSTRAINT "dim_well_operator_slug_fkey" FOREIGN KEY ("operator_slug") REFERENCES "dim_operator"("operator_slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_well" ADD CONSTRAINT "dim_well_formation_slug_fkey" FOREIGN KEY ("formation_slug") REFERENCES "dim_formation"("formation_slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_production_monthly" ADD CONSTRAINT "fact_production_monthly_well_id_fkey" FOREIGN KEY ("well_id") REFERENCES "dim_well"("well_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_production_monthly" ADD CONSTRAINT "fact_production_monthly_operator_slug_fkey" FOREIGN KEY ("operator_slug") REFERENCES "dim_operator"("operator_slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_production_monthly" ADD CONSTRAINT "fact_production_monthly_formation_slug_fkey" FOREIGN KEY ("formation_slug") REFERENCES "dim_formation"("formation_slug") ON DELETE RESTRICT ON UPDATE CASCADE;
