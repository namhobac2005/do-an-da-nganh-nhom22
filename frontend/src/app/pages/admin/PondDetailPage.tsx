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
import type { PondDetail } from '../../types/user.types';
import * as zoneService from '../../services/zoneService';
import * as alertService from '../../services/alertService';
import * as deviceService from '../../services/deviceService';
import * as sensorService from '../../services/sensorService';
import { ShieldAlert, Droplets, Sun, ThermometerSun, Zap, Trash2, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:      { label: 'Hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { label: 'Ngưng HĐ',  bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  maintenance: { label: 'Bảo trì',   bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
};
// ===== TAB CONTENT =====


// ===== TAB DEFINITIONS =====
type TabKey = 'dashboard' | 'devices' | 'alerts';
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { key: 'devices',   label: 'Thiết bị',   icon: <Cpu size={16} /> },
  { key: 'alerts',    label: 'Cảnh báo',   icon: <Bell size={16} /> },
];

const DashboardTab: React.FC<{ pondId: string }> = ({ pondId }) => {
  const [sensors, setSensors] = useState<sensorService.SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sensorService.getLatestSensors(pondId)
      .then(setSensors)
      .catch(() => setSensors([]))
      .finally(() => setLoading(false));
  }, [pondId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (sensors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center">
        <LayoutDashboard size={40} className="text-gray-200 mb-3" />
        <p className="text-gray-400 font-medium">Chưa có dữ liệu</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    if (type.toLowerCase().includes('nhiệt độ')) return <ThermometerSun size={20} className="text-orange-500" />;
    if (type.toLowerCase().includes('sáng')) return <Sun size={20} className="text-amber-500" />;
    return <Droplets size={20} className="text-blue-500" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensors.map(s => (
        <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-gray-50 rounded-xl">{getIcon(s.type)}</div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{s.name}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value} <span className="text-sm font-normal text-gray-500">{s.unit}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
};

const DevicesTab: React.FC<{ pondId: string }> = ({ pondId }) => {
  const [devices, setDevices] = useState<deviceService.Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deviceService.getAllDevices()
      .then(res => setDevices(res
        .filter(d => d.pond_id === pondId)
        .map(d => ({ ...d, status: ((d as any).status ?? 'OFF') } as deviceService.Device))
      ))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, [pondId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center">
        <Cpu size={40} className="text-gray-200 mb-3" />
        <p className="text-gray-400 font-medium">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <th className="p-4">Tên thiết bị</th>
            <th className="p-4">Loại</th>
            <th className="p-4">Trạng thái</th>
            <th className="p-4">Chế độ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {devices.map(d => (
            <tr key={d.id} className="hover:bg-gray-50/50">
              <td className="p-4 font-medium text-gray-800">{d.name}</td>
              <td className="p-4 text-sm text-gray-600">{d.type}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${d.status === 'ON' || d.status === '1' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                  {d.status === 'ON' || d.status === '1' ? 'Đang bật' : 'Đang tắt'}
                </span>
              </td>
              <td className="p-4 text-sm text-gray-600">{d.mode === 'auto' ? 'Tự động' : 'Thủ công'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AlertsTab: React.FC<{ pondId: string }> = ({ pondId }) => {
  const [logs, setLogs] = useState<alertService.AlertLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertService.getAlertLogs({ zoneId: pondId, limit: 5 })
      .then(res => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [pondId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center">
        <ShieldAlert size={40} className="text-gray-200 mb-3" />
        <p className="text-gray-400 font-medium">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <th className="p-4">Thời gian</th>
            <th className="p-4">Chỉ số</th>
            <th className="p-4">Giá trị</th>
            <th className="p-4">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map(log => {
            const dt = new Date(log.created_at);
            return (
              <tr key={log.id} className="hover:bg-gray-50/50">
                <td className="p-4 text-sm text-gray-600">
                  {dt.toLocaleDateString('vi-VN')} {dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4 text-sm font-medium text-gray-700">{log.metric}</td>
                <td className="p-4 text-sm text-red-600 font-bold">{log.recorded_value}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${log.status === 'unread' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {log.status === 'unread' ? 'Chưa xử lý' : 'Đã xử lý'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

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
