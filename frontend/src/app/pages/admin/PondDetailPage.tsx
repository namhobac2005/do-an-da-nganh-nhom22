/**
 * PondDetailPage.tsx
 * Trang chi tiết Ao Nuôi (Zone > Pond Detail).
 * Route: /zones/:zoneId/ponds/:pondId
 *
 * Features:
 *  - Breadcrumb: Vùng nuôi > [Zone Name] > [Pond Name]
 *  - 3 tabs: Dashboard | Thiết bị | Cảnh báo
 *  - Each tab passes pondId to child components
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, ChevronRight, Fish, MapPin, RefreshCw,
  LayoutDashboard, Cpu, Bell, Activity, AlertCircle,
  Loader2, Users,
} from 'lucide-react';
import * as zoneService from '../../services/zoneService';
import type { PondDetail } from '../../types/user.types';

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:      { label: 'Hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { label: 'Ngưng HĐ',  bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  maintenance: { label: 'Bảo trì',   bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
};

// ===== TAB DEFINITIONS =====
type TabKey = 'dashboard' | 'devices' | 'alerts';
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { key: 'devices',   label: 'Thiết bị',   icon: <Cpu size={16} /> },
  { key: 'alerts',    label: 'Cảnh báo',   icon: <Bell size={16} /> },
];

// ===== PLACEHOLDER TAB CONTENT =====
// These will be replaced with real sub-components as they are developed.

const DashboardTab: React.FC<{ pondId: string }> = ({ pondId }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-8">
    <div className="flex flex-col items-center text-center py-8">
      <LayoutDashboard size={40} className="text-blue-200 mb-4" />
      <h3 className="text-gray-700 font-semibold text-base mb-2">Dashboard Ao Nuôi</h3>
      <p className="text-gray-400 text-sm max-w-md">
        Hiển thị dữ liệu cảm biến thời gian thực, biểu đồ nhiệt độ, pH, DO cho ao <strong>{pondId}</strong>.
      </p>
      <p className="text-blue-500 text-xs mt-4 bg-blue-50 px-3 py-1.5 rounded-lg font-medium">
        Mô-đun này sẽ hiển thị dữ liệu thực từ Adafruit IO
      </p>
    </div>
  </div>
);

const DevicesTab: React.FC<{ pondId: string }> = ({ pondId }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-8">
    <div className="flex flex-col items-center text-center py-8">
      <Cpu size={40} className="text-purple-200 mb-4" />
      <h3 className="text-gray-700 font-semibold text-base mb-2">Thiết bị trong Ao</h3>
      <p className="text-gray-400 text-sm max-w-md">
        Quản lý máy bơm, sục khí, máy cho ăn trong ao <strong>{pondId}</strong>.
      </p>
      <p className="text-purple-500 text-xs mt-4 bg-purple-50 px-3 py-1.5 rounded-lg font-medium">
        Mô-đun này sẽ hiển thị và điều khiển các thiết bị IoT
      </p>
    </div>
  </div>
);

const AlertsTab: React.FC<{ pondId: string }> = ({ pondId }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-8">
    <div className="flex flex-col items-center text-center py-8">
      <Bell size={40} className="text-amber-200 mb-4" />
      <h3 className="text-gray-700 font-semibold text-base mb-2">Cảnh báo Ao Nuôi</h3>
      <p className="text-gray-400 text-sm max-w-md">
        Danh sách cảnh báo ngưỡng pH, nhiệt độ, oxy cho ao <strong>{pondId}</strong>.
      </p>
      <p className="text-amber-500 text-xs mt-4 bg-amber-50 px-3 py-1.5 rounded-lg font-medium">
        Mô-đun này sẽ hiển thị cảnh báo từ hệ thống ngưỡng
      </p>
    </div>
  </div>
);

const TAB_COMPONENTS: Record<TabKey, React.FC<{ pondId: string }>> = {
  dashboard: DashboardTab,
  devices:   DevicesTab,
  alerts:    AlertsTab,
};

// ===== MAIN PAGE =====
export const PondDetailPage: React.FC = () => {
  const { zoneId, pondId } = useParams<{ zoneId: string; pondId: string }>();
  const navigate = useNavigate();

  const [pond, setPond] = useState<PondDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const fetchData = useCallback(async () => {
    if (!zoneId || !pondId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await zoneService.getPondDetail(zoneId, pondId);
      setPond(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, pondId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !pond) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
        <AlertCircle size={32} className="text-red-400 mb-3" />
        <p className="text-gray-600 text-sm font-medium mb-1">Không thể tải thông tin ao nuôi</p>
        <p className="text-gray-400 text-xs mb-4">{error}</p>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          <RefreshCw size={13} /> Thử lại
        </button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[pond.status] || STATUS_CONFIG.active;
  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <Link to="/zones" className="text-emerald-600 hover:underline font-medium">Vùng nuôi</Link>
        <ChevronRight size={14} className="text-gray-400" />
        <Link to={`/zones/${zoneId}/ponds`} className="text-emerald-600 hover:underline font-medium">
          {pond.zone_name ?? 'Vùng'}
        </Link>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-700 font-semibold">{pond.name}</span>
      </div>

      {/* Pond Header Card */}
      <div className="bg-gradient-to-br from-blue-900 to-teal-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/zones/${zoneId}/ponds`)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Fish size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{pond.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-white/70 text-sm">
                {pond.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{pond.location}</span>
                  </div>
                )}
                {pond.farming_type && (
                  <div className="flex items-center gap-1">
                    <Fish size={12} />
                    <span>{pond.farming_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button onClick={fetchData}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors" title="Làm mới">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
              <Activity size={14} />
              <span>Cảm biến</span>
            </div>
            <p className="text-2xl font-bold">{pond.stats.totalSensors}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
              <Cpu size={14} />
              <span>Thiết bị</span>
            </div>
            <p className="text-2xl font-bold">{pond.stats.totalActuators}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
              <Users size={14} />
              <span>Quản lý</span>
            </div>
            <p className="text-2xl font-bold">{pond.stats.managers.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
              <Fish size={14} />
              <span>Loại nuôi</span>
            </div>
            <p className="text-sm font-semibold truncate mt-1">{pond.farming_type ?? 'Chưa xác định'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <ActiveTabComponent pondId={pondId!} />
    </div>
  );
};
