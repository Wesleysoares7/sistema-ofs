import { prisma } from "../utils/prisma.js";
import { createError } from "../utils/errors.js";

export class ConfigService {
  async getConfig() {
    try {
      let config = await prisma.config.findUnique({
        where: { id: 'sistema-ofs' }
      });

      if (!config) {
        // Criar config padrão se não existir
        config = await prisma.config.create({
          data: {
            id: 'sistema-ofs',
            valorAnual: 0
          }
        });
      }

      return config;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  async updateConfig(data: {
    nomeFraternidade?: string | null;
    logoBase64?: string | null;
    valorAnual?: number;
    descricaoAnual?: string | null;
    chavePix?: string | null;
    qrcodePixBase64?: string | null;
  }) {
    try {
      const config = await prisma.config.upsert({
        where: { id: 'sistema-ofs' },
        create: {
          id: 'sistema-ofs',
          nomeFraternidade: data.nomeFraternidade,
          logoBase64: data.logoBase64,
          valorAnual: data.valorAnual || 0,
          descricaoAnual: data.descricaoAnual,
          chavePix: data.chavePix,
          qrcodePixBase64: data.qrcodePixBase64
        },
        update: {
          nomeFraternidade: data.nomeFraternidade !== undefined ? data.nomeFraternidade : undefined,
          logoBase64: data.logoBase64 !== undefined ? data.logoBase64 : undefined,
          valorAnual: data.valorAnual !== undefined ? data.valorAnual : undefined,
          descricaoAnual: data.descricaoAnual !== undefined ? data.descricaoAnual : undefined,
          chavePix: data.chavePix !== undefined ? data.chavePix : undefined,
          qrcodePixBase64: data.qrcodePixBase64 !== undefined ? data.qrcodePixBase64 : undefined
        }
      });

      return config;
    } catch (error) {
      console.error('❌ ConfigService: Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  async getFraternidadeFinanceiraConfig(fraternidadeId: string) {
    if (!fraternidadeId) {
      throw createError(400, "Fraternidade não informada");
    }

    const config = await prisma.configuracaoFinanceiraFraternidade.findUnique({
      where: { fraternidadeId },
      include: {
        fraternidade: true,
      },
    });

    if (!config) {
      return {
        fraternidadeId,
        mensalAtiva: false,
        valorMensal: null,
        chavePix: null,
        qrcodePixBase64: null,
      };
    }

    return config;
  }

  async upsertFraternidadeFinanceiraConfig(
    fraternidadeId: string,
    data: {
      mensalAtiva?: boolean;
      valorMensal?: number | null;
      chavePix?: string | null;
      qrcodePixBase64?: string | null;
    },
  ) {
    if (!fraternidadeId) {
      throw createError(400, "Fraternidade não informada");
    }

    const fraternidade = await prisma.fraternidade.findUnique({
      where: { id: fraternidadeId },
    });

    if (!fraternidade) {
      throw createError(404, "Fraternidade não encontrada");
    }

    return prisma.configuracaoFinanceiraFraternidade.upsert({
      where: { fraternidadeId },
      create: {
        fraternidadeId,
        mensalAtiva: data.mensalAtiva ?? false,
        valorMensal:
          data.valorMensal !== undefined && data.valorMensal !== null
            ? data.valorMensal
            : null,
        chavePix:
          data.chavePix !== undefined && data.chavePix !== null
            ? data.chavePix
            : null,
        qrcodePixBase64:
          data.qrcodePixBase64 !== undefined
            ? data.qrcodePixBase64
            : null,
      },
      update: {
        mensalAtiva: data.mensalAtiva,
        valorMensal:
          data.valorMensal !== undefined ? data.valorMensal : undefined,
        chavePix: data.chavePix !== undefined ? data.chavePix : undefined,
        qrcodePixBase64:
          data.qrcodePixBase64 !== undefined
            ? data.qrcodePixBase64
            : undefined,
      },
      include: {
        fraternidade: true,
      },
    });
  }
}

export const configService = new ConfigService();
