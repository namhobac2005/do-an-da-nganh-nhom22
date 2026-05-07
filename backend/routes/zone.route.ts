import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as zoneController from '../controllers/zone.controller';

const router = Router();

// Cả Admin và User đều dùng chung endpoint này để lấy vùng của mình
router.get('/', verifyToken(), zoneController.getAllZones);
// ... các route POST, PUT, DELETE
// Chỉ Admin mới có quyền thao tác dữ liệu
router.post('/', verifyToken(['admin']), zoneController.createZone);
router.put('/:id', verifyToken(['admin']), zoneController.updateZone);
router.delete('/:id', verifyToken(['admin']), zoneController.deleteZone);
router.get('/:id', verifyToken(), zoneController.getZoneById);
export default router;
