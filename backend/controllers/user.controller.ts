/**
 * user.controller.ts
 * HTTP layer for User management. Every mutation emits an audit log.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.ts';
import * as userService from '../services/user.service.ts';
import * as logService from '../services/log.service.ts';

/** GET /admin/users */
export const listUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await userService.listUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /admin/users/:id */
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(String(req.params.id));
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/** POST /admin/users */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, role, pondIds } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc.' });
      return;
    }

    const user = await userService.createUser({ email, password, fullName, phone, role, pondIds });

    await logService.createLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CREATE_USER',
      targetType: 'user',
      targetId: user.id,
      details: { email: user.email, role: user.role },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /admin/users/:id */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { fullName, phone, role, status, pondIds } = req.body;

    const user = await userService.updateUser(id, { fullName, phone, role, status, pondIds });

    await logService.createLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'UPDATE_USER',
      targetType: 'user',
      targetId: id,
      details: req.body,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** DELETE /admin/users/:id */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Prevent self-deletion
    if (id === req.user!.id) {
      res.status(400).json({ success: false, message: 'Không thể xóa chính tài khoản đang đăng nhập.' });
      return;
    }

    await userService.deleteUser(id);

    await logService.createLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'DELETE_USER',
      targetType: 'user',
      targetId: id,
    });

    res.status(200).json({ success: true, message: 'Đã xóa tài khoản thành công.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUT /admin/users/:id/ponds */
export const updateUserPonds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { pondIds } = req.body;

    if (!Array.isArray(pondIds)) {
      res.status(400).json({ success: false, message: 'pondIds phải là một mảng.' });
      return;
    }

    await userService.updateUserPonds(id, pondIds);

    await logService.createLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'UPDATE_USER_PONDS',
      targetType: 'user',
      targetId: id,
      details: { pondIds },
    });

    const user = await userService.getUserById(id);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
