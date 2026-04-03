import { Router } from 'express';
import * as sensorController from '../controllers/sensor.controller.js';

const router = Router();

// Route cho Cards (Giá trị hiện tại)
router.get('/', sensorController.getAllLatest);

// Route cho Chart (Lịch sử)
router.get('/history', sensorController.getHistory);

export default router;
