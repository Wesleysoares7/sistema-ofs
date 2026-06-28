import { Router } from "express";
import { ContribuicaoController } from "../controllers/ContribuicaoController.js";
import {
  authenticate,
  requireActive,
  requireAdmin,
  requireLocalOrRegionalAdmin,
  requireRegionalAdmin,
} from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validation.js";
import {
  updateContribuicaoAnualSchema,
  updateContribuicaoMensalSchema,
} from "../schemas/index.js";

const router = Router();

// EXERCÍCIO FINANCEIRO
// Criar exercício anual (apenas administrador regional)
router.post(
  "/exercicio/anual",
  authenticate,
  requireRegionalAdmin,
  ContribuicaoController.createAnnualExercise,
);

// Gerar mensalidades para exercício (admin local da fraternidade ou regional)
router.post(
  "/exercicio/mensal",
  authenticate,
  requireLocalOrRegionalAdmin,
  ContribuicaoController.createMonthlyExercise,
);

// CONTRIBUIÇÃO ANUAL
// Listar anual por usuário
router.get(
  "/anual/:userId",
  authenticate,
  ContribuicaoController.getContribuicaoAnual,
);

// Atualizar anual - apenas ADMIN
router.put(
  "/anual/:id",
  authenticate,
  requireAdmin,
  validateBody(updateContribuicaoAnualSchema),
  ContribuicaoController.updateContribuicaoAnual,
);

// Criar contribuições anuais faltantes
router.post(
  "/anual/:userId/missing",
  authenticate,
  requireRegionalAdmin,
  ContribuicaoController.createMissingAnnualContributions,
);

// CONTRIBUIÇÃO MENSAL
// Listar mensal por usuário
router.get(
  "/mensal/:userId",
  authenticate,
  ContribuicaoController.getContribuicaoMensal,
);

// Atualizar mensal - apenas ADMIN
router.put(
  "/mensal/:id",
  authenticate,
  requireAdmin,
  validateBody(updateContribuicaoMensalSchema),
  ContribuicaoController.updateContribuicaoMensal,
);

// Criar contribuições mensais faltantes
router.post(
  "/mensal/:userId/missing",
  authenticate,
  requireAdmin,
  ContribuicaoController.createMissingMonthlyContributions,
);

// DASHBOARDS
// Dashboard do membro - contribuições
router.get(
  "/dashboard/member/:userId",
  authenticate,
  requireActive,
  ContribuicaoController.getDashboardMemberContributions,
);

// Relatório de contribuições - apenas ADMIN
router.get(
  "/dashboard/admin/report",
  authenticate,
  requireAdmin,
  ContribuicaoController.getAdminContributionsReport,
);

export default router;
