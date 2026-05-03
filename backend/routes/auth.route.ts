import { Router } from 'express';
import * as authController from '../controllers/auth.controller.ts';

const router = Router();

/** POST /auth/login — public endpoint, no auth middleware */
router.post('/login', authController.login);

export default router;
