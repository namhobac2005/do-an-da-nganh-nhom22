/**
 * PrivateRoute.tsx
 * Higher-Order Component bảo vệ route - chỉ cho phép truy cập khi đã đăng nhập
 * Nếu chưa đăng nhập, tự động redirect về trang Login
 */

import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../data/mockData';

interface PrivateRouteProps {
  /** Chỉ cho phép role nhất định truy cập (optional) */
  requiredRole?: UserRole;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Chưa đăng nhập → redirect về Login, lưu lại URL hiện tại để sau khi login redirect lại
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra phân quyền theo role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  // Đã xác thực → render children route
  return <Outlet />;
};
