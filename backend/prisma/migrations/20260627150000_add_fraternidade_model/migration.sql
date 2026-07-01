-- CreateEnum
CREATE TYPE "FraternidadeStatus" AS ENUM ('ATIVA', 'INATIVA');

-- CreateTable
CREATE TABLE "Fraternidade" (
    "id" TEXT NOT NULL,
    "nomeFraternidade" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "dataFundacao" TIMESTAMP(3) NOT NULL,
    "status" "FraternidadeStatus" NOT NULL DEFAULT 'ATIVA',
    "contatoMinistro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fraternidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fraternidade_nomeFraternidade_cidade_key" ON "Fraternidade"("nomeFraternidade", "cidade");

-- CreateIndex
CREATE INDEX "Fraternidade_distrito_idx" ON "Fraternidade"("distrito");

-- CreateIndex
CREATE INDEX "Fraternidade_status_idx" ON "Fraternidade"("status");
