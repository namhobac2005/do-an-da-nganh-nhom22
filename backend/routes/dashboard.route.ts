// src/routes/dashboard.route.ts
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middleware/auth.middleware';
const router = Router();

router.get('/kpis', verifyToken(), dashboardController.getKPIs);
router.get('/alerts/recent', verifyToken(), dashboardController.getRecentAlerts);
router.get(
  '/zones-overview',
  verifyToken(),
  dashboardController.getZonesOverview,
);

export default router;
