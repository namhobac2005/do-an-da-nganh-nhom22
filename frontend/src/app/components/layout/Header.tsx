/**
 * Header.tsx
 * Thanh header phía trên của ứng dụng
 * Hiển thị tiêu đề trang, thông báo, và thông tin user
 */

import { useState } from "react";
import { useLocation } from "react-router";
import {
  Menu,
  Bell,
  Search,
  Wifi,
  WifiOff,
  ChevronDown,
  LogOut,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ===== PAGE TITLE MAP =====
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Tổng quan hệ thống" },
  "/zones": {
    title: "Vùng Nuôi",
    subtitle: "Quản lý các vùng nuôi trồng thủy sản",
  },
  "/admin/devices": {
    title: "Thiết Bị Điều Khiển",
    subtitle: "Quản lý máy bơm, sục khí, đèn...",
  },
  "/admin/users": {
    title: "Quản Lý Tài Khoản",
    subtitle: "Phân quyền người dùng",
  },
  "/monitoring": {
    title: "Giám Sát Real-time",
    subtitle: "Dữ liệu cảm biến theo thời gian thực",
  },
  "/control": {
    title: "Điều Khiển Thiết Bị",
    subtitle: "Vận hành và lập lịch thiết bị",
  },
  "/devices": {
    title: "Quản Lý Thiết Bị",
    subtitle: "Thiết bị trong các ao nuôi của bạn",
  },
  "/alerts": {
    title: "Cảnh Báo & Ngưỡng",
    subtitle: "Thiết lập ngưỡng và nhật ký cảnh báo",
  },
  "/reports": {
    title: "Báo Cáo & Thống Kê",
    subtitle: "Xuất báo cáo Excel/PDF",
  },
  "/chatbot": {
    title: "Chatbot AI",
    subtitle: "Hỏi đáp thông minh và điều khiển giọng nói",
  },
  "/settings": { title: "Cài Đặt", subtitle: "Cài đặt hệ thống" },
};

/** Match dynamic zone/pond routes */
const getPageTitle = (pathname: string) => {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Dynamic matches for zone > pond hierarchy
  if (/^\/zones\/[^/]+\/ponds\/[^/]+$/.test(pathname)) {
    return {
      title: "Chi Tiết Ao Nuôi",
      subtitle: "Dashboard, thiết bị, cảnh báo",
    };
  }
  if (/^\/zones\/[^/]+\/ponds$/.test(pathname)) {
    return { title: "Ao Nuôi", subtitle: "Danh sách ao nuôi trong vùng" };
  }

  return { title: "AquaSmart", subtitle: "Hệ thống quản lý ao nuôi" };
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isOnline] = useState(true); // Giả lập trạng thái kết nối IoT

  // Lấy title trang hiện tại
  const currentPage = getPageTitle(location.pathname);

  // Số thông báo chưa đọc — sẽ kết nối API thật sau
  const unreadAlerts = 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10">
      {/* Left: Menu Toggle + Page Title */}
      <div className="flex items-center gap-4">
        {/* Hamburger cho mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Page Title */}
        <div>
          <h1
            className="text-gray-900"
            style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.3 }}
          >
            {currentPage.title}
          </h1>
          <p
            className="text-gray-500 hidden sm:block"
            style={{ fontSize: "12px", lineHeight: 1.3 }}
          >
            {currentPage.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, IoT Status, Notif, User */}
      <div className="flex items-center gap-2">
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-48">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="bg-transparent text-gray-600 outline-none w-full"
            style={{ fontSize: "13px" }}
          />
        </div>

        {/* IoT Connection Status */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
            isOnline
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span style={{ fontSize: "12px", fontWeight: 500 }}>
            {isOnline ? "IoT Online" : "Mất kết nối"}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={17} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                style={{ fontSize: "10px", fontWeight: 700 }}
              >
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="p-4 border-b border-gray-100">
                <p style={{ fontSize: "14px", fontWeight: 600 }}>Thông báo</p>
                <p className="text-gray-500" style={{ fontSize: "12px" }}>
                  {unreadAlerts} chưa đọc
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {/* TODO: Wire to real alerts API */}
                {unreadAlerts === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>
                      Không có thông báo mới
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <button
                  className="text-emerald-600 hover:underline"
                  style={{ fontSize: "13px", fontWeight: 500 }}
                >
                  Xem tất cả cảnh báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center">
              <span
                className="text-white"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span
              className="hidden sm:block text-gray-700"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              {user?.username?.split(" ").pop()}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="p-4 border-b border-gray-100">
                <p
                  className="text-gray-900"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  {user?.username}
                </p>
                <p className="text-gray-500" style={{ fontSize: "12px" }}>
                  {user?.email}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-white ${user?.role === "admin" ? "bg-purple-500" : "bg-emerald-500"}`}
                  style={{ fontSize: "11px", fontWeight: 600 }}
                >
                  {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                </span>
              </div>
              <div className="p-2">
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <UserIcon size={15} className="text-gray-400" />
                  <span style={{ fontSize: "13px" }}>Hồ sơ cá nhân</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={15} />
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    Đăng xuất
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isNotifOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotifOpen(false);
          }}
        />
      )}
    </header>
  );
};
