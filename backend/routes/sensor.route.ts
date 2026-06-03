import { Router } from "express";
import * as sensorController from "../controllers/sensor.controller.js";
import { verifyToken } from "../middleware/auth.middleware";
const router = Router();

// Route lấy Metadata
router.get("/zones", verifyToken(), sensorController.getAllZones);
router.get(
  "/zones/:zoneId/ponds",
  verifyToken(),
  sensorController.getPondsByZone,
);

// Route lấy Data cảm biến (Truyền ?pondId=... qua query)
router.get("/latest", verifyToken(), sensorController.getLatestByPond);
router.get("/history", verifyToken(), sensorController.getHistoryByPond);

// Latest cho toàn hệ thống (theo quyền user)
router.get("/latest/all", verifyToken(), sensorController.getLatestAll);

// CRUD Sensor metadata
router.post("/", verifyToken(), sensorController.createSensor);
router.put("/:id", verifyToken(), sensorController.updateSensor);
router.delete("/:id", verifyToken(), sensorController.deleteSensor);

export default router;
