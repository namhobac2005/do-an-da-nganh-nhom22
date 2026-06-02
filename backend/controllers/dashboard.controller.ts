// src/controllers/dashboard.controller.ts
import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkUserExists = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();
  return !!data;
};

/**
 * Xác định userId cần lấy dữ liệu:
 * - Nếu là admin:
 *    + Nếu có ?userId=xxx → lấy của user đó (kiểm tra tồn tại)
 *    + Ngược lại → trả về null (để service lấy tổng toàn hệ thống)
 * - Nếu không phải admin → lấy userId của chính họ
 */
const getTargetUserId = async (
  req: Request,
  res: Response,
): Promise<string | null | false> => {
  const currentUserId = (req as any).user?.id;
  const currentUserRole = (req as any).user?.role;

  if (!currentUserId) {
    res
      .status(401)
      .json({ success: false, message: "Không tìm thấy thông tin người dùng" });
    return false;
  }

  // Nếu là admin
  if (currentUserRole === "admin") {
    const requestedUserId = req.query.userId as string | undefined;
    if (requestedUserId) {
      const exists = await checkUserExists(requestedUserId);
      if (!exists) {
        res.status(404).json({ success: false, message: "User không tồn tại" });
        return false;
      }
      return requestedUserId;
    }
    // Mặc định: lấy tổng toàn hệ thống
    return null;
  }

  // User thường: chỉ lấy dữ liệu của chính mình
  return currentUserId;
};

export const getKPIs = async (req: Request, res: Response) => {
  try {
    const userId = await getTargetUserId(req, res);
    if (userId === false) return;

    const data = await dashboardService.getDashboardKPIs(userId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getRecentAlerts = async (req: Request, res: Response) => {
  try {
    const userId = await getTargetUserId(req, res);
    if (userId === false) return;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const data = await dashboardService.getRecentAlerts(userId, limit);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getZonesOverview = async (req: Request, res: Response) => {
  try {
    const userId = await getTargetUserId(req, res);
    if (userId === false) return;

    const data = await dashboardService.getZonesOverview(userId);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
