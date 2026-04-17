import { Request, Response } from "express";
import * as reportService from "../services/report.service.js";

// Lấy nhật ký thiết bị
export const getDeviceLogs = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const { from, to, limit } = req.query;

    const logs = await reportService.getDeviceLogs(
      deviceId as string,
      from as string,
      to as string,
      parseInt((limit as string) || "50"),
    );

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy báo cáo thiết bị
export const getDeviceReport = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId;
    const { period = "day" } = req.query;

    const report = await reportService.getDeviceReport(
      deviceId as string,
      period as "day" | "week" | "month",
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy báo cáo cảm biến
export const getSensorReport = async (req: Request, res: Response) => {
  try {
    const { period = "day" } = req.query;

    const report = await reportService.getSensorReport(
      period as "day" | "week" | "month",
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả nhật ký
export const getAllLogs = async (req: Request, res: Response) => {
  try {
    const { limit = "100" } = req.query;

    const logs = await reportService.getAllLogs(parseInt(limit as string));

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
