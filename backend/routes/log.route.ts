import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.ts';
import * as logController from '../controllers/log.controller.ts';

const router = Router();

/** GET /admin/logs?page=1&limit=20 */
router.get('/', requireAdmin, logController.getLogs);

export default router;
