import { Router } from "express";
import { configController } from "../controllers/ConfigController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// GET /api/config - Obtém configurações de valores e PIX (público)
router.get("/", configController.getConfig);

// PUT /api/config - Atualiza configurações (apenas admin)
router.put("/", authenticate, requireAdmin, configController.updateConfig);

export default router;
