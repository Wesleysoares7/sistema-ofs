import { Request, Response } from 'express';
import { configService } from '../services/ConfigService';
import { z } from 'zod';

const updateConfigSchema = z.object({
  nomeFraternidade: z.string().nullable().optional(),
  logoBase64: z.string().nullable().optional(),
  valorAnual: z.number().optional(),
  descricaoAnual: z.string().nullable().optional(),
  valorMensal: z.number().optional(),
  descricaoMensal: z.string().nullable().optional(),
  chavePix: z.string().optional(),
  qrcodePixBase64: z.string().nullable().optional()
});

export class ConfigController {
  async getConfig(req: Request, res: Response) {
    try {
      console.log("📖 Recuperando configurações...");
      const config = await configService.getConfig();
      console.log("✅ Configurações encontradas:", config);
      
      res.json(config);
    } catch (error) {
      console.error('❌ Erro ao obter configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter configurações'
      });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      console.log("📝 Recebendo requisição para atualizar config");
      console.log("📊 Dados recebidos:", req.body);
      
      const validatedData = updateConfigSchema.parse(req.body);
      console.log("✅ Dados validados:", validatedData);
      
      const config = await configService.updateConfig(validatedData);
      console.log("💾 Configuração salva:", config);

      res.json({
        success: true,
        message: 'Configurações atualizadas com sucesso',
        data: config
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Erro de validação:", error.errors);
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      console.error('❌ Erro ao atualizar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações'
      });
    }
  }
}

export const configController = new ConfigController();
