/**
 * zone.controller.ts
 * HTTP layer for Zone CRUD. Every mutable action emits an audit log.
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

/** POST /admin/zones */
export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, status } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Tên khu vực là bắt buộc.' });
      return;
    }

    const zone = await zoneService.createZone({ name, location, status });

    await logService.createLog({
      actorId:    req.user!.id,
      actorEmail: req.user!.email,
      action:     'CREATE_ZONE',
      targetType: 'zone',
      targetId:   zone.id,
      details:    { name: zone.name },
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
    const zone = await zoneService.updateZone(id, req.body);

    await logService.createLog({
      actorId:    req.user!.id,
      actorEmail: req.user!.email,
      action:     'UPDATE_ZONE',
      targetType: 'zone',
      targetId:   id,
      details:    req.body,
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

    res.status(200).json({ success: true, message: 'Đã xóa khu vực thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
