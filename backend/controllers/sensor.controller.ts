import { Request, Response } from 'express';
import * as sensorService from '../services/sensor.service.js';

// 1. Lấy tất cả Vùng nuôi (Zone)
export const getAllZones = async (req: Request, res: Response) => {
  try {
    const data = await sensorService.getAllZones();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy danh sách Ao (Pond) theo Zone
export const getPondsByZone = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const data = await sensorService.getPondsByZone(zoneId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Lấy giá trị mới nhất (Cards) theo Pond cụ thể
export const getLatestByPond = async (req: Request, res: Response) => {
  try {
    const pondId = req.query.pondId as string;
    const data = await sensorService.getLatestSensorsByPond(pondId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Lấy lịch sử (Chart) theo Pond cụ thể
export const getHistoryByPond = async (req: Request, res: Response) => {
  try {
    const pondId = req.query.pondId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const data = await sensorService.getSensorHistoryByPond(pondId, limit);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
