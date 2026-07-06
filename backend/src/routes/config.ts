import { Router } from "express";
import { configController } from "../controllers/ConfigController.js";
import {
	authenticate,
	requireLocalOrRegionalAdmin,
	requireRegionalAdmin,
} from "../middlewares/auth.js";

const router = Router();

// GET /api/config - Obtém configurações de valores e PIX (público)
router.get("/", configController.getConfig);

// PUT /api/config - Atualiza configurações regionais (apenas admin regional)
router.put(
	"/",
	authenticate,
	requireRegionalAdmin,
	configController.updateConfig,
);

// GET /api/config/fraternidade-financeira - Configuração mensal da fraternidade do usuário autenticado
router.get(
	"/fraternidade-financeira",
	authenticate,
	(req, res) => configController.getFraternidadeFinanceiraConfig(req, res),
);
// PUT /api/config/fraternidade-financeira - Configuração mensal por fraternidade (apenas administradores)
router.put(
	"/fraternidade-financeira",
	authenticate,
	requireLocalOrRegionalAdmin,
	(req, res) => configController.updateFraternidadeFinanceiraConfig(req, res),
);

export default router;
