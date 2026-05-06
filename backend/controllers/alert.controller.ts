/**
 * alert.controller.ts
 * HTTP layer for UC15 (Thresholds) & UC16 (Alert Logs).
 */

import { Request, Response } from 'express';
import * as alertService from '../services/alert.service.ts';

// ===== THRESHOLDS =====

/** GET /admin/alerts/thresholds */
export const listThresholds = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await alertService.listThresholds();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /admin/alerts/thresholds — upsert (insert or update by target+metric) */
export const upsertThreshold = async (req: Request, res: Response): Promise<void> => {
  try {
    const { target_type, target_id, metric, min_value, max_value } = req.body;

    if (!target_type || !target_id || !metric) {
      res.status(400).json({ success: false, message: 'target_type, target_id và metric là bắt buộc.' });
      return;
    }
    if (min_value === undefined || max_value === undefined) {
      res.status(400).json({ success: false, message: 'min_value và max_value là bắt buộc.' });
      return;
    }

    const threshold = await alertService.upsertThreshold({
      target_type,
      target_id,
      metric,
      min_value: Number(min_value),
      max_value: Number(max_value),
    });

    res.status(200).json({ success: true, data: threshold });
  } catch (error: any) {
    // Includes the min>=max validation error
    res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /admin/alerts/thresholds/:id */
export const deleteThreshold = async (req: Request, res: Response): Promise<void> => {
  try {
    await alertService.deleteThreshold(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa ngưỡng thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== ALERT LOGS =====

/** GET /admin/alerts/logs?status=unread&zoneId=&page=1&limit=30 */
export const listAlertLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, zoneId, page, limit } = req.query as Record<string, string>;
    const result = await alertService.listAlertLogs({
      status: status as any,
      zoneId: zoneId || undefined,
      page:   page  ? parseInt(page)  : 1,
      limit:  limit ? parseInt(limit) : 30,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /admin/alerts/unread-count */
export const getUnreadCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await alertService.countUnread();
    res.status(200).json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /admin/alerts/logs/:id/resolve */
export const resolveAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = await alertService.resolveAlert(req.params.id);
    res.status(200).json({ success: true, data: alert });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
