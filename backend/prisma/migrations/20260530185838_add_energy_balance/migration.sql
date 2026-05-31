-- CreateTable
CREATE TABLE "fact_energy_balance" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "forma_de_energia" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "ktep_redond" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "fact_energy_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_energy_balance_forma_de_energia_ano_idx" ON "fact_energy_balance"("forma_de_energia", "ano");

-- CreateIndex
CREATE INDEX "fact_energy_balance_concepto_ano_idx" ON "fact_energy_balance"("concepto", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "fact_energy_balance_ano_forma_de_energia_concepto_key" ON "fact_energy_balance"("ano", "forma_de_energia", "concepto");
