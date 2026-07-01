import { Router } from "express";
import { FraternidadeController } from "../controllers/FraternidadeController.js";
import {
  authenticate,
  requireLocalOrRegionalAdmin,
  requireRegionalAdmin,
} from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validation.js";
import {
  createFraternidadeSchema,
  updateFraternidadeSchema,
} from "../schemas/index.js";

const router = Router();

router.get("/public", FraternidadeController.getPublicList);

router.get(
  "/",
  authenticate,
  requireLocalOrRegionalAdmin,
  FraternidadeController.getAll,
);
router.get(
  "/:id",
  authenticate,
  requireLocalOrRegionalAdmin,
  FraternidadeController.getById,
);

// Conselho local: cadastro exclusivo do admin regional
router.post(
  "/",
  authenticate,
  requireRegionalAdmin,
  validateBody(createFraternidadeSchema),
  FraternidadeController.create,
);
router.post(
  "/conselhos-locais",
  authenticate,
  requireRegionalAdmin,
  validateBody(createFraternidadeSchema),
  FraternidadeController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRegionalAdmin,
  validateBody(updateFraternidadeSchema),
  FraternidadeController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRegionalAdmin,
  FraternidadeController.delete,
);

export default router;
