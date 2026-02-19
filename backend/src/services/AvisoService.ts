import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/errors.js";

const prisma = new PrismaClient();

export type AvisoTipo = "EVENTO" | "COMUNICADO" | "LEMBRETE";
export type AvisoPublicoAlvo = "MEMBER" | "ADMIN" | "ALL";

interface UpsertAvisoInput {
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo;
  publicoAlvo?: AvisoPublicoAlvo;
  dataExpiracao?: Date | null;
  ativo?: boolean;
}

export class AvisoService {
  async listAvisosForMember() {
    const now = new Date();

    return prisma.aviso.findMany({
      where: {
        ativo: true,
        AND: [
          {
            OR: [{ dataExpiracao: null }, { dataExpiracao: { gte: now } }],
          },
          {
            OR: [
              { publicoAlvo: null },
              { publicoAlvo: "MEMBER" },
              { publicoAlvo: "ALL" },
            ],
          },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async listAvisosForAdmin() {
    return prisma.aviso.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async createAviso(input: UpsertAvisoInput) {
    return prisma.aviso.create({
      data: {
        titulo: input.titulo,
        mensagem: input.mensagem,
        tipo: input.tipo,
        publicoAlvo: input.publicoAlvo,
        dataExpiracao: input.dataExpiracao,
        ativo: input.ativo ?? true,
      },
    });
  }

  async updateAviso(id: string, input: Partial<UpsertAvisoInput>) {
    const existing = await prisma.aviso.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Aviso não encontrado");
    }

    return prisma.aviso.update({
      where: { id },
      data: {
        titulo: input.titulo,
        mensagem: input.mensagem,
        tipo: input.tipo,
        publicoAlvo: input.publicoAlvo,
        dataExpiracao: input.dataExpiracao,
        ativo: input.ativo,
      },
    });
  }

  async deleteAviso(id: string) {
    const existing = await prisma.aviso.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Aviso não encontrado");
    }

    await prisma.aviso.delete({ where: { id } });

    return { message: "Aviso excluído com sucesso" };
  }
}

export const avisoService = new AvisoService();
