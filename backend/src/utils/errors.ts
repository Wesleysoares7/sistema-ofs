export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function createError(statusCode: number, message: string): AppError {
  return new AppError(statusCode, message);
}

// Erros comuns
export const errors = {
  UNAUTHORIZED: createError(401, "Não autorizado"),
  FORBIDDEN: createError(403, "Acesso proibido"),
  NOT_FOUND: createError(404, "Recurso não encontrado"),
  CONFLICT: createError(409, "Recurso já existe"),
  VALIDATION_ERROR: (msg: string) => createError(400, msg),
  INTERNAL_ERROR: createError(500, "Erro interno do servidor"),
};
