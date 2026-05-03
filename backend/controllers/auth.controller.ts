/**
 * auth.controller.ts
 * HTTP layer for authentication: login only.
 */

import { Request, Response } from 'express';
import * as authService from '../services/auth.service.ts';

/** POST /auth/login */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc.' });
      return;
    }

    const result = await authService.login(email as string, password as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};
