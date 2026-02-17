import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { createError } from "../utils/errors.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err: any) {
      const errors = err.errors.map((e: any) => ({
        path: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        error: "Erro de validação",
        details: errors,
        statusCode: 400,
      });
    }
  };
}
