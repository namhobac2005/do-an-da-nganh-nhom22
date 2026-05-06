/**
 * zone.controller.ts
 * HTTP layer for Zone CRUD (UC01). Every mutable action emits an audit log.
 */

import { Request, Response } from 'express';
import * as zoneService from '../services/zone.service.ts';
import * as logService  from '../services/log.service.ts';

/** GET /admin/zones */
export const listZones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await zoneService.listZones();
    res.status(200).json({ success: true, data: zones });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /admin/zones/farming-types — distinct list for the creatable combobox */
export const listFarmingTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const types = await zoneService.listFarmingTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /admin/zones/:id */
export const getZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await zoneService.getZoneById(req.params.id);
    res.status(200).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/** POST /admin/zones */
export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, farming_type, status } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ success: false, message: 'Tên vùng ao là bắt buộc.' });
      return;
    }

    const zone = await zoneService.createZone({ name: name.trim(), location, farming_type, status });

    await logService.createLog({
      actorId:    req.user!.id,
      actorEmail: req.user!.email,
      action:     'CREATE_ZONE',
      targetType: 'zone',
      targetId:   zone.id,
      details:    { name: zone.name, farming_type: zone.farming_type },
    });

    res.status(201).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /admin/zones/:id */
export const updateZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location, farming_type, status } = req.body;

    if (name !== undefined && !name.trim()) {
      res.status(400).json({ success: false, message: 'Tên vùng ao không được để trống.' });
      return;
    }

    const zone = await zoneService.updateZone(id, { name, location, farming_type, status });

    await logService.createLog({
      actorId:    req.user!.id,
      actorEmail: req.user!.email,
      action:     'UPDATE_ZONE',
      targetType: 'zone',
      targetId:   id,
      details:    { name, farming_type, status },
    });

    res.status(200).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /admin/zones/:id */
export const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await zoneService.deleteZone(id);

    await logService.createLog({
      actorId:    req.user!.id,
      actorEmail: req.user!.email,
      action:     'DELETE_ZONE',
      targetType: 'zone',
      targetId:   id,
    });

    res.status(200).json({ success: true, message: 'Đã xóa vùng ao thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
