-- Ductos de salida de la cuenca Neuquina: volumen mensual y capacidad anual.
CREATE TABLE "fact_pipeline_flow" (
    "date" DATE NOT NULL,
    "pipeline" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "fact_pipeline_flow_pkey" PRIMARY KEY ("date","pipeline")
);

CREATE TABLE "fact_pipeline_capacity" (
    "year" INTEGER NOT NULL,
    "pipeline" TEXT NOT NULL,
    "max_m3d" DOUBLE PRECISION,
    "design_m3d" DOUBLE PRECISION,
    "used_m3d" DOUBLE PRECISION,

    CONSTRAINT "fact_pipeline_capacity_pkey" PRIMARY KEY ("year","pipeline")
);
