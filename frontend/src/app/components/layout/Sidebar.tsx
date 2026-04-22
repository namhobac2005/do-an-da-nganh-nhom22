/**
 * Sidebar.tsx
 * Navigation sidebar chính của ứng dụng
 * Hiển thị menu theo role (Admin/User)
 */

import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Waves,
  Fish,
  Cpu,
  Users,
  Gauge,
  BellRing,
  BarChart3,
  Bot,
  ChevronRight,
  LogOut,
  Settings,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ===== MENU STRUCTURE =====

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "TỔNG QUAN",
    items: [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={18} />,
      },
    ],
  },
  {
    title: "QUẢN TRỊ HỆ THỐNG",
    items: [
      {
        path: "/admin/zones",
        label: "Vùng Ao (Zone)",
        icon: <Waves size={18} />,
        adminOnly: true,
      },
      {
        path: "/admin/ponds",
        label: "Ao Nuôi",
        icon: <Fish size={18} />,
        adminOnly: true,
      },
      {
        path: "/admin/devices",
        label: "Thiết Bị",
        icon: <Cpu size={18} />,
        adminOnly: true,
      },
      {
        path: "/admin/users",
        label: "Tài Khoản",
        icon: <Users size={18} />,
        adminOnly: true,
      },
    ],
  },
  {
    title: "GIÁM SÁT & VẬN HÀNH",
    items: [
      {
        path: "/monitoring",
        label: "Giám Sát Real-time",
        icon: <Gauge size={18} />,
      },
      {
        path: "/control",
        label: "Điều Khiển Thiết Bị",
        icon: <Zap size={18} />,
      },
    ],
  },
  {
    title: "BÁO CÁO & CẢNH BÁO",
    items: [
      {
        path: "/alerts",
        label: "Cảnh Báo",
        icon: <BellRing size={18} />,
        badge: 3,
      },
      {
        path: "/reports",
        label: "Báo Cáo & Thống Kê",
        icon: <BarChart3 size={18} />,
      },
    ],
  },
  {
    title: "HỖ TRỢ AI",
    items: [{ path: "/chatbot", label: "Chatbot AI", icon: <Bot size={18} /> }],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          w-64 bg-[#0A3622] text-white
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Fish size={20} className="text-[#0A3622]" />
          </div>
          <div>
            <p
              className="text-white text-sm"
              style={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              AquaSmart
            </p>
            <p
              className="text-emerald-400/80"
              style={{ fontSize: "11px", lineHeight: 1.3 }}
            >
              Quản lý ao nuôi thông minh
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => {
            // Lọc menu theo role
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || hasRole("admin"),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                <p
                  className="text-white/40 px-3 mb-2"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-150 group relative
                          ${
                            isActive(item.path)
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }
                        `}
                      >
                        <span
                          className={
                            isActive(item.path)
                              ? "text-white"
                              : "text-white/60 group-hover:text-white"
                          }
                        >
                          {item.icon}
                        </span>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: isActive(item.path) ? 600 : 400,
                          }}
                        >
                          {item.label}
                        </span>

                        {/* Badge cảnh báo */}
                        {item.badge && item.badge > 0 && (
                          <span
                            className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            style={{ fontSize: "11px", fontWeight: 700 }}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Active indicator */}
                        {isActive(item.path) && (
                          <ChevronRight
                            size={14}
                            className="ml-auto opacity-70"
                          />
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {/* Settings */}
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings size={17} />
            <span style={{ fontSize: "13.5px" }}>Cài Đặt</span>
          </NavLink>

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <span
                className="text-white"
                style={{ fontSize: "13px", fontWeight: 700 }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-white truncate"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                {user?.name}
              </p>
              <p
                className="text-white/50 truncate"
                style={{ fontSize: "11px" }}
              >
                {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
