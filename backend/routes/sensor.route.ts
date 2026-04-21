import { Router } from 'express';
import * as sensorController from '../controllers/sensor.controller.js';

const router = Router();

// Route lấy Metadata
router.get('/zones', sensorController.getAllZones);
router.get('/zones/:zoneId/ponds', sensorController.getPondsByZone);

// Route lấy Data cảm biến (Truyền ?pondId=... qua query)
router.get('/latest', sensorController.getLatestByPond);
router.get('/history', sensorController.getHistoryByPond);

export default router;
