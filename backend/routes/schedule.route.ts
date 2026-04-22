import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.ts";

const router = Router();

router.get("/", scheduleController.getSchedules);
router.post("/", scheduleController.createSchedule);
router.patch("/:id/cancel", scheduleController.cancelSchedule);

export default router;
