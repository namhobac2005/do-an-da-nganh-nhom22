import { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service.js";

interface CustomRequest extends Request {
  user?: { id: string };
}

// Tạo lịch trình
export const createSchedule = async (req: CustomRequest, res: Response) => {
  try {
    const { device_id, level, cron_expr, action } = req.body;
    const userId = req.user?.id || null;

    const result = await scheduleService.createSchedule(
      device_id,
      level,
      cron_expr,
      action,
    );

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy tất cả lịch trình
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await scheduleService.getSchedules();
    res.json({ success: true, data: schedules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật lịch trình
export const updateSchedule = async (req: CustomRequest, res: Response) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const result = await scheduleService.updateSchedule(id, updates);

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa lịch trình
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    await scheduleService.deleteSchedule(id);

    res.json({ success: true, message: "Đã xóa" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy trạng thái cron
export const cronStatus = async (req: Request, res: Response) => {
  res.json({ success: true, active_jobs: scheduleService.getCronStatus() });
};
