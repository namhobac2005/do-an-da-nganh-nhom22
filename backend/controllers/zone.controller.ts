import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as zoneService from '../services/zone.service';

/**
 * Lấy danh sách vùng ao (pond) theo quyền hạn của User
 * GET /zones
 * - Admin: xem toàn bộ
 * - User: chỉ xem ponds đã được phân công
 */
export const getAllZones = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được danh tính người dùng.',
      });
    }

    const zones = role === 'admin'
      ? await zoneService.listAllZones()
      : await zoneService.listZones(userId);

    console.log(`[GET /zones] role=${role}, userId=${userId}, returned ${zones.length} ponds`);

    return res.status(200).json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error('Error in getAllZones:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách vùng ao.',
    });
  }
};

/**
 * Lấy chi tiết một vùng ao (pond)
 * GET /zones/:id
 */
export const getZoneById = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được danh tính người dùng.',
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
      message: 'Không tìm thấy vùng ao yêu cầu.',
    });
  }
};

/**
 * Tạo mới vùng ao (Chỉ Admin)
 * POST /zones
 */
export const createZone = async (req: AuthRequest, res: Response) => {
  try {
    const newZone = await zoneService.createZone(req.body);

    return res.status(201).json({
      success: true,
      message: 'Tạo vùng ao thành công.',
      data: newZone,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Dữ liệu không hợp lệ.',
    });
  }
};

/**
 * Cập nhật vùng ao (Chỉ Admin)
 * PUT /zones/:id
 */
export const updateZone = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const updatedZone = await zoneService.updateZone(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật vùng ao thành công.',
      data: updatedZone,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Cập nhật thất bại.',
    });
  }
};

/**
 * Xóa vùng ao (Chỉ Admin)
 * DELETE /zones/:id
 */
export const deleteZone = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await zoneService.deleteZone(id);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa vùng ao.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa vùng ao.',
    });
  }
};

/**
 * Lấy danh sách loại nuôi (farming_type) distinct
 * GET /zones/farming-types
 */
export const getFarmingTypes = async (_req: AuthRequest, res: Response) => {
  try {
    const types = await zoneService.listFarmingTypes();
    return res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách loại nuôi.',
    });
  }
};
