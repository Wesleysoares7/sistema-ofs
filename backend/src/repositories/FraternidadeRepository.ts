import { prisma } from "../utils/prisma.js";

interface CreateFraternidadeData {
  nomeFraternidade: string;
  cidade: string;
  distrito: string;
  dataFundacao: Date;
  status: "ATIVA" | "INATIVA";
  contatoMinistro: string;
}

interface UpdateFraternidadeData {
  nomeFraternidade?: string;
  cidade?: string;
  distrito?: string;
  dataFundacao?: Date;
  status?: "ATIVA" | "INATIVA";
  contatoMinistro?: string;
}

export class FraternidadeRepository {
  static async findAll(skip = 0, take = 50) {
    return prisma.fraternidade.findMany({
      skip,
      take,
      orderBy: [{ distrito: "asc" }, { nomeFraternidade: "asc" }],
    });
  }

  static async findById(id: string) {
    return prisma.fraternidade.findUnique({ where: { id } });
  }

  static async create(data: CreateFraternidadeData) {
    return prisma.fraternidade.create({ data });
  }

  static async update(id: string, data: UpdateFraternidadeData) {
    return prisma.fraternidade.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.fraternidade.delete({ where: { id } });
  }
}
