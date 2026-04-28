// src/routes/dashboard.route.ts
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/kpis', dashboardController.getKPIs);
router.get('/alerts/recent', dashboardController.getRecentAlerts);
router.get('/zones-overview', dashboardController.getZonesOverview);

export default router;
