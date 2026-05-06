import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.ts';
import * as zoneController from '../controllers/zone.controller.ts';

const router = Router();

// NOTE: /farming-types MUST be registered before /:id to avoid
// Express matching "farming-types" as the :id parameter.
router.get   ('/farming-types', requireAdmin, zoneController.listFarmingTypes);

router.get   ('/',    requireAdmin, zoneController.listZones);
router.post  ('/',    requireAdmin, zoneController.createZone);
router.get   ('/:id', requireAdmin, zoneController.getZone);
router.put   ('/:id', requireAdmin, zoneController.updateZone);
router.delete('/:id', requireAdmin, zoneController.deleteZone);

export default router;
