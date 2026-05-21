import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as zoneController from '../controllers/zone.controller';

const router = Router();

// ===== ZONE ROUTES =====
router.get('/',    verifyToken(), zoneController.getZones);
router.get('/:id', verifyToken(), zoneController.getZoneDetail);
router.post('/',   verifyToken(), zoneController.createZone);
router.put('/:id', verifyToken(), zoneController.updateZone);
router.delete('/:id', verifyToken(), zoneController.deleteZone);

// ===== POND ROUTES (nested under zone) =====
router.get('/:zoneId/ponds',          verifyToken(), zoneController.getPondsByZone);
router.get('/:zoneId/ponds/:pondId',  verifyToken(), zoneController.getPondDetail);
router.post('/:zoneId/ponds',         verifyToken(), zoneController.createPond);
router.put('/:zoneId/ponds/:pondId',  verifyToken(), zoneController.updatePond);
router.delete('/:zoneId/ponds/:pondId', verifyToken(), zoneController.deletePond);

export default router;
