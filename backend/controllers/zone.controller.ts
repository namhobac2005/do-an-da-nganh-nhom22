/**
 * zone.controller.ts
 * HTTP layer for Zone + Pond management (hierarchical).
 *
 * Zone routes:
 *   GET    /zones           → listZones
 *   GET    /zones/:id       → getZoneById
 *   POST   /zones           → createZone (admin)
 *   PUT    /zones/:id       → updateZone (admin)
 *   DELETE /zones/:id       → deleteZone (admin)
 *
 * Pond routes (nested under zone):
 *   GET    /zones/:zoneId/ponds            → listPondsByZone
 *   GET    /zones/:zoneId/ponds/:pondId    → getPondDetail
 *   POST   /zones/:zoneId/ponds            → createPond (admin)
 *   PUT    /zones/:zoneId/ponds/:pondId    → updatePond (admin)
 *   DELETE /zones/:zoneId/ponds/:pondId    → deletePond (admin)
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.ts';
import * as zoneService from '../services/zone.service.ts';

// ===== ZONE HANDLERS =====

export const getZones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const zones = await zoneService.listZones(req.user!.id, req.user!.role);
    res.status(200).json(zones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getZoneDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await zoneService.getZoneById(id as string);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /zones — Admin only */
export const createZone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền tạo vùng nuôi.' });
      return;
    }
    const zone = await zoneService.createZone(req.body);
    res.status(201).json(zone);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /zones/:id — Admin only */
export const updateZone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền cập nhật vùng nuôi.' });
      return;
    }
    const { id } = req.params;
    const zone = await zoneService.updateZoneById(id as string, req.body);
    res.status(200).json(zone);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /zones/:id — Admin only */
export const deleteZone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền xóa vùng nuôi.' });
      return;
    }
    const { id } = req.params;
    await zoneService.deleteZoneById(id as string);
    res.status(200).json({ success: true, message: 'Đã xóa vùng nuôi thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== POND HANDLERS =====

/** GET /zones/:zoneId/ponds */
export const getPondsByZone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const ponds = await zoneService.listPondsByZone(
      zoneId as string,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json(ponds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** GET /zones/:zoneId/ponds/:pondId */
export const getPondDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pondId } = req.params;
    const data = await zoneService.getPondDetail(pondId as string);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /zones/:zoneId/ponds — Admin only */
export const createPond = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền tạo ao nuôi.' });
      return;
    }
    const { zoneId } = req.params;
    const pond = await zoneService.createPond(zoneId as string, req.body);
    res.status(201).json(pond);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /zones/:zoneId/ponds/:pondId — Admin only */
export const updatePond = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền cập nhật ao nuôi.' });
      return;
    }
    const { pondId } = req.params;
    const pond = await zoneService.updatePond(pondId as string, req.body);
    res.status(200).json(pond);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /zones/:zoneId/ponds/:pondId — Admin only */
export const deletePond = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền xóa ao nuôi.' });
      return;
    }
    const { pondId } = req.params;
    await zoneService.deletePond(pondId as string);
    res.status(200).json({ success: true, message: 'Đã xóa ao nuôi thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
