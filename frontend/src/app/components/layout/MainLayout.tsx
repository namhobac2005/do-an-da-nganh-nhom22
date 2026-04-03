/**
 * MainLayout.tsx
 * Layout chính bao gồm Sidebar + Header + Content area
 * Được dùng cho tất cả các trang sau khi đăng nhập
 */

import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
