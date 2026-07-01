-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
    'ADMIN_REGIONAL',
    'ADMIN_LOCAL',
    'IRMAO_MEMBRO',
    'ADMIN',
    'MEMBER'
);

-- CreateTable
CREATE TABLE "ConfiguracaoFinanceiraFraternidade" (
    "id" TEXT NOT NULL,
    "fraternidadeId" TEXT NOT NULL,
    "mensalAtiva" BOOLEAN NOT NULL DEFAULT false,
    "valorMensal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoFinanceiraFraternidade_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "fraternidadeId" TEXT;
ALTER TABLE "User" ADD COLUMN "role_new" "UserRole" NOT NULL DEFAULT 'IRMAO_MEMBRO';

-- Data migration for role
UPDATE "User"
SET "role_new" = CASE
    WHEN "role" = 'ADMIN' THEN 'ADMIN'::"UserRole"
    WHEN "role" = 'MEMBER' THEN 'MEMBER'::"UserRole"
    WHEN "role" = 'ADMIN_REGIONAL' THEN 'ADMIN_REGIONAL'::"UserRole"
    WHEN "role" = 'ADMIN_LOCAL' THEN 'ADMIN_LOCAL'::"UserRole"
    WHEN "role" = 'IRMAO_MEMBRO' THEN 'IRMAO_MEMBRO'::"UserRole"
    ELSE 'IRMAO_MEMBRO'::"UserRole"
END;

ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoFinanceiraFraternidade_fraternidadeId_key" ON "ConfiguracaoFinanceiraFraternidade"("fraternidadeId");

-- CreateIndex
CREATE INDEX "ConfiguracaoFinanceiraFraternidade_mensalAtiva_idx" ON "ConfiguracaoFinanceiraFraternidade"("mensalAtiva");

-- CreateIndex
CREATE INDEX "User_fraternidadeId_idx" ON "User"("fraternidadeId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_fraternidadeId_fkey"
FOREIGN KEY ("fraternidadeId") REFERENCES "Fraternidade"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoFinanceiraFraternidade"
ADD CONSTRAINT "ConfiguracaoFinanceiraFraternidade_fraternidadeId_fkey"
FOREIGN KEY ("fraternidadeId") REFERENCES "Fraternidade"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
