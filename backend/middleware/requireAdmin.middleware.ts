// /**
//  * requireAdmin.middleware.ts
//  * Must be used AFTER authenticateToken.
//  * Blocks the request with 403 if the authenticated user is not an Admin.
//  */

// import { Request, Response, NextFunction } from 'express';
// import { authenticateToken } from './auth.middleware.ts';

// /**
//  * Composed middleware: authenticate + enforce admin role.
//  * Use this as a single middleware array on admin routes.
//  */
// export const requireAdmin = [
//   authenticateToken,
//   (req: Request, res: Response, next: NextFunction): void => {
//     if (!req.user || req.user.role !== 'admin') {
//       res.status(403).json({
//         success: false,
//         message: 'Bạn không có quyền thực hiện thao tác này. Chỉ Admin mới được phép.',
//       });
//       return;
//     }
//     next();
//   },
// ];
