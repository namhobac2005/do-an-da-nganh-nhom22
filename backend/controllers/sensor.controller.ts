// src/controllers/sensor.controller.ts
import { Request, Response } from "express";
import * as sensorService from "../services/sensor.service.js";

// 1. Lấy tất cả Vùng nuôi (Zone) mà User được quản lý
export const getAllZones = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Yêu cầu đăng nhập" });
    }

    const data = await sensorService.getAllZones(userId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy danh sách Ao (Pond) theo Zone
// (Lưu ý: zoneId đã được truyền từ Frontend sau khi getAllZones lọc đúng quyền)
export const getPondsByZone = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Yêu cầu đăng nhập" });
    }

    const data = await sensorService.getPondsByZoneForUser(
      zoneId,
      userId,
      role,
    );
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Lấy giá trị mới nhất theo Pond cụ thể
export const getLatestByPond = async (req: Request, res: Response) => {
  try {
    const pondId = req.query.pondId as string;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Yêu cầu đăng nhập" });
    }

    const data = await sensorService.getLatestSensorsByPondForUser(
      pondId,
      userId,
      role,
    );
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Lấy lịch sử theo Pond cụ thể
export const getHistoryByPond = async (req: Request, res: Response) => {
  try {
    const pondId = req.query.pondId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Yêu cầu đăng nhập" });
    }

    const data = await sensorService.getSensorHistoryByPondForUser(
      pondId,
      limit,
      userId,
      role,
    );
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
