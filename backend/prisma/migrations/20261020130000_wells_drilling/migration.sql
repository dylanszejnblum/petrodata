-- Pozos en perforación por mes y provincia (Secretaría de Energía).
CREATE TABLE "fact_wells_drilling" (
    "date" DATE NOT NULL,
    "province" TEXT NOT NULL,
    "wells" INTEGER NOT NULL,

    CONSTRAINT "fact_wells_drilling_pkey" PRIMARY KEY ("date","province")
);
