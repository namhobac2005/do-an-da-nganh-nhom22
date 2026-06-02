/**
 * routes.tsx
 * Cấu hình routing cho kiến trúc Zone > Pond phân cấp.
 *
 * Cấu trúc Route:
 * /login                                       → Trang đăng nhập (public)
 * /                                             → Protected (yêu cầu đăng nhập)
 *   /dashboard                                  → Dashboard tổng quan
 *   /zones                                      → Danh sách Vùng Nuôi (tất cả user)
 *   /zones/:zoneId/ponds                        → Ao nuôi trong vùng (tất cả user)
 *   /zones/:zoneId/ponds/:pondId                → Chi tiết ao nuôi (tất cả user)
 *   /admin/devices                              → Quản lý thiết bị (Admin only)
 *   /admin/users                                → Quản lý tài khoản (Admin only)
 *   /admin/alerts                               → Cảnh báo & Ngưỡng (Admin only)
 *   /admin/logs                                 → Nhật ký hành động (Admin only)
 *   /devices                                    → Thiết bị của user
 *   /monitoring                                 → Giám sát Real-time
 *   /control                                    → Điều khiển thiết bị
 *   /device-logs                                → Nhật ký điều khiển
 *   /alerts                                     → Cảnh báo
 *   /reports                                    → Báo cáo & Thống kê
 *   /chatbot                                    → Chatbot AI
 *   /settings                                   → Cài đặt
 * /403                                          → Không có quyền
 * *                                             → 404 Not Found
 */

import { createBrowserRouter, Navigate } from "react-router";

// Layouts
import { MainLayout } from "./components/layout/MainLayout";

// Guards
import { PrivateRoute } from "./components/common/PrivateRoute";

// Pages
import { Login } from "./pages/auth/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { DieuKhien } from "./pages/control/DieuKhien";
import { CanhBao } from "./pages/alerts/CanhBao";
import { BaoCao } from "./pages/reports/BaoCao";
import { Chatbot } from "./pages/chatbot/Chatbot";
import { ZonesPage } from "./pages/admin/ZonesPage";
import { PondsByZonePage } from "./pages/admin/PondsByZonePage";
import { PondDetailPage } from "./pages/admin/PondDetailPage";
import { SensorsPage } from "./pages/admin/SensorsPage";
import { DevicesPage } from "./pages/admin/DevicesPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { ActivityLogsPage } from "./pages/admin/ActivityLogsPage";
import { AlertsPage } from "./pages/admin/AlertsPage";
import { MonitoringPage } from "./pages/monitoring/MonitoringPage";
import { NotFound } from "./pages/NotFound";
import { DeviceLogsPage } from "./pages/logs/DeviceLogsPage";

// Placeholder components cho các trang chưa hoàn thiện
const PlaceholderPage: React.FC<{ title: string; icon?: string }> = ({
  title,
  icon = "🚧",
}) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
    <span style={{ fontSize: "48px" }}>{icon}</span>
    <h2 className="text-gray-700 mt-4">{title}</h2>
    <p className="text-gray-400 mt-2" style={{ fontSize: "14px" }}>
      Trang này đang được phát triển...
    </p>
  </div>
);

// Access Denied Page
const AccessDenied: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="text-center">
      <span style={{ fontSize: "60px" }}>🔒</span>
      <h1
        className="text-gray-900 mt-4 mb-2"
        style={{ fontSize: "28px", fontWeight: 700 }}
      >
        Không có quyền truy cập
      </h1>
      <p className="text-gray-500">
        Bạn không có quyền truy cập trang này. Liên hệ Admin để được cấp quyền.
      </p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // ===== PUBLIC ROUTES =====
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/403",
    element: <AccessDenied />,
  },

  // ===== PROTECTED ROUTES =====
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Redirect root → dashboard
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Dashboard
          { path: "dashboard", element: <Dashboard /> },

          // ===== Zone > Pond Hierarchy (All Authenticated Users) =====
          { path: "zones", element: <ZonesPage /> },
          { path: "zones/:zoneId/ponds", element: <PondsByZonePage /> },
          { path: "zones/:zoneId/ponds/:pondId", element: <PondDetailPage /> },

          // Thiết bị của user (lọc theo pond gán trong backend)
          { path: "devices", element: <DevicesPage /> },

          // ===== Admin Only Routes =====
          {
            path: "admin",
            element: <PrivateRoute requiredRole="admin" />,
            children: [
              { index: true, element: <Navigate to="/zones" replace /> },
              { path: "devices", element: <DevicesPage /> },
              { path: "users", element: <UsersPage /> },
              { path: "alerts", element: <AlertsPage /> },
              { path: "logs", element: <ActivityLogsPage /> },
            ],
          },

          // ===== Common Routes (All Authenticated Users) =====
          { path: "monitoring", element: <MonitoringPage /> },
          { path: "control", element: <DieuKhien /> },
          { path: "device-logs", element: <DeviceLogsPage /> },
          { path: "alerts", element: <CanhBao /> },
          { path: "reports", element: <BaoCao /> },
          { path: "chatbot", element: <Chatbot /> },
          {
            path: "settings",
            element: <PlaceholderPage title="Cài Đặt Hệ Thống" icon="⚙️" />,
          },
        ],
      },
    ],
  },

  // ===== 404 =====
  {
    path: "*",
    element: <NotFound />,
  },
]);
