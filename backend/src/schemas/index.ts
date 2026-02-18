import { z } from "zod";

// Validações comuns
export const createUserSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().refine(
    (val) => /^\d{11}$/.test(val.replace(/\D/g, "")),
    "CPF deve ter exatamente 11 dígitos"
  ),
  dataNascimento: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Data de nascimento inválida"
  ),
  telefone: z.string().refine(
    (val) => val.replace(/\D/g, "").length >= 10,
    "Telefone deve ter no mínimo 10 dígitos"
  ),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  fotoBase64: z.string().optional(),
  endereco: z.object({
    rua: z.string().min(3, "Rua inválida"),
    numero: z.string(),
    bairro: z.string().min(3, "Bairro inválido"),
    cidade: z.string().min(3, "Cidade inválida"),
    estado: z.string().length(2, "Estado deve ter 2 caracteres"),
    cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const updateUserSchema = z.object({
  nome: z.string().min(3).optional(),
  tipoMembro: z.enum(["INICIANTE", "FORMANDO", "PROFESSO"]).optional(),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO"]).optional(),
  fotoBase64: z.string().nullable().optional(),
  telefone: z.string().min(10).optional(),
  endereco: z.object({
    rua: z.string().min(3).optional(),
    numero: z.string().optional(),
    bairro: z.string().min(3).optional(),
    cidade: z.string().min(3).optional(),
    estado: z.string().length(2).optional(),
    cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  }).optional(),
});

export const adminUpdateUserSchema = z.object({
  nome: z.string().min(3).optional(),
  cpf: z.string().refine(
    (val) => /^\d{11}$/.test(val.replace(/\D/g, "")),
    "CPF deve ter exatamente 11 dígitos"
  ).optional(),
  dataNascimento: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Data de nascimento inválida"
  ).optional(),
  telefone: z.string().refine(
    (val) => val.replace(/\D/g, "").length >= 10,
    "Telefone deve ter no mínimo 10 dígitos"
  ).optional(),
  email: z.string().email("Email inválido").optional(),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
  tipoMembro: z.enum(["INICIANTE", "FORMANDO", "PROFESSO"]).optional(),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO"]).optional(),
  fotoBase64: z.string().nullable().optional(),
  endereco: z.object({
    rua: z.string().min(3).optional(),
    numero: z.string().optional(),
    bairro: z.string().min(3).optional(),
    cidade: z.string().min(3).optional(),
    estado: z.string().length(2).optional(),
    cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  }).optional(),
});

export const aproveMemberSchema = z.object({
  tipoMembro: z.enum(["INICIANTE", "FORMANDO", "PROFESSO"]),
});

export const updateContribuicaoAnualSchema = z.object({
  status: z.enum(["PAGO", "PENDENTE"]),
  dataPagamento: z.string().datetime().nullable().optional(),
});

export const updateContribuicaoMensalSchema = z.object({
  status: z.enum(["PAGO", "PENDENTE"]),
  dataPagamento: z.string().datetime().nullable().optional(),
});

export const changeUserStatusSchema = z.object({
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO"]),
});

// Tipos TypeScript derivados das validações
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ApproveMemberInput = z.infer<typeof aproveMemberSchema>;
export type UpdateContribuicaoAnualInput = z.infer<typeof updateContribuicaoAnualSchema>;
export type UpdateContribuicaoMensalInput = z.infer<typeof updateContribuicaoMensalSchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
