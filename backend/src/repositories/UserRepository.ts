import { prisma } from "../utils/prisma.js";

interface UserFilter {
  fraternidadeId?: string;
  userId?: string;
}

function buildWhere(filter?: UserFilter) {
  if (!filter) return {};

  const where: any = {};
  if (filter.fraternidadeId) {
    where.fraternidadeId = filter.fraternidadeId;
  }
  if (filter.userId) where.id = filter.userId;
  return where;
}

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { endereco: true, fraternidade: true },
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

  static async findAll(skip = 0, take = 10, filter?: UserFilter) {
    return prisma.user.findMany({
      where: buildWhere(filter),
      skip,
      take,
      include: { endereco: true, fraternidade: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByStatus(
    status: string,
    skip = 0,
    take = 10,
    filter?: UserFilter,
  ) {
    const where: any = {
      ...buildWhere(filter),
      status,
    };

    return prisma.user.findMany({
      where,
      skip,
      take,
      include: { endereco: true, fraternidade: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByTipoMembro(
    tipoMembro: string,
    skip = 0,
    take = 10,
    filter?: UserFilter,
  ) {
    const where: any = {
      ...buildWhere(filter),
      tipoMembro,
    };

    return prisma.user.findMany({
      where,
      skip,
      take,
      include: { endereco: true, fraternidade: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async countByStatus(status: string, filter?: UserFilter) {
    return prisma.user.count({
      where: {
        ...buildWhere(filter),
        status,
      },
    });
  }

  static async countByRole(role: string, filter?: UserFilter) {
    return prisma.user.count({
      where: {
        ...buildWhere(filter),
        role,
      },
    });
  }

  static async create(data: any) {
    return prisma.user.create({
      data,
      include: { endereco: true, fraternidade: true },
    });
  }

  static async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: { endereco: true, fraternidade: true },
    });
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
