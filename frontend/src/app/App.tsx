/**
 * App.tsx
 * Entry point chính của ứng dụng AquaSmart
 *
 * Cấu trúc:
 * AuthProvider → RouterProvider
 *
 * AuthProvider: Bao bọc toàn bộ app để cung cấp trạng thái xác thực
 * RouterProvider: Điều hướng dựa trên React Router v7 (Data Mode)
 */

import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

export default function App() {
  return (
    /**
     * AuthProvider cần bao bọc RouterProvider để các component bên trong
     * router có thể truy cập useAuth() hook
     */
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </AuthProvider>
  );
}
