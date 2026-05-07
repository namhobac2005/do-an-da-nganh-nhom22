import { Router } from 'express';
import * as sensorController from '../controllers/sensor.controller.js';
import { verifyToken } from '../middleware/auth.middleware';
const router = Router();

// Route lấy Metadata
router.get('/zones', verifyToken(), sensorController.getAllZones);
router.get(
  '/zones/:zoneId/ponds',
  verifyToken(),
  sensorController.getPondsByZone,
);

// Route lấy Data cảm biến (Truyền ?pondId=... qua query)
router.get('/latest', verifyToken(), sensorController.getLatestByPond);
router.get('/history', verifyToken(), sensorController.getHistoryByPond);

export default router;
