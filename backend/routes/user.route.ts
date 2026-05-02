import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.ts';
import * as userController from '../controllers/user.controller.ts';

const router = Router();

// All routes are protected by requireAdmin middleware
router.get   ('/',          requireAdmin, userController.listUsers);
router.post  ('/',          requireAdmin, userController.createUser);
router.get   ('/:id',       requireAdmin, userController.getUser);
router.put   ('/:id',       requireAdmin, userController.updateUser);
router.delete('/:id',       requireAdmin, userController.deleteUser);
router.put   ('/:id/zones', requireAdmin, userController.updateUserZones);

export default router;
