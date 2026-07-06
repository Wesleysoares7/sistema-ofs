import { z } from "zod";

function isValidCPF(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += parseInt(base[i], 10) * (factor - i);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cpf.slice(0, 9), 10);
  const secondDigit = calcDigit(cpf.slice(0, 10), 11);

  return firstDigit === parseInt(cpf[9], 10) && secondDigit === parseInt(cpf[10], 10);
}

// Validações comuns
export const createUserSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || isValidCPF(val), "CPF inválido"),
  dataNascimento: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de nascimento inválida"),
  telefone: z
    .string()
    .refine(
      (val) => val.replace(/\D/g, "").length >= 10,
      "Telefone deve ter no mínimo 10 dígitos",
    ),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  fotoBase64: z.string().optional(),
  fraternidadeId: z.string().min(1, "Fraternidade é obrigatória"),
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
  endereco: z
    .object({
      rua: z.string().min(3).optional(),
      numero: z.string().optional(),
      bairro: z.string().min(3).optional(),
      cidade: z.string().min(3).optional(),
      estado: z.string().length(2).optional(),
      cep: z
        .string()
        .regex(/^\d{5}-?\d{3}$/)
        .optional(),
    })
    .optional(),
});

export const adminUpdateUserSchema = z.object({
  nome: z.string().min(3).optional(),
  cpf: z
    .string()
    .refine((val) => !val || isValidCPF(val), "CPF inválido")
    .optional(),
  dataNascimento: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de nascimento inválida")
    .optional(),
  telefone: z
    .string()
    .refine(
      (val) => val.replace(/\D/g, "").length >= 10,
      "Telefone deve ter no mínimo 10 dígitos",
    )
    .optional(),
  email: z.string().email("Email inválido").optional(),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
  tipoMembro: z.enum(["INICIANTE", "FORMANDO", "PROFESSO"]).optional(),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO"]).optional(),
  role: z
    .enum(["ADMIN_LOCAL", "IRMAO_MEMBRO", "MEMBER"])
    .optional(),
  fotoBase64: z.string().nullable().optional(),
  fraternidadeId: z.string().min(1).nullable().optional(),
  endereco: z
    .object({
      rua: z.string().min(3).optional(),
      numero: z.string().optional(),
      bairro: z.string().min(3).optional(),
      cidade: z.string().min(3).optional(),
      estado: z.string().length(2).optional(),
      cep: z
        .string()
        .regex(/^\d{5}-?\d{3}$/)
        .optional(),
    })
    .optional(),
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

export const createFraternidadeSchema = z.object({
  nomeFraternidade: z
    .string()
    .min(3, "Nome da Fraternidade deve ter no mínimo 3 caracteres"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  distrito: z.string().min(1, "Distrito é obrigatório"),
  dataFundacao: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de fundação inválida"),
  status: z.enum(["ATIVA", "INATIVA"]).default("ATIVA"),
  contatoMinistro: z
    .string()
    .min(3, "Contato do ministro deve ter no mínimo 3 caracteres"),
});

export const updateFraternidadeSchema = z.object({
  nomeFraternidade: z
    .string()
    .min(3, "Nome da Fraternidade deve ter no mínimo 3 caracteres")
    .optional(),
  cidade: z.string().min(2, "Cidade é obrigatória").optional(),
  distrito: z.string().min(1, "Distrito é obrigatório").optional(),
  dataFundacao: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de fundação inválida")
    .optional(),
  status: z.enum(["ATIVA", "INATIVA"]).optional(),
  contatoMinistro: z
    .string()
    .min(3, "Contato do ministro deve ter no mínimo 3 caracteres")
    .optional(),
});

// Tipos TypeScript derivados das validações
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ApproveMemberInput = z.infer<typeof aproveMemberSchema>;
export type UpdateContribuicaoAnualInput = z.infer<
  typeof updateContribuicaoAnualSchema
>;
export type UpdateContribuicaoMensalInput = z.infer<
  typeof updateContribuicaoMensalSchema
>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type CreateFraternidadeInput = z.infer<typeof createFraternidadeSchema>;
export type UpdateFraternidadeInput = z.infer<typeof updateFraternidadeSchema>;
