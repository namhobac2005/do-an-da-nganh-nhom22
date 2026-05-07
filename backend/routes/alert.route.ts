import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as alertController from '../controllers/alert.controller.ts';

const router = Router();

// ===== THRESHOLDS (UC15) =====
router.get('/thresholds', verifyToken(), alertController.listThresholds);
router.post('/thresholds', verifyToken(), alertController.upsertThreshold);
router.delete(
  '/thresholds/:id',
  verifyToken(),
  alertController.deleteThreshold,
);

// ===== ALERT LOGS (UC16) =====
router.get('/logs', verifyToken(), alertController.listAlertLogs);
router.get('/unread-count', verifyToken(), alertController.getUnreadCount);
router.patch('/logs/:id/resolve', verifyToken(), alertController.resolveAlert);

export default router;
