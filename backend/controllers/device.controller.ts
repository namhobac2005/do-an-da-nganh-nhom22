import { Request, Response } from "express";
import * as deviceService from "../services/device.service.ts"; // Import service của bạn

// Định nghĩa lại kiểu cho Request vì mặc định Express không có thuộc tính `req.user`
interface CustomRequest extends Request {
  user?: {
    id: number | string;
    role?: string;
  };
}

// Lấy danh sách thiết bị
export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await deviceService.getAllDevices();
    res.status(200).json(devices);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xử lý lệnh điều khiển thiết bị
export const controlDevice = async (req: CustomRequest, res: Response) => {
  try {
    // ID thiết bị lấy từ URL (/api/devices/1/control)
    const deviceId = req.params.id;

    // Mức độ (0, 1, 2, 3, 4) lấy từ body gửi lên
    const { level } = req.body;

    // Lấy ID user từ req.user (Do Middleware Auth gắn vào)
    const userId = req.user ? req.user.id : null;

    // Gọi xuống tầng Service
    const result = await deviceService.controlDevice(deviceId, level, userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get device logs
export const getDeviceLogs = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.id;
    const { from, to, limit = "50" } = req.query;
    // Import report service here or move logic
    // For simplicity, use supabase direct or report service
    res
      .status(501)
      .json({ success: false, message: "Use /reports/devices/:id/logs" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
