import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.js";

const router = Router();

// POST /schedules - Tạo mới
router.post("/", scheduleController.createSchedule);

// GET /schedules - Danh sách
router.get("/", scheduleController.getSchedules);

// PUT /schedules/:id - Cập nhật
router.put("/:id", scheduleController.updateSchedule);

// DELETE /schedules/:id - Xóa
router.delete("/:id", scheduleController.deleteSchedule);

// GET /schedules/status - Trạng thái cron
router.get("/status", scheduleController.cronStatus);

export default router;
