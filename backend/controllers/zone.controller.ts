import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as zoneService from '../services/zone.service';

export const getZones = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const zones = await zoneService.getZonesForUser(userId);
    res.status(200).json(zones); // Trả về mảng trực tiếp
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getZoneDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const data = await zoneService.getZoneDetail(id, userId);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
