/**
 * log.controller.ts
 * HTTP layer for activity log reads (Admin only).
 */

import { Request, Response } from "express";
import * as logService from "../services/log.service.ts";

/** GET /admin/logs?page=1&limit=20&search=&sortBy=created_at&sortDirection=desc&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD */
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const search = (req.query.search as string) || undefined;
    const sortBy =
      (req.query.sortBy as "created_at" | "actor_email") || "created_at";
    const sortDirection = (req.query.sortDirection as "asc" | "desc") || "desc";
    const fromDate = (req.query.fromDate as string) || undefined;
    const toDate = (req.query.toDate as string) || undefined;

    const result = await logService.listLogs(
      page,
      limit,
      search,
      sortBy,
      sortDirection,
      fromDate,
      toDate,
    );
    res.status(200).json({ success: true, ...result, page, limit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
