import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller.ts';

const router = Router();

// All routes require authentication + admin role
router.get('/',    verifyToken(['admin']), userController.listUsers);
router.post('/',   verifyToken(['admin']), userController.createUser);
router.get('/:id', verifyToken(['admin']), userController.getUser);
router.put('/:id', verifyToken(['admin']), userController.updateUser);
router.delete('/:id', verifyToken(['admin']), userController.deleteUser);
router.put('/:id/ponds', verifyToken(['admin']), userController.updateUserPonds);

export default router;
