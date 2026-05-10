import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as zoneService from "../services/zone.service";

/**
 * Lấy danh sách vùng nuôi theo quyền hạn của User
 * GET /zones
 */
export const getAllZones = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Trích xuất userId đã được Middleware verifyToken giải mã và gán vào req.user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được danh tính người dùng.",
      });
    }

    // 2. Gọi service để lấy danh sách đã lọc theo userId
    const zones = await zoneService.listZones(userId);

    return res.status(200).json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error("Error in getAllZones:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách vùng nuôi.",
    });
  }
};

/**
 * Lấy chi tiết một vùng nuôi
 * GET /zones/:id
 */
export const getZoneById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được danh tính người dùng.",
      });
    }

    const zone = await zoneService.getZoneByIdForUser(id, userId, role);

    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy vùng nuôi yêu cầu.",
    });
  }
};

/**
 * Tạo mới vùng nuôi (Chỉ Admin)
 * POST /zones
 */
export const createZone = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Tạo vùng nuôi mới
    const newZone = await zoneService.createZone(req.body);

    // 2. Tự động gán quyền quản lý vùng này cho Admin vừa tạo (để hiện lên Dashboard ngay)
    const userId = req.user?.id;
    if (userId) {
      // Bạn có thể bổ sung một hàm gán quyền nhanh trong zoneService nếu cần
      // await zoneService.assignUserToZone(userId, newZone.id);
    }

    return res.status(201).json({
      success: true,
      message: "Tạo vùng nuôi thành công.",
      data: newZone,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Dữ liệu không hợp lệ.",
    });
  }
};

/**
 * Cập nhật vùng nuôi (Chỉ Admin)
 * PUT /zones/:id
 */
export const updateZone = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatedZone = await zoneService.updateZone(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Cập nhật vùng nuôi thành công.",
      data: updatedZone,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Cập nhật thất bại.",
    });
  }
};

/**
 * Xóa vùng nuôi (Chỉ Admin)
 * DELETE /zones/:id
 */
export const deleteZone = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await zoneService.deleteZone(id);

    return res.status(200).json({
      success: true,
      message: "Đã xóa vùng nuôi.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Không thể xóa vùng nuôi.",
    });
  }
};
