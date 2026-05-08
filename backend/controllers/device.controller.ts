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
    const deviceId = req.params.id as string;

    // Mức độ (0, 1, 2, 3, 4) lấy từ body gửi lên
    const { level } = req.body;

    // Lấy ID user từ req.user (Do Middleware Auth gắn vào)
    const userId = req.user?.id ? String(req.user.id) : undefined;

    // Gọi xuống tầng Service
    const result = await deviceService.controlDevice(deviceId, level, userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDeviceLogs = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    const actuatorId = req.query.actuatorId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const logs = await deviceService.getDeviceLogs(limit, actuatorId, from, to);
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo thiết bị mới
export const createDevice = async (req: Request, res: Response) => {
  try {
    const { name, type, feed_key, pond_id, mode, description } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc: name, type",
      });
    }

    // Kiểm tra loại thiết bị hợp lệ
    const validTypes = ["pump", "fan", "light", "servo"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Loại thiết bị không hợp lệ. Phải là: ${validTypes.join(", ")}`,
      });
    }

    const device = await deviceService.createDevice({
      name,
      type,
      feed_key: feed_key || undefined,
      pond_id,
      mode: mode || "manual",
      description,
    });

    res.status(201).json({
      success: true,
      message: "Tạo thiết bị thành công",
      data: device,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật thiết bị
export const updateDevice = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.id as string;
    const { name, type, feed_key, pond_id, mode, description } = req.body;

    // Kiểm tra loại thiết bị nếu được cung cấp
    if (type) {
      const validTypes = ["pump", "fan", "light", "servo"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Loại thiết bị không hợp lệ. Phải là: ${validTypes.join(", ")}`,
        });
      }
    }

    const device = await deviceService.updateDevice(deviceId, {
      name,
      type,
      feed_key,
      pond_id,
      mode,
      description,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật thiết bị thành công",
      data: device,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa thiết bị
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.id as string;
    const result = await deviceService.deleteDevice(deviceId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy thiết bị theo ID
export const getDevice = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.id as string;
    const device = await deviceService.getDeviceById(deviceId);
    res.status(200).json(device);
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};
