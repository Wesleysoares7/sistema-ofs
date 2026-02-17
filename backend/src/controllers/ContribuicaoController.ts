import { Request, Response } from "express";
import { ContribuicaoService } from "../services/ContribuicaoService.js";

export class ContribuicaoController {
  // Contribuição Anual
  static async getContribuicaoAnual(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const result =
        await ContribuicaoService.getContribuicaoAnualByUsuario(userId!);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async updateContribuicaoAnual(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ContribuicaoService.updateContribuicaoAnual(
        id,
        req.body,
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async createMissingAnnualContributions(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result =
        await ContribuicaoService.createMissingAnnualContributions(userId!, ano);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  // Contribuição Mensal
  static async getContribuicaoMensal(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result = await ContribuicaoService.getContribuicaoMensalByUsuario(
        userId!,
        ano,
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async updateContribuicaoMensal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ContribuicaoService.updateContribuicaoMensal(
        id,
        req.body,
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async createMissingMonthlyContributions(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result =
        await ContribuicaoService.createMissingMonthlyContributions(userId!, ano);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getDashboardMemberContributions(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result =
        await ContribuicaoService.getDashboardMemberContributions(userId!, ano);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getAdminContributionsReport(req: Request, res: Response) {
    try {
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result =
        await ContribuicaoService.getAdminContributionsReport(ano);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
