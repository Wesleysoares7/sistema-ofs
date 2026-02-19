import { Prisma } from "@prisma/client";
import { createError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";

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
    try {
      return await prisma.aviso.update({
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw createError(404, "Aviso não encontrado");
      }

      throw error;
    }
  }

  async deleteAviso(id: string) {
    try {
      await prisma.aviso.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw createError(404, "Aviso não encontrado");
      }

      throw error;
    }

    return { message: "Aviso excluído com sucesso" };
  }
}

export const avisoService = new AvisoService();
