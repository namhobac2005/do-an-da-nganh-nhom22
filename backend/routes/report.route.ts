import { Router } from "express";
import * as reportController from "../controllers/report.controller.ts";

const router = Router();

router.get("/dashboard", reportController.getDashboardReport);

export default router;
