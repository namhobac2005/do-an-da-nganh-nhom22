/**
 * log.controller.ts
 * HTTP layer for activity log reads (Admin only).
 */

import { Request, Response } from 'express';
import * as logService from '../services/log.service.ts';

/** GET /admin/logs?page=1&limit=20 */
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await logService.listLogs(page, limit);
    res.status(200).json({ success: true, ...result, page, limit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
