import { prisma } from "../utils/prisma.js";

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
            valorAnual: 0,
            valorMensal: 0
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
    valorMensal?: number;
    descricaoMensal?: string | null;
    chavePix?: string;
    qrcodePixBase64?: string | null;
  }) {
    try {
      console.log("🔄 ConfigService.updateConfig chamado com:", data);
      
      const config = await prisma.config.upsert({
        where: { id: 'sistema-ofs' },
        create: {
          id: 'sistema-ofs',
          nomeFraternidade: data.nomeFraternidade,
          logoBase64: data.logoBase64,
          valorAnual: data.valorAnual || 0,
          descricaoAnual: data.descricaoAnual,
          valorMensal: data.valorMensal || 0,
          descricaoMensal: data.descricaoMensal,
          chavePix: data.chavePix,
          qrcodePixBase64: data.qrcodePixBase64
        },
        update: {
          nomeFraternidade: data.nomeFraternidade !== undefined ? data.nomeFraternidade : undefined,
          logoBase64: data.logoBase64 !== undefined ? data.logoBase64 : undefined,
          valorAnual: data.valorAnual !== undefined ? data.valorAnual : undefined,
          descricaoAnual: data.descricaoAnual !== undefined ? data.descricaoAnual : undefined,
          valorMensal: data.valorMensal !== undefined ? data.valorMensal : undefined,
          descricaoMensal: data.descricaoMensal !== undefined ? data.descricaoMensal : undefined,
          chavePix: data.chavePix !== undefined ? data.chavePix : undefined,
          qrcodePixBase64: data.qrcodePixBase64 !== undefined ? data.qrcodePixBase64 : undefined
        }
      });

      console.log("✅ ConfigService: Dados salvos com sucesso:", config);
      return config;
    } catch (error) {
      console.error('❌ ConfigService: Erro ao atualizar configurações:', error);
      throw error;
    }
  }
}

export const configService = new ConfigService();
