import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProduction ? 100 : 1000, // em dev evita bloqueios por React StrictMode e múltiplas telas
  skip: (req) => {
    if (req.method === "OPTIONS") {
      return true;
    }

    if (!isProduction) {
      return req.path === "/health" || req.path.startsWith("/api/config");
    }

    return false;
  },
  message: "Muitas requisições, tente novamente mais tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login
  message: "Muitas tentativas de login, tente novamente em 15 minutos",
  skipSuccessfulRequests: true,
});

export function logRequests(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.path} | ${res.statusCode} | ${duration}ms`,
    );
  });

  next();
}
