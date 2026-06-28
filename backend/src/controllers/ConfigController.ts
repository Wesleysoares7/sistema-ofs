import { Request, Response } from "express";
import { configService } from "../services/ConfigService.js";
import { z } from "zod";

const updateConfigSchema = z.object({
  nomeFraternidade: z.string().nullable().optional(),
  logoBase64: z.string().nullable().optional(),
  valorAnual: z.number().optional(),
  descricaoAnual: z.string().nullable().optional(),
  chavePix: z.string().nullable().optional(),
  qrcodePixBase64: z.string().nullable().optional(),
});

const updateFraternidadeFinanceiraSchema = z.object({
  mensalAtiva: z.boolean().optional(),
  valorMensal: z.number().nullable().optional(),
  chavePix: z.string().nullable().optional(),
  qrcodePixBase64: z.string().nullable().optional(),
});

export class ConfigController {
  private resolveFraternidadeScope(req: Request) {
    const role = req.userRole;
    const isRegional = role === "ADMIN_REGIONAL" || role === "ADMIN";

    if (isRegional) {
      return (req.query.fraternidadeId as string) || req.userFraternidadeId || "";
    }

    return req.userFraternidadeId || "";
  }

  async getConfig(req: Request, res: Response) {
    try {
      const config = await configService.getConfig();

      res.json(config);
    } catch (error) {
      console.error("❌ Erro ao obter configurações:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao obter configurações",
      });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      const validatedData = updateConfigSchema.parse(req.body);

      const config = await configService.updateConfig(validatedData);

      res.json({
        success: true,
        message: "Configurações atualizadas com sucesso",
        data: config,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Erro de validação:", error.errors);
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      console.error("❌ Erro ao atualizar configurações:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao atualizar configurações",
      });
    }
  }

  async getFraternidadeFinanceiraConfig(req: Request, res: Response) {
    try {
      const fraternidadeId = this.resolveFraternidadeScope(req);

      if (!fraternidadeId) {
        return res.status(400).json({
          success: false,
          message: "Fraternidade não informada para o usuário autenticado",
        });
      }

      const config = await configService.getFraternidadeFinanceiraConfig(
        fraternidadeId,
      );

      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erro ao obter configuração financeira",
      });
    }
  }

  async updateFraternidadeFinanceiraConfig(req: Request, res: Response) {
    try {
      const fraternidadeId = this.resolveFraternidadeScope(req);

      if (!fraternidadeId) {
        return res.status(400).json({
          success: false,
          message: "Fraternidade não informada para o usuário autenticado",
        });
      }

      const payload = updateFraternidadeFinanceiraSchema.parse(req.body);
      const updated = await configService.upsertFraternidadeFinanceiraConfig(
        fraternidadeId,
        payload,
      );

      res.json({
        success: true,
        message: "Configuração financeira da fraternidade atualizada",
        data: updated,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Erro ao atualizar configuração financeira",
      });
    }
  }
}

export const configController = new ConfigController();
