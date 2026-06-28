import { Request, Response } from "express";
import { ContribuicaoService } from "../services/ContribuicaoService.js";

export class ContribuicaoController {
  private static buildScope(req: Request) {
    return {
      userId: req.userId!,
      role: req.userRole || "",
      fraternidadeId: req.userFraternidadeId ?? null,
    };
  }

  // Contribuição Anual
  static async getContribuicaoAnual(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.userId;
      const result = await ContribuicaoService.getContribuicaoAnualByUsuario(
        userId!,
        ContribuicaoController.buildScope(req),
      );
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
        ContribuicaoController.buildScope(req),
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
        await ContribuicaoService.createMissingAnnualContributions(
          userId!,
          ano,
          ContribuicaoController.buildScope(req),
        );
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
        ContribuicaoController.buildScope(req),
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
        ContribuicaoController.buildScope(req),
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
        await ContribuicaoService.createMissingMonthlyContributions(
          userId!,
          ano,
          ContribuicaoController.buildScope(req),
        );
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
        await ContribuicaoService.getDashboardMemberContributions(
          userId!,
          ano,
          ContribuicaoController.buildScope(req),
        );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getAdminContributionsReport(req: Request, res: Response) {
    try {
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const result = await ContribuicaoService.getAdminContributionsReport(
        ano,
        ContribuicaoController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async createAnnualExercise(req: Request, res: Response) {
    try {
      const ano = req.query.ano ? parseInt(req.query.ano as string, 10) : NaN;
      const result = await ContribuicaoService.createAnnualExercise(
        ano,
        ContribuicaoController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async createMonthlyExercise(req: Request, res: Response) {
    try {
      const ano = req.query.ano ? parseInt(req.query.ano as string, 10) : NaN;
      const fraternidadeId = req.query.fraternidadeId as string | undefined;
      const result = await ContribuicaoService.createMonthlyExercise(
        ano,
        ContribuicaoController.buildScope(req),
        fraternidadeId,
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
