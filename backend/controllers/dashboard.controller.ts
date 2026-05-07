// src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

// 1. Lấy KPIs theo User
export const getKPIs = async (req: Request, res: Response) => {
  try {
    // Giả định bạn có Middleware xác thực lưu thông tin vào req.user
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const data = await dashboardService.getDashboardKPIs(userId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy Cảnh báo gần đây theo User
export const getRecentAlerts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const data = await dashboardService.getRecentAlerts(userId, limit);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Lấy Tổng quan khu vực theo User
export const getZonesOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const data = await dashboardService.getZonesOverview(userId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
