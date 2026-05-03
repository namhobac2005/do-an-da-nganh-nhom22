import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.ts';
import * as zoneController from '../controllers/zone.controller.ts';

const router = Router();

router.get   ('/',    requireAdmin, zoneController.listZones);
router.post  ('/',    requireAdmin, zoneController.createZone);
router.put   ('/:id', requireAdmin, zoneController.updateZone);
router.delete('/:id', requireAdmin, zoneController.deleteZone);

export default router;
