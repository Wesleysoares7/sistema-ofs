import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ContribuicaoRepository {
  // Contribuição Anual
  static async findContribuicaoAnualById(id: string) {
    return prisma.contribuicaoAnual.findUnique({
      where: { id },
    });
  }

  static async findContribuicaoAnualByUser(userId: string) {
    return prisma.contribuicaoAnual.findMany({
      where: { userId },
      orderBy: { ano: "desc" },
    });
  }

  static async findContribuicaoAnualByAno(userId: string, ano: number) {
    return prisma.contribuicaoAnual.findUnique({
      where: {
        userId_ano: { userId, ano },
      },
    });
  }

  static async createContribuicaoAnual(userId: string, ano: number) {
    return prisma.contribuicaoAnual.create({
      data: {
        userId,
        ano,
        status: "PENDENTE",
      },
    });
  }

  static async updateContribuicaoAnual(id: string, data: any) {
    return prisma.contribuicaoAnual.update({
      where: { id },
      data,
    });
  }

  static async createMultipleContribuicaoAnual(userId: string, anos: number[]) {
    return prisma.$transaction(
      anos.map((ano) =>
        prisma.contribuicaoAnual.upsert({
          where: {
            userId_ano: { userId, ano },
          },
          update: {},
          create: {
            userId,
            ano,
            status: "PENDENTE",
          },
        }),
      ),
    );
  }

  // Contribuição Mensal
  static async findContribuicaoMensalById(id: string) {
    return prisma.contribuicaoMensal.findUnique({
      where: { id },
    });
  }

  static async findContribuicaoMensalByUser(userId: string, ano?: number) {
    const where: any = { userId };
    if (ano) where.ano = ano;

    return prisma.contribuicaoMensal.findMany({
      where,
      orderBy: [{ ano: "desc" }, { mes: "asc" }],
    });
  }

  static async findContribuicaoMensalByMesAno(
    userId: string,
    mes: number,
    ano: number,
  ) {
    return prisma.contribuicaoMensal.findUnique({
      where: {
        userId_mes_ano: { userId, mes, ano },
      },
    });
  }

  static async createContribuicaoMensal(
    userId: string,
    mes: number,
    ano: number,
  ) {
    return prisma.contribuicaoMensal.create({
      data: {
        userId,
        mes,
        ano,
        status: "PENDENTE",
      },
    });
  }

  static async updateContribuicaoMensal(id: string, data: any) {
    return prisma.contribuicaoMensal.update({
      where: { id },
      data,
    });
  }

  static async createAnoContribuicoesMensais(userId: string, ano: number) {
    const upserts = [];
    for (let mes = 1; mes <= 12; mes++) {
      upserts.push(
        prisma.contribuicaoMensal.upsert({
          where: {
            userId_mes_ano: { userId, mes, ano },
          },
          update: {},
          create: {
            userId,
            mes,
            ano,
            status: "PENDENTE",
          },
        }),
      );
    }

    return prisma.$transaction(upserts);
  }

  static async countPendentes(userId: string, ano: number) {
    return prisma.contribuicaoMensal.count({
      where: {
        userId,
        ano,
        status: "PENDENTE",
      },
    });
  }

  static async countPagas(userId: string, ano: number) {
    return prisma.contribuicaoMensal.count({
      where: {
        userId,
        ano,
        status: "PAGO",
      },
    });
  }
}
