import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: 'Vui lòng cung cấp email và mật khẩu' });
      }

      const result = await AuthService.login(email, password);

      return res.status(200).json({
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error: any) {
      return res.status(401).json({
        message: error.message || 'Lỗi xác thực',
      });
    }
  }
}
