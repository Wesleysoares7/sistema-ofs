import { Request, Response } from "express";
import { AuthService, UserService } from "../services/UserService.js";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      console.log("📝 Registrando novo usuário:", {
        nome: req.body.nome,
        email: req.body.email,
        cpf: req.body.cpf,
      });
      const result = await AuthService.register(req.body);
      console.log("✅ Usuário registrado com sucesso:", result.id);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("❌ Erro ao registrar:", err.message);
      console.error("Stack:", err.stack);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const result = await AuthService.getProfile(req.userId!);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const result = await AuthService.updateProfile(req.userId!, req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;

      const result = await UserService.getAllUsers(skip, take);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getUsersByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;

      const result = await UserService.getUsersByStatus(status, skip, take);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getUsersByTipo(req: Request, res: Response) {
    try {
      const { tipoMembro } = req.params;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;

      const result = await UserService.getUsersByTipo(tipoMembro, skip, take);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getAllUsersDetailed(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 1000;

      const result = await UserService.getAllUsersDetailed(skip, take);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getUserDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.getUserDetail(id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async approveMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("✅ Aprovando membro:", id, "com dados:", req.body);
      const result = await UserService.approveMember(id, req.body);
      console.log("✅ Membro aprovado com sucesso:", result.id);
      res.status(200).json(result);
    } catch (err: any) {
      console.error("❌ Erro ao aprovar membro:", err.message);
      console.error("Stack:", err.stack);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async changeUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.changeUserStatus(id, req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async setTipoMembro(req: Request, res: Response) {
    try {
      const { id, tipoMembro } = req.params;
      const result = await UserService.setTipoMembro(id, tipoMembro);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.updateUser(id, req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  static async getDashboardStats(req: Request, res: Response) {
    try {
      const result = await UserService.getDashboardStats();
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
