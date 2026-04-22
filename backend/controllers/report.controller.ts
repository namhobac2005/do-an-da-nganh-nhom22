import { Request, Response } from "express";
import * as reportService from "../services/report.service.ts";

export const getDashboardReport = async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const actuatorType = req.query.actuatorType as string | undefined;

    const data = await reportService.getDashboardReport({
      from,
      to,
      actuatorType,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
