import { prisma } from "../utils/prisma.js";

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { endereco: true },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findByCpf(cpf: string) {
    return prisma.user.findUnique({
      where: { cpf },
    });
  }

  static async findAll(skip = 0, take = 10) {
    return prisma.user.findMany({
      skip,
      take,
      include: { endereco: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByStatus(status: string, skip = 0, take = 10) {
    return prisma.user.findMany({
      where: { status },
      skip,
      take,
      include: { endereco: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByTipoMembro(tipoMembro: string, skip = 0, take = 10) {
    return prisma.user.findMany({
      where: { tipoMembro },
      skip,
      take,
      include: { endereco: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async countByStatus(status: string) {
    return prisma.user.count({ where: { status } });
  }

  static async countByRole(role: string) {
    return prisma.user.count({ where: { role } });
  }

  static async create(data: any) {
    return prisma.user.create({
      data,
      include: { endereco: true },
    });
  }

  static async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: { endereco: true },
    });
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
