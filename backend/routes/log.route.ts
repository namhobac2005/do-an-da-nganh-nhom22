import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import * as logController from "../controllers/log.controller.ts";

const router = Router();

/** GET /admin/logs?page=1&limit=20 */
router.get("/", verifyToken(["admin"]), logController.getLogs);

export default router;
