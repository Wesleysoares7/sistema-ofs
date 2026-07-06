export interface User {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  fotoBase64?: string | null;
  role:
    | "ADMIN_REGIONAL"
    | "ADMIN_LOCAL"
    | "IRMAO_MEMBRO"
    | "ADMIN"
    | "MEMBER";
  status: "PENDENTE" | "ATIVO" | "INATIVO";
  tipoMembro?: "INICIANTE" | "FORMANDO" | "PROFESSO" | null;
  fraternidadeId?: string | null;
  fraternidade?: {
    id: string;
    nomeFraternidade: string;
    contatoMinistro?: string | null;
  } | null;
  endereco?: Endereco;
  createdAt?: string;
  updatedAt?: string;
}

export interface Fraternidade {
  id: string;
  nomeFraternidade: string;
  cidade: string;
  distrito: string;
  dataFundacao: string;
  status: "ATIVA" | "INATIVA";
  contatoMinistro: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Endereco {
  id?: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface ContribuicaoAnual {
  id: string;
  ano: number;
  status: "PAGO" | "PENDENTE";
  dataPagamento?: string;
  userId: string;
  createdAt?: string;
}

export interface ContribuicaoMensal {
  id: string;
  mes: number;
  ano: number;
  status: "PAGO" | "PENDENTE";
  dataPagamento?: string;
  userId: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalAdmins: number;
  activeMembers: number;
  pendingMembers: number;
  inactiveMembers: number;
}

export interface MemberDashboard {
  ano: number;
  anualContribuicoes: ContribuicaoAnual[];
  mensalContribuicoes: {
    mes: number;
    status: "PAGO" | "PENDENTE";
    dataPagamento?: string;
  }[];
  resumo: {
    mensal: {
      pagas: number;
      pendentes: number;
      total: number;
    };
  };
}

export type AvisoTipo = "EVENTO" | "COMUNICADO" | "LEMBRETE";
export type AvisoPublicoAlvo = "MEMBER" | "ADMIN" | "ALL";

export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo;
  publicoAlvo?: AvisoPublicoAlvo | null;
  dataExpiracao?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
    status: string;
    tipoMembro?: string;
    fraternidadeId?: string | null;
  };
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  senha: string;
  fraternidadeId?: string;
  endereco: Endereco;
}

export interface ApiError {
  error: string;
  statusCode: number;
  details?: Array<{
    path: string;
    message: string;
  }>;
}
