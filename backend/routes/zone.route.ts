import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as zoneController from '../controllers/zone.controller';

const router = Router();

// Farming types — MUST be before /:id to avoid route conflict
router.get('/farming-types', verifyToken(), zoneController.getFarmingTypes);

// Cả Admin và User đều dùng chung endpoint này để lấy vùng của mình
router.get('/', verifyToken(), zoneController.getAllZones);

// Chỉ Admin mới có quyền thao tác dữ liệu
router.post('/',    verifyToken(['admin']), zoneController.createZone);
router.put('/:id',  verifyToken(['admin']), zoneController.updateZone);
router.delete('/:id', verifyToken(['admin']), zoneController.deleteZone);

// Chi tiết — mọi user đã xác thực
router.get('/:id', verifyToken(), zoneController.getZoneById);

export default router;
