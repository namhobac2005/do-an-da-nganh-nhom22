import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";

const router = Router();

// Nhật ký thiết bị
router.get("/devices/:deviceId/logs", reportController.getDeviceLogs);

// Báo cáo thiết bị
router.get("/devices/:deviceId", reportController.getDeviceReport);

// Báo cáo cảm biến
router.get("/sensors", reportController.getSensorReport);

// Tất cả nhật ký
router.get("/logs", reportController.getAllLogs);

export default router;
