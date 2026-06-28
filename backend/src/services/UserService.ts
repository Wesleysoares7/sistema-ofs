import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/UserRepository.js";
import { ContribuicaoRepository } from "../repositories/ContribuicaoRepository.js";
import { FraternidadeRepository } from "../repositories/FraternidadeRepository.js";
import { generateToken } from "../utils/jwt.js";
import { createError } from "../utils/errors.js";
import { generateBadgeToken, verifyBadgeToken } from "../utils/jwt.js";
import {
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  ApproveMemberInput,
  ChangeUserStatusInput,
  AdminUpdateUserInput,
} from "../schemas/index.js";

const SALT_ROUNDS = 10;

export interface AccessScope {
  userId: string;
  role: string;
  fraternidadeId?: string | null;
}

function isRegionalAdminRole(role?: string) {
  return role === "ADMIN_REGIONAL" || role === "ADMIN";
}

function isLocalAdminRole(role?: string) {
  return role === "ADMIN_LOCAL";
}

function isAdminRole(role?: string) {
  return isRegionalAdminRole(role) || isLocalAdminRole(role);
}

function isMemberRole(role?: string) {
  return role === "IRMAO_MEMBRO" || role === "MEMBER";
}

function buildUserFilterFromScope(scope?: AccessScope) {
  if (!scope) return undefined;

  if (isRegionalAdminRole(scope.role)) {
    return undefined;
  }

  if (isLocalAdminRole(scope.role)) {
    if (!scope.fraternidadeId) {
      throw createError(403, "Administrador local sem fraternidade vinculada");
    }

    return { fraternidadeId: scope.fraternidadeId };
  }

  if (isMemberRole(scope.role)) {
    return { userId: scope.userId };
  }

  throw createError(403, "Perfil sem permissão para acessar este recurso");
}

function assertCanAccessUser(scope: AccessScope | undefined, targetUser: any) {
  if (!scope) return;

  if (isRegionalAdminRole(scope.role)) return;

  if (isLocalAdminRole(scope.role)) {
    if (targetUser.id === scope.userId) {
      return;
    }

    if (!scope.fraternidadeId || targetUser.fraternidadeId !== scope.fraternidadeId) {
      throw createError(403, "Sem permissão para acessar usuário de outra fraternidade");
    }
    return;
  }

  if (isMemberRole(scope.role) && targetUser.id !== scope.userId) {
    throw createError(403, "Sem permissão para acessar dados de outro usuário");
  }
}

