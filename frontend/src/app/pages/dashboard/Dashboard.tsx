/**
 * Dashboard.tsx
 * Trang tổng quan hệ thống - hiển thị KPIs, biểu đồ cảm biến, và trạng thái thiết bị
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Waves,
  Cpu,
  BellRing,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ThermometerSun,
  Droplets,
  Wind,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  MOCK_ZONES,
  MOCK_PONDS,
  MOCK_DEVICES,
  MOCK_SENSORS,
  MOCK_ALERTS,
  generateSensorHistory,
} from '../../data/mockData';

// ===== STAT CARD COMPONENT =====

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, bgColor, trend }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500" style={{ fontSize: '13px', fontWeight: 500 }}>{title}</p>
        <p className={`mt-1 ${color}`} style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>
          {value}
        </p>
        <p className="text-gray-400 mt-1" style={{ fontSize: '12px' }}>{subtitle}</p>
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-3 ${trend.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{Math.abs(trend.value)}% so với hôm qua</span>
      </div>
    )}
  </div>
);

// ===== SENSOR STATUS CARD =====

interface SensorStatusProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

const SensorStatusCard: React.FC<SensorStatusProps> = ({ label, value, unit, min, max, status, icon }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const statusColors = {
    normal: 'text-emerald-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  };
  const barColors = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };
  const bgColors = {
    normal: 'bg-emerald-50 border-emerald-100',
    warning: 'bg-amber-50 border-amber-100',
    critical: 'bg-red-50 border-red-100',
  };

  return (
    <div className={`rounded-xl p-4 border ${bgColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={statusColors[status]}>{icon}</span>
          <span className="text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
        </div>
        <span className={`${statusColors[status]}`} style={{ fontSize: '18px', fontWeight: 700 }}>
          {value}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColors[status]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-gray-400" style={{ fontSize: '11px' }}>{min}{unit}</span>
        <span className="text-gray-400" style={{ fontSize: '11px' }}>{max}{unit}</span>
      </div>
    </div>
  );
};

// ===== MAIN DASHBOARD =====

export const Dashboard: React.FC = () => {
  const [selectedPond, setSelectedPond] = useState('pond-a1');

  // Tính toán KPIs
  const totalZones = MOCK_ZONES.length;
  const totalPonds = MOCK_PONDS.filter((p) => p.status === 'active').length;
  const totalDevices = MOCK_DEVICES.length;
  const onlineDevices = MOCK_DEVICES.filter((d) => d.isOnline).length;
  const activeDevices = MOCK_DEVICES.filter((d) => d.isActive).length;
  const criticalAlerts = MOCK_ALERTS.filter((a) => a.severity === 'critical' && !a.isResolved).length;

  // Dữ liệu biểu đồ tổng hợp (24h)
  const tempHistory = generateSensorHistory(28.5, 2);
  const phHistory = generateSensorHistory(7.8, 0.4);
  const doHistory = generateSensorHistory(5.2, 1.0);

  const chartData = tempHistory.map((item, index) => ({
    time: new Date(item.timestamp).getHours() + ':00',
    'Nhiệt độ (°C)': item.value,
    'pH': phHistory[index]?.value ?? 7.5,
    'DO (mg/L)': doHistory[index]?.value ?? 5.0,
  }));

  // Dữ liệu Pie chart trạng thái thiết bị
  const deviceStatusData = [
    { name: 'Online & Hoạt động', value: activeDevices, color: '#10b981' },
    { name: 'Online & Tắt', value: onlineDevices - activeDevices, color: '#6b7280' },
    { name: 'Offline', value: totalDevices - onlineDevices, color: '#ef4444' },
  ];

  // Cảm biến tổng hợp cho Pond A1
  const pondSensors = MOCK_SENSORS.filter((s) => s.pondId === selectedPond);

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vùng Ao Hoạt động"
          value={totalZones}
          subtitle={`${totalZones} khu vực`}
          icon={<Waves size={22} />}
          color="text-teal-600"
          bgColor="bg-teal-50"
          trend={{ value: 0, isUp: true }}
        />
        <StatCard
          title="Ao Đang Nuôi"
          value={totalPonds}
          subtitle={`${MOCK_PONDS.length} ao tổng cộng`}
          icon={<Activity size={22} />}
          color="text-blue-600"
          bgColor="bg-blue-50"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="Thiết Bị Online"
          value={`${onlineDevices}/${totalDevices}`}
          subtitle={`${activeDevices} đang hoạt động`}
          icon={<Cpu size={22} />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend={{ value: 3, isUp: true }}
        />
        <StatCard
          title="Cảnh Báo Nghiêm Trọng"
          value={criticalAlerts}
          subtitle="Cần xử lý ngay"
          icon={<BellRing size={22} />}
          color={criticalAlerts > 0 ? 'text-red-600' : 'text-gray-600'}
          bgColor={criticalAlerts > 0 ? 'bg-red-50' : 'bg-gray-50'}
          trend={{ value: criticalAlerts > 0 ? 50 : 0, isUp: false }}
        />
      </div>

      {/* Main Charts & Sensor Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart - Lịch sử cảm biến 24h */}
        <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
                Biểu Đồ Cảm Biến 24 Giờ
              </h3>
              <p className="text-gray-400" style={{ fontSize: '12px' }}>Dữ liệu real-time từ Adafruit IO</p>
            </div>
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none"
              style={{ fontSize: '13px' }}
              value={selectedPond}
              onChange={(e) => setSelectedPond(e.target.value)}
            >
              {MOCK_PONDS.filter((p) => p.status === 'active').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData.filter((_, i) => i % 2 === 0)}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="Nhiệt độ (°C)" stroke="#f97316" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
              <Area type="monotone" dataKey="DO (mg/L)" stroke="#3b82f6" strokeWidth={2} fill="url(#doGrad)" dot={false} />
              <Line type="monotone" dataKey="pH" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Trạng thái thiết bị */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 mb-1" style={{ fontSize: '15px', fontWeight: 600 }}>
            Trạng Thái Thiết Bị
          </h3>
          <p className="text-gray-400 mb-4" style={{ fontSize: '12px' }}>
            Tổng {totalDevices} thiết bị
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={deviceStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {deviceStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {deviceStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600" style={{ fontSize: '12px' }}>{item.name}</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Status + Recent Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Status Cards */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
              Thông Số Cảm Biến
            </h3>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg" style={{ fontSize: '12px', fontWeight: 500 }}>
              Ao A1 - Real-time
            </span>
          </div>
          <div className="space-y-3">
            {pondSensors.slice(0, 4).map((sensor) => {
              const icons: Record<string, React.ReactNode> = {
                temperature: <ThermometerSun size={16} />,
                ph: <Droplets size={16} />,
                do: <Wind size={16} />,
                turbidity: <Activity size={16} />,
              };
              const labels: Record<string, string> = {
                temperature: 'Nhiệt độ',
                ph: 'Độ pH',
                do: 'Oxy hòa tan',
                turbidity: 'Độ đục',
                salinity: 'Độ mặn',
              };
              return (
                <SensorStatusCard
                  key={sensor.id}
                  label={labels[sensor.type] || sensor.type}
                  value={sensor.currentValue}
                  unit={sensor.unit}
                  min={sensor.minThreshold}
                  max={sensor.maxThreshold}
                  status={sensor.status}
                  icon={icons[sensor.type] || <Activity size={16} />}
                />
              );
            })}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
              Cảnh Báo Gần Đây
            </h3>
            <span className="text-emerald-600 hover:underline cursor-pointer" style={{ fontSize: '13px' }}>
              Xem tất cả →
            </span>
          </div>
          <div className="space-y-3">
            {MOCK_ALERTS.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                !alert.isRead ? 'bg-gray-50' : ''
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-red-100'
                    : alert.severity === 'warning'
                    ? 'bg-amber-100'
                    : 'bg-blue-100'
                }`}>
                  {alert.severity === 'critical' ? (
                    <AlertTriangle size={15} className="text-red-600" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle size={15} className="text-amber-600" />
                  ) : (
                    <CheckCircle2 size={15} className="text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 truncate" style={{ fontSize: '13px', fontWeight: 500 }}>
                      {alert.pondName} - {alert.sensorType}
                    </span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-500 truncate" style={{ fontSize: '12px' }}>
                    {alert.message.substring(0, 55)}...
                  </p>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: '11px' }}>
                    {new Date(alert.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : alert.severity === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`} style={{ fontSize: '10px', fontWeight: 600 }}>
                  {alert.severity === 'critical' ? 'NGUY CẤP' : alert.severity === 'warning' ? 'CẢNH BÁO' : 'INFO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Overview Grid */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
            Tổng Quan Theo Khu Vực
          </h3>
          <TrendingUp size={18} className="text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_ZONES.map((zone) => {
            const zonePonds = MOCK_PONDS.filter((p) => p.zoneId === zone.id);
            const zoneDevices = MOCK_DEVICES.filter((d) => d.zoneId === zone.id);
            const zoneActiveDevices = zoneDevices.filter((d) => d.isActive).length;
            const zoneAlerts = MOCK_ALERTS.filter(
              (a) => zonePonds.some((p) => p.id === a.pondId) && !a.isResolved
            ).length;

            return (
              <div key={zone.id} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>{zone.name}</p>
                    <p className="text-gray-400" style={{ fontSize: '12px' }}>{zone.location}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full ${
                    zone.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : zone.status === 'maintenance'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`} style={{ fontSize: '11px', fontWeight: 600 }}>
                    {zone.status === 'active' ? 'Hoạt động' : zone.status === 'maintenance' ? 'Bảo trì' : 'Tắt'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-blue-700" style={{ fontSize: '16px', fontWeight: 700 }}>{zonePonds.length}</p>
                    <p className="text-blue-500" style={{ fontSize: '10px' }}>Ao nuôi</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-700" style={{ fontSize: '16px', fontWeight: 700 }}>{zoneActiveDevices}</p>
                    <p className="text-emerald-500" style={{ fontSize: '10px' }}>Đang chạy</p>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${zoneAlerts > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`${zoneAlerts > 0 ? 'text-red-700' : 'text-gray-500'}`} style={{ fontSize: '16px', fontWeight: 700 }}>{zoneAlerts}</p>
                    <p className={`${zoneAlerts > 0 ? 'text-red-400' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>Cảnh báo</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
