import { Request, Response } from 'express';
import * as sensorService from '../services/sensor.service.js';

/**
 * Lấy lịch sử 30 bản ghi gần nhất cho Biểu đồ (Chart)
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const data = await sensorService.getSensorHistory(limit);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('🔥 Error in getHistory:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử cảm biến',
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách tất cả sensors kèm giá trị mới nhất cho các Cards
 */
export const getAllLatest = async (req: Request, res: Response) => {
  try {
    // 1. Gọi service để lấy list sensors + last value
    const sensors = await sensorService.getAllSensorsWithLastValue();

    return res.status(200).json(sensors);
  } catch (error: any) {
    console.error('🔥 Error in getAllLatest:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy trạng thái cảm biến hiện tại',
      error: error.message,
    });
  }
};
