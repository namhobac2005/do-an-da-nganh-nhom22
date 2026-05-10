/**
 * alert.controller.ts
 * HTTP layer for UC15 (Thresholds) & UC16 (Alert Logs).
 * Implements zone-based security: users only see data for their assigned ponds.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.ts';
import { supabaseAdmin } from '../lib/supabase.client.ts';
import * as alertService from '../services/alert.service.ts';

// ===== HELPERS =====

/**
 * Fetches the list of pond IDs assigned to the current user.
 * Returns undefined for admins (no filtering needed).
 */
const getUserPondIds = async (req: AuthRequest): Promise<string[] | undefined> => {
  if (req.user?.role === 'admin') return undefined;

  const userId = req.user?.id;
  if (!userId) return [];

  const { data, error } = await supabaseAdmin
    .from('user_ponds')
    .select('pond_id')
    .eq('user_id', userId);

  if (error) return [];
  return (data ?? []).map((row: any) => row.pond_id);
};

// ===== THRESHOLDS =====

/** GET /admin/alerts/thresholds */
export const listThresholds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pondIds = await getUserPondIds(req);
    const data = await alertService.listThresholds(pondIds);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /admin/alerts/thresholds — upsert (insert or update by target+metric) */
export const upsertThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
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
export const deleteThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await alertService.deleteThreshold(String(req.params.id));
    res.status(200).json({ success: true, message: 'Đã xóa ngưỡng thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== ALERT LOGS =====

/** GET /admin/alerts/logs?status=unread&zoneId=&page=1&limit=30 */
export const listAlertLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, zoneId, page, limit } = req.query as Record<string, string>;
    const pondIds = await getUserPondIds(req);

    const result = await alertService.listAlertLogs({
      status: status as any,
      zoneId: zoneId || undefined,
      pondIds: pondIds,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 30,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /admin/alerts/unread-count */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pondIds = await getUserPondIds(req);
    const count = await alertService.countUnread(pondIds);
    res.status(200).json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /admin/alerts/logs/:id/resolve */
export const resolveAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const alert = await alertService.resolveAlert(id);
    res.status(200).json({ success: true, data: alert });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
