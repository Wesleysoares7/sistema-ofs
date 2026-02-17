import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { createError } from "../utils/errors.js";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw createError(401, "Token não fornecido");
    }

    const payload = verifyToken(token);

    req.userId = payload.id;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    req.userStatus = payload.status;

    next();
  } catch (err: any) {
    res.status(401).json({
      error: err.message || "Token inválido",
      statusCode: 401,
    });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({
      error: "Apenas administradores podem acessar",
      statusCode: 403,
    });
  }
  next();
}

export function requireActive(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.userStatus !== "ATIVO") {
    return res.status(403).json({
      error: "Sua conta não está ativa. Aguarde aprovação.",
      statusCode: 403,
    });
  }
  next();
}

function extractToken(req: Request): string | null {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
