-- CreateTable
CREATE TABLE "fact_price" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "fact_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_rig_count" (
    "date" DATE NOT NULL,
    "oil_rigs" INTEGER,
    "gas_rigs" INTEGER,
    "total_rigs" INTEGER,

    CONSTRAINT "fact_rig_count_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "fact_fuel_price" (
    "id" SERIAL NOT NULL,
    "fecha_vigencia" TIMESTAMP(3) NOT NULL,
    "provincia" TEXT NOT NULL,
    "localidad" TEXT,
    "empresa" TEXT,
    "empresa_bandera" TEXT,
    "producto" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "tipo_horario" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "fact_fuel_price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_price_series_date_idx" ON "fact_price"("series", "date");

-- CreateIndex
CREATE INDEX "fact_price_source_date_idx" ON "fact_price"("source", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fact_price_source_series_date_key" ON "fact_price"("source", "series", "date");

-- CreateIndex
CREATE INDEX "fact_fuel_price_provincia_producto_idx" ON "fact_fuel_price"("provincia", "producto");

-- CreateIndex
CREATE INDEX "fact_fuel_price_fecha_vigencia_idx" ON "fact_fuel_price"("fecha_vigencia");

-- CreateIndex
CREATE INDEX "fact_fuel_price_producto_fecha_vigencia_idx" ON "fact_fuel_price"("producto", "fecha_vigencia");
