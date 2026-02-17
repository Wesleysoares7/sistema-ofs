import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
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
