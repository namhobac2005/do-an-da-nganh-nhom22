/**
 * ZoneDetailPage.tsx
 * Trang chi tiết vùng ao (UC01 — Master-Detail).
 *
 * This page is the LAYOUT SHELL for a specific zone.
 * Fetch basic zone info and render placeholder sections for other teams:
 *   - Sensor Data      → Sensor module team
 *   - Device Control   → Actuator module team
 *   - Alerts           → Alert module team
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, Waves, MapPin, Fish, RefreshCw,
  Activity, Cpu, Bell, LayoutGrid, AlertCircle, Loader2,
} from 'lucide-react';
import * as zoneService from '../../services/zoneService';
import type { Zone } from '../../types/user.types';

// ===== STATUS CONFIG =====
const STATUS_CONFIG = {
  active:      { label: 'Hoạt động',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { label: 'Ngưng HĐ',     bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400'    },
  maintenance: { label: 'Bảo trì',      bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
};

// ===== PLACEHOLDER SECTION =====
interface PlaceholderSectionProps {
  icon:        React.ReactNode;
  title:       string;
  description: string;
  team:        string;
  color:       string;
}
const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({
  icon, title, description, team, color,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className={`${color} px-5 py-3.5 flex items-center gap-2`}>
      {icon}
      <h2 className="font-semibold text-sm">{title}</h2>
    </div>
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-gray-500 text-sm font-medium">{description}</p>
      <p className="text-gray-300 text-xs mt-1.5">
        Phụ trách: <span className="font-medium text-gray-400">{team}</span>
      </p>
      <div className="mt-4 px-3 py-1.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-400 text-xs font-mono">{'// TODO: plug in component here'}</p>
      </div>
    </div>
  </div>
);

// ===== MAIN PAGE =====
export const ZoneDetailPage: React.FC = () => {
  const { zoneId }   = useParams<{ zoneId: string }>();
  const navigate     = useNavigate();

  const [zone,      setZone]      = useState<Zone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchZone = async () => {
    if (!zoneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await zoneService.getZoneById(zoneId);
      setZone(data);
    } catch (err: any) {
      setError(err.message ?? 'Không thể tải thông tin vùng ao.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchZone(); }, [zoneId]);

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  // ===== ERROR =====
  if (error || !zone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
        <AlertCircle size={32} className="text-red-400 mb-3" />
        <p className="text-gray-600 text-sm font-medium mb-1">Không tìm thấy vùng ao</p>
        <p className="text-gray-400 text-xs mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/zones')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <button
            onClick={fetchZone}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={13} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[zone.status];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/admin/zones" className="hover:text-gray-600 transition-colors">Vùng ao</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{zone.name}</span>
      </nav>

      {/* Zone Header Card */}
      <div className="bg-gradient-to-br from-teal-800 to-emerald-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon + Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Waves size={28} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white text-xl font-bold truncate">{zone.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {zone.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-emerald-200" />
                    <span className="text-emerald-200 text-xs">{zone.location}</span>
                  </div>
                )}
                {zone.farming_type && (
                  <div className="flex items-center gap-1">
                    <Fish size={12} className="text-emerald-200" />
                    <span className="text-emerald-200 text-xs">{zone.farming_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side: status + back button */}
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button
              id="back-to-zones"
              onClick={() => navigate('/admin/zones')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <ArrowLeft size={13} />
              Quay lại
            </button>
            <button
              id="refresh-zone-detail"
              onClick={fetchZone}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Tải lại"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Zone meta row */}
        <div className="bg-black/10 px-6 py-2.5 flex gap-6 text-xs text-emerald-100">
          <span>ID: <span className="font-mono">{zone.id.slice(0, 8)}…</span></span>
          <span>Tạo ngày: <span className="font-medium">{new Date(zone.created_at).toLocaleDateString('vi-VN')}</span></span>
        </div>
      </div>

      {/* ===== PLACEHOLDER SECTIONS (other teams plug in here) ===== */}

      {/* Overview quick-stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ao nuôi',       value: '—', icon: <LayoutGrid size={18} />, bg: 'bg-blue-50',    text: 'text-blue-700'    },
          { label: 'Thiết bị',      value: '—', icon: <Cpu       size={18} />, bg: 'bg-purple-50',  text: 'text-purple-700'  },
          { label: 'Cảm biến',      value: '—', icon: <Activity  size={18} />, bg: 'bg-teal-50',    text: 'text-teal-700'    },
          { label: 'Cảnh báo hôm nay', value: '—', icon: <Bell  size={18} />, bg: 'bg-amber-50',   text: 'text-amber-700'   },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`${text} opacity-70`}>{icon}</div>
            <div>
              <p className={`${text} text-xl font-bold leading-tight`}>{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2-column layout for the main placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlaceholderSection
          icon={<Activity size={18} className="text-teal-600" />}
          title="Dữ liệu cảm biến"
          description="Biểu đồ real-time: nhiệt độ, pH, DO, độ mặn..."
          team="Nhóm Sensor Module"
          color="bg-teal-50 text-teal-800"
        />
        <PlaceholderSection
          icon={<Cpu size={18} className="text-purple-600" />}
          title="Điều khiển thiết bị"
          description="Bảng điều khiển máy bơm, quạt nước, đèn UV..."
          team="Nhóm Actuator Module"
          color="bg-purple-50 text-purple-800"
        />
      </div>

      <PlaceholderSection
        icon={<Bell size={18} className="text-amber-600" />}
        title="Cảnh báo & Ngưỡng"
        description="Danh sách cảnh báo, lịch sử sự kiện, cấu hình ngưỡng cho vùng ao này"
        team="Nhóm Alert Module"
        color="bg-amber-50 text-amber-800"
      />
    </div>
  );
};
