import { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service.ts";

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const actuatorId = (req.query.actuatorId as string) || undefined;
    const data = await scheduleService.getSchedules(actuatorId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { actuator_id, target_level, schedule_at, note } = req.body;

    if (!actuator_id || target_level === undefined || !schedule_at) {
      return res.status(400).json({
        success: false,
        message: "Thiếu actuator_id, target_level hoặc schedule_at",
      });
    }

    const data = await scheduleService.createSchedule({
      actuator_id,
      target_level: Number(target_level),
      schedule_at,
      note,
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSchedule = async (req: Request, res: Response) => {
  try {
    const data = await scheduleService.cancelSchedule(req.params.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
