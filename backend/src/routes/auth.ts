import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { validateBody } from "../middlewares/validation.js";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
} from "../schemas/index.js";
import { authenticate, requireActive } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/index.js";

const router = Router();

// Registro - sem autenticação
router.post(
  "/register",
  authLimiter,
  validateBody(createUserSchema),
  AuthController.register,
);

// Login - sem autenticação
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  AuthController.login,
);

// Perfil - com autenticação
router.get("/profile", authenticate, AuthController.getProfile);

// Atualizar perfil - com autenticação
router.put(
  "/profile",
  authenticate,
  validateBody(updateUserSchema),
  AuthController.updateProfile,
);

export default router;
