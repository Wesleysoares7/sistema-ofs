import { Router } from "express";
import { avisoController } from "../controllers/AvisoController.js";
import {
  authenticate,
  requireAdmin,
  requireActive,
} from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticate, requireActive, avisoController.getMemberAvisos);
router.get("/admin", authenticate, requireAdmin, avisoController.getAdminAvisos);
router.post("/", authenticate, requireAdmin, avisoController.createAviso);
router.put("/:id", authenticate, requireAdmin, avisoController.updateAviso);
router.delete("/:id", authenticate, requireAdmin, avisoController.deleteAviso);

export default router;
