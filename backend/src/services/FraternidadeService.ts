import { Prisma } from "@prisma/client";
import { FraternidadeRepository } from "../repositories/FraternidadeRepository.js";
import { createError } from "../utils/errors.js";
import {
  CreateFraternidadeInput,
  UpdateFraternidadeInput,
} from "../schemas/index.js";
import type { AccessScope } from "./UserService.js";

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDistrito(value: string) {
  return normalizeText(value);
}

function isRegionalAdminRole(role?: string) {
  return role === "ADMIN_REGIONAL" || role === "ADMIN";
}

function isLocalAdminRole(role?: string) {
  return role === "ADMIN_LOCAL";
}

function assertRegionalAdmin(scope?: AccessScope) {
  if (!scope) return;
  if (!isRegionalAdminRole(scope.role)) {
    throw createError(
      403,
      "Apenas o administrador regional pode gerenciar fraternidades",
    );
  }
}

export class FraternidadeService {
  static async getPublicList() {
    const fraternidades = await FraternidadeRepository.findAll(0, 500);

    return fraternidades
      .filter((fraternidade) => fraternidade.status === "ATIVA")
      .map((fraternidade) => ({
        id: fraternidade.id,
        nomeFraternidade: fraternidade.nomeFraternidade,
        cidade: fraternidade.cidade,
        distrito: fraternidade.distrito,
        status: fraternidade.status,
      }));
  }

  static async getAll(skip = 0, take = 50, scope?: AccessScope) {
    if (scope && isLocalAdminRole(scope.role)) {
      if (!scope.fraternidadeId) {
        throw createError(403, "Administrador local sem fraternidade vinculada");
      }

      const fraternidade = await FraternidadeRepository.findById(
        scope.fraternidadeId,
      );
      return fraternidade ? [fraternidade] : [];
    }

    return FraternidadeRepository.findAll(skip, take);
  }

  static async getById(id: string, scope?: AccessScope) {
    if (scope && isLocalAdminRole(scope.role) && scope.fraternidadeId !== id) {
      throw createError(403, "Sem permissão para acessar outra fraternidade");
    }

    const fraternidade = await FraternidadeRepository.findById(id);
    if (!fraternidade) {
      throw createError(404, "Fraternidade não encontrada");
    }

    return fraternidade;
  }

  static async create(input: CreateFraternidadeInput, scope?: AccessScope) {
    assertRegionalAdmin(scope);

    try {
      return await FraternidadeRepository.create({
        nomeFraternidade: normalizeText(input.nomeFraternidade),
        cidade: normalizeText(input.cidade),
        distrito: normalizeDistrito(input.distrito),
        dataFundacao: new Date(input.dataFundacao),
        status: input.status,
        contatoMinistro: normalizeText(input.contatoMinistro),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw createError(
          409,
          "Já existe uma fraternidade cadastrada com este nome nesta cidade",
        );
      }

      throw error;
    }
  }

  static async update(id: string, input: UpdateFraternidadeInput, scope?: AccessScope) {
    assertRegionalAdmin(scope);

    const existing = await FraternidadeRepository.findById(id);
    if (!existing) {
      throw createError(404, "Fraternidade não encontrada");
    }

    try {
      return await FraternidadeRepository.update(id, {
        nomeFraternidade:
          input.nomeFraternidade !== undefined
            ? normalizeText(input.nomeFraternidade)
            : undefined,
        cidade:
          input.cidade !== undefined ? normalizeText(input.cidade) : undefined,
        distrito:
          input.distrito !== undefined
            ? normalizeDistrito(input.distrito)
            : undefined,
        dataFundacao:
          input.dataFundacao !== undefined
            ? new Date(input.dataFundacao)
            : undefined,
        status: input.status,
        contatoMinistro:
          input.contatoMinistro !== undefined
            ? normalizeText(input.contatoMinistro)
            : undefined,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw createError(
          409,
          "Já existe uma fraternidade cadastrada com este nome nesta cidade",
        );
      }

      throw error;
    }
  }

  static async delete(id: string, scope?: AccessScope) {
    assertRegionalAdmin(scope);

    const existing = await FraternidadeRepository.findById(id);
    if (!existing) {
      throw createError(404, "Fraternidade não encontrada");
    }

    await FraternidadeRepository.delete(id);

    return {
      id,
      message: "Fraternidade excluída com sucesso",
    };
  }
}
