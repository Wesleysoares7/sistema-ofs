import { Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export interface AuthRequest {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  userStatus?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      userStatus?: string;
    }
  }
}

export function errorHandler(
  err: Error,
  req: any,
  res: Response,
  next: NextFunction,
) {
  console.error("❌ Erro:", err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "JSON inválido",
      statusCode: 400,
    });
  }

  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Arquivo muito grande. Reduza o tamanho da imagem e tente novamente.",
      statusCode: 413,
    });
  }

  res.status(500).json({
    error: "Erro interno do servidor",
    statusCode: 500,
  });
}

export function notFoundHandler(req: any, res: Response) {
  res.status(404).json({
    error: "Rota não encontrada",
    statusCode: 404,
  });
}
