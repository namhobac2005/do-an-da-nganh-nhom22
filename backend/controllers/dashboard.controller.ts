// src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

// 1. Lấy KPIs
export const getKPIs = async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getDashboardKPIs();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy Cảnh báo gần đây
export const getRecentAlerts = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const data = await dashboardService.getRecentAlerts(limit);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Lấy Tổng quan khu vực
export const getZonesOverview = async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getZonesOverview();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
