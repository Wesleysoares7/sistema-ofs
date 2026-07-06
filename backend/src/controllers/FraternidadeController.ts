import { Request, Response } from "express";
import { FraternidadeService } from "../services/FraternidadeService.js";

export class FraternidadeController {
  private static buildScope(req: Request) {
    return {
      userId: req.userId!,
      role: req.userRole || "",
      fraternidadeId: req.userFraternidadeId ?? null,
    };
  }

  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;

      const result = await FraternidadeService.getAll(
        skip,
        take,
        FraternidadeController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getPublicList(req: Request, res: Response) {
    try {
      const result = await FraternidadeService.getPublicList();
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await FraternidadeService.getById(
        id,
        FraternidadeController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const result = await FraternidadeService.create(
        req.body,
        FraternidadeController.buildScope(req),
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await FraternidadeService.update(
        id,
        req.body,
        FraternidadeController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await FraternidadeService.delete(
        id,
        FraternidadeController.buildScope(req),
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
