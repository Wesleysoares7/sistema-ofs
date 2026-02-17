import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/UserRepository.js";
import { ContribuicaoRepository } from "../repositories/ContribuicaoRepository.js";
import { generateToken } from "../utils/jwt.js";
import { createError } from "../utils/errors.js";
import {
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  ApproveMemberInput,
  ChangeUserStatusInput,
  AdminUpdateUserInput,
} from "../schemas/index.js";

const SALT_ROUNDS = 10;

export class AuthService {
  static async register(input: CreateUserInput) {
    // Verificar se email já existe
    const existingEmail = await UserRepository.findByEmail(input.email);
    if (existingEmail) {
      throw createError(409, "Este email já está cadastrado");
    }

    // Verificar se CPF já existe
    const existingCpf = await UserRepository.findByCpf(input.cpf);
    if (existingCpf) {
      throw createError(409, "Este CPF já está cadastrado");
    }

    try {
      // Hash da senha
      const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS);

      // Criar usuário
      const user = await UserRepository.create({
        nome: input.nome,
        cpf: input.cpf,
        dataNascimento: new Date(input.dataNascimento),
        telefone: input.telefone,
        email: input.email,
        senha: senhaHash,
        fotoBase64: input.fotoBase64 || null,
        role: "MEMBER",
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

    if (user.status !== "ATIVO" && user.role !== "ADMIN") {
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
      cpf: user.cpf,
      email: user.email,
      telefone: user.telefone,
      dataNascimento: user.dataNascimento,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
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
}

export class UserService {
  static async getAllUsers(skip = 0, take = 10) {
    const users = await UserRepository.findAll(skip, take);

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      createdAt: user.createdAt,
    }));
  }

  static async getUsersByStatus(status: string, skip = 0, take = 10) {
    const users = await UserRepository.findByStatus(status, skip, take);

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      createdAt: user.createdAt,
    }));
  }

  static async getUsersByTipo(tipoMembro: string, skip = 0, take = 10) {
    const users = await UserRepository.findByTipoMembro(tipoMembro, skip, take);

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      status: user.status,
      role: user.role,
      tipoMembro: user.tipoMembro,
      createdAt: user.createdAt,
    }));
  }

  static async getAllUsersDetailed(skip = 0, take = 1000) {
    const users = await UserRepository.findAll(skip, take);

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      dataNascimento: user.dataNascimento,
      telefone: user.telefone,
      email: user.email,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  static async getUserDetail(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const contribuicaoAnual =
      await ContribuicaoRepository.findContribuicaoAnualByUser(userId);
    const contribuicaoMensal =
      await ContribuicaoRepository.findContribuicaoMensalByUser(userId);

    return {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      email: user.email,
      telefone: user.telefone,
      dataNascimento: user.dataNascimento,
      role: user.role,
      status: user.status,
      tipoMembro: user.tipoMembro,
      fotoBase64: user.fotoBase64 || null,
      endereco: user.endereco,
      contribuicaoAnual,
      contribuicaoMensal,
      createdAt: user.createdAt,
    };
  }

  static async approveMember(userId: string, input: ApproveMemberInput) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
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

  static async changeUserStatus(userId: string, input: ChangeUserStatusInput) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const updatedUser = await UserRepository.update(userId, {
      status: input.status,
    });

    return {
      id: updatedUser.id,
      status: updatedUser.status,
      message: `Status alterado para ${input.status}`,
    };
  }

  static async getDashboardStats() {
    const totalMembers = await UserRepository.countByRole("MEMBER");
    const totalAdmins = await UserRepository.countByRole("ADMIN");
    const activeMembers = await UserRepository.countByStatus("ATIVO");
    const pendingMembers = await UserRepository.countByStatus("PENDENTE");
    const inactiveMembers = await UserRepository.countByStatus("INATIVO");

    return {
      totalMembers,
      totalAdmins,
      activeMembers,
      pendingMembers,
      inactiveMembers,
    };
  }

  static async setTipoMembro(userId: string, tipoMembro: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

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

  static async updateUser(userId: string, input: AdminUpdateUserInput) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    const updateData: any = {};

    if (input.nome) updateData.nome = input.nome;
    if (input.cpf) {
      const normalizedCpf = input.cpf.replace(/\D/g, "");
      if (normalizedCpf !== user.cpf) {
        const existingCpf = await UserRepository.findByCpf(normalizedCpf);
        if (existingCpf) {
          throw createError(409, "Este CPF já está cadastrado");
        }
      }
      updateData.cpf = normalizedCpf;
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
    if (input.tipoMembro) {
      if (!["INICIANTE", "FORMANDO", "PROFESSO"].includes(input.tipoMembro)) {
        throw createError(400, "Tipo de membro inválido");
      }
      updateData.tipoMembro = input.tipoMembro;
    }
    if (input.fotoBase64 !== undefined) {
      updateData.fotoBase64 = input.fotoBase64 || null;
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
      cpf: updatedUser.cpf,
      telefone: updatedUser.telefone,
      dataNascimento: updatedUser.dataNascimento,
      status: updatedUser.status,
      tipoMembro: updatedUser.tipoMembro,
      fotoBase64: updatedUser.fotoBase64 || null,
      endereco: updatedUser.endereco,
      message: "Usuário atualizado com sucesso",
    };
  }

  static async deleteUser(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw createError(404, "Usuário não encontrado");
    }

    if (user.role === "ADMIN") {
      throw createError(400, "Não é permitido excluir administradores");
    }

    await UserRepository.delete(userId);

    return {
      id: userId,
      message: "Usuário excluído com sucesso",
    };
  }
}
