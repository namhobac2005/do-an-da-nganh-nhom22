import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller.ts';

const router = Router();

// All routes are protected by verifyToken() middleware
router.get('/', verifyToken(), userController.listUsers);
router.post('/', verifyToken(), userController.createUser);
router.get('/:id', verifyToken(), userController.getUser);
router.put('/:id', verifyToken(), userController.updateUser);
router.delete('/:id', verifyToken(), userController.deleteUser);
router.put('/:id/zones', verifyToken(), userController.updateUserZones);

export default router;
