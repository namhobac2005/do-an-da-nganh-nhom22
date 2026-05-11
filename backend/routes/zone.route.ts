import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as zoneController from '../controllers/zone.controller';

const router = Router();

router.get('/', verifyToken(), zoneController.getZones);
router.get('/:id', verifyToken(), zoneController.getZoneDetail);

export default router;
