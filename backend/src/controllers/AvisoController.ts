import { Request, Response } from "express";
import { z } from "zod";
import { avisoService } from "../services/AvisoService.js";

const avisoTipoEnum = z.enum(["EVENTO", "COMUNICADO", "LEMBRETE"]);
const avisoPublicoEnum = z.enum(["MEMBER", "ADMIN", "ALL"]);

const createAvisoSchema = z.object({
  titulo: z.string().min(3),
  mensagem: z.string().min(3),
  tipo: avisoTipoEnum.default("COMUNICADO"),
  publicoAlvo: avisoPublicoEnum.optional(),
  dataExpiracao: z.string().datetime().optional(),
  ativo: z.boolean().optional(),
});

const updateAvisoSchema = z.object({
  titulo: z.string().min(3).optional(),
  mensagem: z.string().min(3).optional(),
  tipo: avisoTipoEnum.optional(),
  publicoAlvo: avisoPublicoEnum.optional(),
  dataExpiracao: z.string().datetime().nullable().optional(),
  ativo: z.boolean().optional(),
});

const parseDataExpiracao = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
};

export class AvisoController {
  async getMemberAvisos(req: Request, res: Response) {
    try {
      const avisos = await avisoService.listAvisosForMember();
      res.status(200).json(avisos);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getAdminAvisos(req: Request, res: Response) {
    try {
      const avisos = await avisoService.listAvisosForAdmin();
      res.status(200).json(avisos);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async createAviso(req: Request, res: Response) {
    try {
      const payload = createAvisoSchema.parse(req.body);

      const aviso = await avisoService.createAviso({
        ...payload,
        dataExpiracao: payload.dataExpiracao
          ? new Date(payload.dataExpiracao)
          : undefined,
      });

      res.status(201).json(aviso);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: err.errors,
        });
      }

      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async updateAviso(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = updateAvisoSchema.parse(req.body);

      const aviso = await avisoService.updateAviso(id, {
        ...payload,
        dataExpiracao: parseDataExpiracao(payload.dataExpiracao),
      });

      res.status(200).json(aviso);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: err.errors,
        });
      }

      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteAviso(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await avisoService.deleteAviso(id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

export const avisoController = new AvisoController();
