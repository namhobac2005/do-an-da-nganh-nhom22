import { Router } from 'express';
import * as deviceController from '../controllers/device.controller.ts'; // Giữ đuôi .js nếu Node.js đang chạy ở mode ES Modules

const router = Router();

// Lấy danh sách thiết bị
// API: GET http://localhost:5000/api/devices
router.get('/', deviceController.getDevices);

// Xử lý lệnh điều khiển thiết bị
// API: POST http://localhost:5000/api/devices/1/control
router.post('/:id/control', deviceController.controlDevice);

export default router;
