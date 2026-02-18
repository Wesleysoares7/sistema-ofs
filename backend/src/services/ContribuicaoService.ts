import { ContribuicaoRepository } from "../repositories/ContribuicaoRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { createError } from "../utils/errors.js";
import {
  UpdateContribuicaoAnualInput,
  UpdateContribuicaoMensalInput,
} from "../schemas/index.js";

export class ContribuicaoService {
  private static getAnnualReferenceYear(exercicioAno: number) {
    return exercicioAno - 1;
  }

  // Contribuição Anual
  static async getContribuicaoAnualByUsuario(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    return await ContribuicaoRepository.findContribuicaoAnualByUser(userId);
  }

  static async updateContribuicaoAnual(
    id: string,
    input: UpdateContribuicaoAnualInput,
  ) {
    const contribuicao =
      await ContribuicaoRepository.findContribuicaoAnualById(id);

    if (!contribuicao) {
      throw createError(404, "Contribuição anual não encontrada");
    }

    const updated = await ContribuicaoRepository.updateContribuicaoAnual(
      id,
      {
        status: input.status,
        dataPagamento:
          input.dataPagamento && input.status === "PAGO"
            ? new Date(input.dataPagamento)
            : null,
      },
    );

    return updated;
  }

  static async createMissingAnnualContributions(userId: string, ano?: number) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const currentYear = new Date().getFullYear();
    const existing =
      await ContribuicaoRepository.findContribuicaoAnualByUser(userId);

    const existingYears = existing.map((c) => c.ano);
    const missingYears: number[] = [];

    if (ano) {
      const annualReferenceYear = this.getAnnualReferenceYear(ano);
      if (!existingYears.includes(annualReferenceYear)) {
        missingYears.push(annualReferenceYear);
      }
    } else {
      for (
        let exercicioAno = currentYear - 1;
        exercicioAno <= currentYear + 1;
        exercicioAno++
      ) {
        const annualReferenceYear = this.getAnnualReferenceYear(exercicioAno);
        if (!existingYears.includes(annualReferenceYear)) {
          missingYears.push(annualReferenceYear);
        }
      }
    }

    if (missingYears.length > 0) {
      await ContribuicaoRepository.createMultipleContribuicaoAnual(
        userId,
        missingYears,
      );
    }

    return await this.getContribuicaoAnualByUsuario(userId);
  }

  // Contribuição Mensal
  static async getContribuicaoMensalByUsuario(userId: string, ano?: number) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    return await ContribuicaoRepository.findContribuicaoMensalByUser(
      userId,
      ano,
    );
  }

  static async updateContribuicaoMensal(
    id: string,
    input: UpdateContribuicaoMensalInput,
  ) {
    const contribuicao =
      await ContribuicaoRepository.findContribuicaoMensalById(id);

    if (!contribuicao) {
      throw createError(404, "Contribuição mensal não encontrada");
    }

    const updated = await ContribuicaoRepository.updateContribuicaoMensal(
      id,
      {
        status: input.status,
        dataPagamento:
          input.dataPagamento && input.status === "PAGO"
            ? new Date(input.dataPagamento)
            : null,
      },
    );

    return updated;
  }

  static async createMissingMonthlyContributions(userId: string, ano?: number) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const currentYear = new Date().getFullYear();
    const yearToUse = ano || currentYear;
    const existing = await ContribuicaoRepository.findContribuicaoMensalByUser(
      userId,
      yearToUse,
    );

    const existingMonths = existing.map((c) => c.mes);
    const missingMonths = [];

    for (let month = 1; month <= 12; month++) {
      if (!existingMonths.includes(month)) {
        missingMonths.push(month);
      }
    }

    if (missingMonths.length > 0) {
      for (const month of missingMonths) {
        await ContribuicaoRepository.createContribuicaoMensal(
          userId,
          month,
          yearToUse,
        );
      }
    }

    return await this.getContribuicaoMensalByUsuario(userId, yearToUse);
  }

  static async getDashboardMemberContributions(userId: string, ano?: number) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const currentYear = new Date().getFullYear();
    const yearToUse = ano || currentYear;
    const annualReferenceYear = this.getAnnualReferenceYear(yearToUse);

    const anualContribuicao = await ContribuicaoRepository.findContribuicaoAnualByAno(
      userId,
      annualReferenceYear,
    );
    const mensalContribuicoes =
      await ContribuicaoRepository.findContribuicaoMensalByUser(
        userId,
        yearToUse,
      );

    const pagas = await ContribuicaoRepository.countPagas(userId, yearToUse);
    const pendentes = await ContribuicaoRepository.countPendentes(
      userId,
      yearToUse,
    );

    return {
      ano: yearToUse,
      anualContribuicoes: anualContribuicao ? [anualContribuicao] : [],
      mensalContribuicoes: mensalContribuicoes.map((c) => ({
        mes: c.mes,
        status: c.status,
        dataPagamento: c.dataPagamento,
      })),
      resumo: {
        mensal: {
          pagas,
          pendentes,
          total: 12,
        },
      },
    };
  }

  static async getAdminContributionsReport(ano?: number) {
    const currentYear = new Date().getFullYear();
    const yearToCheck = ano || currentYear;
    const annualReferenceYear = this.getAnnualReferenceYear(yearToCheck);

    const users = await UserRepository.findByStatus("ATIVO", 0, 1000);

    const report = await Promise.all(
      users.map(async (user) => {
        const anual = await ContribuicaoRepository.findContribuicaoAnualByAno(
          user.id,
          annualReferenceYear,
        );
        const pagas = await ContribuicaoRepository.countPagas(
          user.id,
          yearToCheck,
        );
        const pendentes = await ContribuicaoRepository.countPendentes(
          user.id,
          yearToCheck,
        );

        return {
          userId: user.id,
          nome: user.nome,
          email: user.email,
          tipoMembro: user.tipoMembro,
          anual: anual ? anual.status : "NÃO GERADO",
          anualId: anual ? anual.id : null,
          anualDataPagamento: anual?.dataPagamento || null,
          mensal: {
            pagas,
            pendentes,
            total: 12,
          },
          statusGeral: pendentes === 0 && anual?.status === "PAGO" ? "EM DIA" : "INADIMPLENTE",
        };
      }),
    );

    return report;
  }
}
