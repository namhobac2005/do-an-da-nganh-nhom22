import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string; // <-- Trong token lúc login bạn đã lưu role rồi
  };
}

// Thay vì là 1 middleware tĩnh, ta viết 1 hàm nhận vào mảng các quyền (roles)
export const verifyToken = (allowedRoles?: string[]) => {
  // Trả về một middleware
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Truy cập bị từ chối. Vui lòng đăng nhập!',
        });
      }

      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

      // 1. Giải mã Token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;

      // 2. PHÂN QUYỀN (AUTHORIZATION) NẰM Ở ĐÂY
      // Nếu API có cấu hình quyền (truyền vào mảng allowedRoles)
      // VÀ chức vụ của user không nằm trong mảng đó -> Báo lỗi 403
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(decoded.role)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Bạn không có quyền truy cập chức năng này!',
          });
        }
      }

      // 3. Hợp lệ thì cho đi tiếp vào Controller
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ success: false, message: 'Phiên đăng nhập đã hết hạn' });
      }
      return res
        .status(401)
        .json({ success: false, message: 'Token không hợp lệ' });
    }
  };
};
