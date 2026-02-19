-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'COMUNICADO',
    "publicoAlvo" TEXT,
    "dataExpiracao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aviso_publicoAlvo_ativo_dataExpiracao_idx"
ON "Aviso"("publicoAlvo", "ativo", "dataExpiracao");
