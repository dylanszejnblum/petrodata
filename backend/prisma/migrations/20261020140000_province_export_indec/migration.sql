-- Las exportaciones por provincia pasan a ser las registradas por INDEC (OPEX
-- mensual). La tabla vieja guardaba una estimación sobre la producción con
-- precio y porcentaje exportado fijos: se borra.
DROP TABLE "province_export";

CREATE TABLE "fact_province_export" (
    "date" DATE NOT NULL,
    "province_slug" TEXT NOT NULL,
    "province_name" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "usd" DOUBLE PRECISION NOT NULL,
    "kg" DOUBLE PRECISION,

    CONSTRAINT "fact_province_export_pkey" PRIMARY KEY ("date","province_slug","rubro")
);

CREATE INDEX "fact_province_export_province_slug_date_idx" ON "fact_province_export"("province_slug", "date");
