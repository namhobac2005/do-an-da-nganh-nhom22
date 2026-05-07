import { Router } from "express";
import * as deviceController from "../controllers/device.controller.ts"; // Giữ đuôi .js nếu Node.js đang chạy ở mode ES Modules

const router = Router();

// Lấy danh sách thiết bị
// API: GET http://localhost:5000/api/devices
router.get("/", deviceController.getDevices);

// Lấy thiết bị theo ID
// API: GET http://localhost:5000/api/devices/:id
router.get("/:id", deviceController.getDevice);

// Lấy nhật ký điều khiển thiết bị
// API: GET http://localhost:5000/api/devices/logs
router.get("/logs", deviceController.getDeviceLogs);

// Xử lý lệnh điều khiển thiết bị
// API: POST http://localhost:5000/api/devices/:id/control
router.post("/:id/control", deviceController.controlDevice);

// Tạo thiết bị mới
// API: POST http://localhost:5000/api/devices
router.post("/", deviceController.createDevice);

// Cập nhật thiết bị
// API: PUT http://localhost:5000/api/devices/:id
router.put("/:id", deviceController.updateDevice);

// Xóa thiết bị
// API: DELETE http://localhost:5000/api/devices/:id
router.delete("/:id", deviceController.deleteDevice);

export default router;
