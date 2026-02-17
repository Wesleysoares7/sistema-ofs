import { Router } from "express";
import { UserController } from "../controllers/AuthController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validation.js";
import {
  aproveMemberSchema,
  adminUpdateUserSchema,
  changeUserStatusSchema,
} from "../schemas/index.js";

const router = Router();

// Listar todos usuários - apenas ADMIN
router.get("/", authenticate, requireAdmin, UserController.getAllUsers);

// Listar usuários por status - apenas ADMIN
router.get(
  "/status/:status",
  authenticate,
  requireAdmin,
  UserController.getUsersByStatus,
);

// Listar usuários por tipo - apenas ADMIN
router.get(
  "/tipo/:tipoMembro",
  authenticate,
  requireAdmin,
  UserController.getUsersByTipo,
);

// Listar usuários com detalhes - apenas ADMIN
router.get(
  "/detailed",
  authenticate,
  requireAdmin,
  UserController.getAllUsersDetailed,
);

// Dashboard stats - apenas ADMIN
router.get(
  "/dashboard/stats",
  authenticate,
  requireAdmin,
  UserController.getDashboardStats,
);

// Detalhe do usuário - apenas ADMIN
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  UserController.getUserDetail,
);

// Aprovar membro - apenas ADMIN
router.post(
  "/:id/approve",
  authenticate,
  requireAdmin,
  validateBody(aproveMemberSchema),
  UserController.approveMember,
);

// Mudar status do usuário - apenas ADMIN
router.put(
  "/:id/status",
  authenticate,
  requireAdmin,
  validateBody(changeUserStatusSchema),
  UserController.changeUserStatus,
);

// Definir tipo de membro - apenas ADMIN
router.put(
  "/:id/tipo/:tipoMembro",
  authenticate,
  requireAdmin,
  UserController.setTipoMembro,
);

// Atualizar usuário - apenas ADMIN
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validateBody(adminUpdateUserSchema),
  UserController.updateUser,
);

// Excluir usuário - apenas ADMIN
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  UserController.deleteUser,
);

export default router;