export class AuthService {
  static async register(input: CreateUserInput) {
    // Verificar se email já existe
    const existingEmail = await UserRepository.findByEmail(input.email);
    if (existingEmail) {
      throw createError(409, "Este email já está cadastrado");
    }

    const normalizedCpf = input.cpf?.replace(/\D/g, "") || null;

    // Verificar se CPF já existe (apenas quando informado)
    if (normalizedCpf) {
      const existingCpf = await UserRepository.findByCpf(normalizedCpf);
      if (existingCpf) {
        throw createError(409, "Este CPF já está cadastrado");
      }
    }

    try {
      const fraternidade = await FraternidadeRepository.findById(input.fraternidadeId);
      if (!fraternidade) {
        throw createError(400, "Fraternidade selecionada não encontrada");
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS);

      // Criar usuário
      const user = await UserRepository.create({
        nome: input.nome,
        cpf: normalizedCpf,
        dataNascimento: new Date(input.dataNascimento),
        telefone: input.telefone,
        email: input.email,
        senha: senhaHash,
        fotoBase64: input.fotoBase64 || null,
        fraternidadeId: fraternidade.id,
        role: "IRMAO_MEMBRO",
        status: "PENDENTE",
        endereco: {
          create: input.endereco,
        },
      });

      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        status: user.status,
        message: "Cadastro realizado. Aguarde aprovação do administrador.",
      };
    } catch (error: any) {
      console.error("Erro ao criar usuário no banco de dados:", error.message);
      throw error;
    }
  }

  static async login(input: LoginInput) {
    const user = await UserRepository.findByEmail(input.email);

    if (!user) {
      throw createError(401, "Email ou senha inválidos");
    }

    const senhaValida = await bcrypt.compare(input.senha, user.senha);
    if (!senhaValida) {
      throw createError(401, "Email ou senha inválidos");
    }

    if (user.status !== "ATIVO" && !isAdminRole(user.role)) {
      throw createError(
        403,
        "Sua conta não está ativa. Entre em contato com o administrador.",
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      fraternidadeId: user.fraternidadeId,
    });

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        status: user.status,
        tipoMembro: user.tipoMembro,
        fraternidadeId: user.fraternidadeId,
      },
    };
  }

  static async getProfile(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    return {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf || "",
      email: user.email,
      telefone: user.telefone,
      dataNascimento: user.dataNascimento,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      fraternidade: user.fraternidade
        ? {
            id: user.fraternidade.id,
            nomeFraternidade: user.fraternidade.nomeFraternidade,
            contatoMinistro: user.fraternidade.contatoMinistro,
          }
        : null,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
      updatedAt: user.updatedAt,
    };
  }

  static async updateProfile(userId: string, input: UpdateUserInput) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const updateData: any = {};

    if (input.nome) updateData.nome = input.nome;
    if (input.telefone) updateData.telefone = input.telefone;
    if (input.fotoBase64 !== undefined) {
      updateData.fotoBase64 = input.fotoBase64 || null;
    }

    if (input.endereco) {
      // Criar ou atualizar endereço
      if (user.endereco) {
        updateData.endereco = {
          update: input.endereco,
        };
      } else {
        updateData.endereco = {
          create: input.endereco,
        };
      }
    }

    const updatedUser = await UserRepository.update(userId, updateData);

    return {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      telefone: updatedUser.telefone,
      fotoBase64: updatedUser.fotoBase64 || null,
      endereco: updatedUser.endereco,
    };
  }

  static async getBadgeData(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const badgeToken = generateBadgeToken(user.id);

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/validar-cracha/${badgeToken}`;

    return {
      token: badgeToken,
      verificationUrl,
      member: {
        id: user.id,
        nome: user.nome,
        tipoMembro: user.tipoMembro,
        status: user.status,
        role: user.role,
        fotoBase64: user.fotoBase64 || null,
        fraternidade: user.fraternidade
          ? {
              id: user.fraternidade.id,
              nomeFraternidade: user.fraternidade.nomeFraternidade,
              cidade: user.fraternidade.cidade,
              distrito: user.fraternidade.distrito,
            }
          : null,
      },
      issuedAt: new Date().toISOString(),
    };
  }

  static async verifyBadgeData(token: string) {
    let payload: { type: "badge"; userId: string };

    try {
      payload = verifyBadgeToken(token);
    } catch {
      throw createError(400, "Token de crachá inválido ou expirado");
    }

    if (payload.type !== "badge") {
      throw createError(400, "Token de crachá inválido");
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const activeMemberRoles = ["IRMAO_MEMBRO", "MEMBER", "ADMIN_LOCAL"];
    const valid = user.status === "ATIVO" && activeMemberRoles.includes(user.role);

    return {
      valid,
      checkedAt: new Date().toISOString(),
      member: {
        id: user.id,
        nome: user.nome,
        tipoMembro: user.tipoMembro,
        status: user.status,
        role: user.role,
        fraternidade: user.fraternidade
          ? {
              nomeFraternidade: user.fraternidade.nomeFraternidade,
              cidade: user.fraternidade.cidade,
              distrito: user.fraternidade.distrito,
            }
          : null,
      },
    };
  }
}

export class UserService {
  static async getAllUsers(skip = 0, take = 10, scope?: AccessScope) {
    const users = await UserRepository.findAll(
      skip,
      take,
      buildUserFilterFromScope(scope),
    );

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf || "",
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      createdAt: user.createdAt,
    }));
  }

  static async getUsersByStatus(
    status: string,
    skip = 0,
    take = 10,
    scope?: AccessScope,
  ) {
    const users = await UserRepository.findByStatus(
      status,
      skip,
      take,
      buildUserFilterFromScope(scope),
    );

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf || "",
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      createdAt: user.createdAt,
    }));
  }

  static async getUsersByTipo(
    tipoMembro: string,
    skip = 0,
    take = 10,
    scope?: AccessScope,
  ) {
    const users = await UserRepository.findByTipoMembro(
      tipoMembro,
      skip,
      take,
      buildUserFilterFromScope(scope),
    );

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf || "",
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      createdAt: user.createdAt,
    }));
  }

  static async getAllUsersDetailed(skip = 0, take = 1000, scope?: AccessScope) {
    const users = await UserRepository.findAll(
      skip,
      take,
      buildUserFilterFromScope(scope),
    );

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      cpf: user.cpf || "",
      dataNascimento: user.dataNascimento,
      telefone: user.telefone,
      email: user.email,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  static async getUserDetail(userId: string, scope?: AccessScope) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    const contribuicaoAnual =
      await ContribuicaoRepository.findContribuicaoAnualByUser(userId);
    const contribuicaoMensal =
      await ContribuicaoRepository.findContribuicaoMensalByUser(userId);

    return {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf || "",
      email: user.email,
      telefone: user.telefone,
      dataNascimento: user.dataNascimento,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fraternidadeId: user.fraternidadeId,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
      contribuicaoAnual,
      contribuicaoMensal,
      createdAt: user.createdAt,
    };
  }

  static async approveMember(
    userId: string,
    input: ApproveMemberInput,
    scope?: AccessScope,
  ) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    if (!user.fraternidadeId) {
      throw createError(
        400,
        "Não é possível aprovar sem fraternidade vinculada",
      );
    }

    try {
      const updatedUser = await UserRepository.update(userId, {
        status: "ATIVO",
        tipoMembro: input.tipoMembro,
      });

      // Criar contribuições anuais e mensais para o membro aprovado
      const currentYear = new Date().getFullYear();
      
      try {
        await ContribuicaoRepository.createMultipleContribuicaoAnual(userId, [
          currentYear - 1,
          currentYear,
        ]);
      } catch (error: any) {
        console.warn("⚠️ Contribuições anuais podem já existir:", error.message);
      }

      try {
        await ContribuicaoRepository.createAnoContribuicoesMensais(
          userId,
          currentYear,
        );
      } catch (error: any) {
        console.warn("⚠️ Contribuições mensais podem já existir:", error.message);
      }

      return {
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        status: updatedUser.status,
        tipoMembro: updatedUser.tipoMembro,
        message: "Membro aprovado com sucesso",
      };
    } catch (error: any) {
      console.error("❌ Erro ao aprovar membro:", error.message);
      throw error;
    }
  }

  static async changeUserStatus(
    userId: string,
    input: ChangeUserStatusInput,
    scope?: AccessScope,
  ) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    const updatedUser = await UserRepository.update(userId, {
      status: input.status,
    });

    return {
      id: updatedUser.id,
      status: updatedUser.status,
      message: `Status alterado para ${input.status}`,
    };
  }

  static async getDashboardStats(scope?: AccessScope) {
    const filter = buildUserFilterFromScope(scope);

    const totalMembers =
      (await UserRepository.countByRole("IRMAO_MEMBRO", filter)) +
      (await UserRepository.countByRole("MEMBER", filter));
    const totalAdmins =
      (await UserRepository.countByRole("ADMIN_REGIONAL", filter)) +
      (await UserRepository.countByRole("ADMIN_LOCAL", filter)) +
      (await UserRepository.countByRole("ADMIN", filter));
    const activeMembers = await UserRepository.countByStatus("ATIVO", filter);
    const pendingMembers = await UserRepository.countByStatus(
      "PENDENTE",
      filter,
    );
    const inactiveMembers = await UserRepository.countByStatus(
      "INATIVO",
      filter,
    );

    return {
      totalMembers,
      totalAdmins,
      activeMembers,
      pendingMembers,
      inactiveMembers,
    };
  }

  static async setTipoMembro(
    userId: string,
    tipoMembro: string,
    scope?: AccessScope,
  ) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    if (!["INICIANTE", "FORMANDO", "PROFESSO"].includes(tipoMembro)) {
      throw createError(400, "Tipo de membro inválido");
    }

    const updatedUser = await UserRepository.update(userId, {
      tipoMembro,
    });

    return {
      id: updatedUser.id,
      tipoMembro: updatedUser.tipoMembro,
      message: "Tipo de membro atualizado",
    };
  }

  static async updateUser(
    userId: string,
    input: AdminUpdateUserInput,
    scope?: AccessScope,
  ) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    const updateData: any = {};

    if (input.nome) updateData.nome = input.nome;
    if (input.cpf !== undefined) {
      const normalizedCpf = input.cpf.replace(/\D/g, "").trim();

      if (!normalizedCpf) {
        updateData.cpf = null;
      } else {
        if (normalizedCpf !== (user.cpf || "")) {
          const existingCpf = await UserRepository.findByCpf(normalizedCpf);
          if (existingCpf && existingCpf.id !== user.id) {
            throw createError(409, "Este CPF já está cadastrado");
          }
        }
        updateData.cpf = normalizedCpf;
      }
    }
    if (input.email) {
      const normalizedEmail = input.email.toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingEmail = await UserRepository.findByEmail(normalizedEmail);
        if (existingEmail) {
          throw createError(409, "Este email já está cadastrado");
        }
      }
      updateData.email = normalizedEmail;
    }
    if (input.dataNascimento) {
      updateData.dataNascimento = new Date(input.dataNascimento);
    }
    if (input.telefone) updateData.telefone = input.telefone;
    if (input.status) updateData.status = input.status;
    if (input.role !== undefined) {
      if (!isRegionalAdminRole(scope?.role)) {
        throw createError(
          403,
          "Somente o administrador regional pode alterar perfil de acesso",
        );
      }

      if (user.role === "ADMIN_REGIONAL" || user.role === "ADMIN") {
        throw createError(
          400,
          "Não é permitido alterar o perfil de administradores regionais",
        );
      }

      if (!["ADMIN_LOCAL", "IRMAO_MEMBRO", "MEMBER"].includes(input.role)) {
        throw createError(400, "Perfil de acesso inválido");
      }

      updateData.role = input.role;
    }
    if (input.tipoMembro) {
      if (!["INICIANTE", "FORMANDO", "PROFESSO"].includes(input.tipoMembro)) {
        throw createError(400, "Tipo de membro inválido");
      }
      updateData.tipoMembro = input.tipoMembro;
    }
    if (input.fotoBase64 !== undefined) {
      updateData.fotoBase64 = input.fotoBase64 || null;
    }
    if (input.fraternidadeId !== undefined) {
      if (!isRegionalAdminRole(scope?.role)) {
        throw createError(
          403,
          "Somente o administrador regional pode transferir membro de fraternidade",
        );
      }

      const fraternidadeId = input.fraternidadeId?.trim();
      if (!fraternidadeId) {
        throw createError(400, "Fraternidade de destino é obrigatória");
      }

      const fraternidade = await FraternidadeRepository.findById(fraternidadeId);
      if (!fraternidade) {
        throw createError(400, "Fraternidade informada não encontrada");
      }

      updateData.fraternidadeId = fraternidade.id;
    }
    if (input.senha) {
      updateData.senha = await bcrypt.hash(input.senha, SALT_ROUNDS);
    }

    if (input.endereco) {
      if (user.endereco) {
        updateData.endereco = {
          update: input.endereco,
        };
      } else {
        updateData.endereco = {
          create: input.endereco,
        };
      }
    }

    const updatedUser = await UserRepository.update(userId, updateData);

    return {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      cpf: updatedUser.cpf || "",
      telefone: updatedUser.telefone,
      dataNascimento: updatedUser.dataNascimento,
      status: updatedUser.status,
      tipoMembro: updatedUser.tipoMembro,
      fraternidadeId: updatedUser.fraternidadeId,
      fotoBase64: updatedUser.fotoBase64 || null,
      endereco: updatedUser.endereco,
      message: "Usuário atualizado com sucesso",
    };
  }

  static async deleteUser(userId: string, scope?: AccessScope) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    assertCanAccessUser(scope, user);

    if (isAdminRole(user.role)) {
      throw createError(400, "Não é permitido excluir administradores");
    }

    await UserRepository.delete(userId);

    return {
      id: userId,
      message: "Usuário excluído com sucesso",
    };
  }
}
