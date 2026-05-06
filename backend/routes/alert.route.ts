import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.ts';
import * as alertController from '../controllers/alert.controller.ts';

const router = Router();

// ===== THRESHOLDS (UC15) =====
router.get   ('/thresholds',      requireAdmin, alertController.listThresholds);
router.post  ('/thresholds',      requireAdmin, alertController.upsertThreshold);
router.delete('/thresholds/:id',  requireAdmin, alertController.deleteThreshold);

// ===== ALERT LOGS (UC16) =====
router.get  ('/logs',             requireAdmin, alertController.listAlertLogs);
router.get  ('/unread-count',     requireAdmin, alertController.getUnreadCount);
router.patch('/logs/:id/resolve', requireAdmin, alertController.resolveAlert);

export default router;
