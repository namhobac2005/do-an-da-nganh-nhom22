/**
 * Dashboard.tsx
 * Hệ thống quản lý nuôi trồng thủy hải sản thông minh
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  MapPin,
  Fish,
} from 'lucide-react';

// Import các Service thực tế từ dự án của bạn
import * as sensorService from '../../services/sensorService';
import * as dashboardService from '../../services/dashboardService';

// --- Thành phần: Thẻ chỉ số KPI (Hàng trên cùng) ---
const StatCard = ({ title, value, subtitle, icon, color, bgColor }: any) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-[13px] font-medium">{title}</p>
        <p className={`mt-1 ${color} text-[28px] font-bold leading-tight`}>
          {value}
        </p>
        <p className="text-gray-400 mt-1 text-[12px]">{subtitle}</p>
      </div>
      <div
        className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// --- Thành phần: Thẻ trạng thái cảm biến (Dạng số, thay cho biểu đồ) ---
const SensorStatusCard = ({
  label,
  value,
  unit,
  min,
  max,
  status,
  icon,
}: any) => {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  );
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
    <div
      className={`rounded-xl p-4 border ${bgColors[status as keyof typeof bgColors] || bgColors.normal}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={
              statusColors[status as keyof typeof statusColors] ||
              statusColors.normal
            }
          >
            {icon}
          </span>
          <span className="text-gray-700 text-[13px] font-medium">{label}</span>
        </div>
        <span
          className={`${statusColors[status as keyof typeof statusColors] || statusColors.normal} text-[18px] font-bold`}
        >
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColors[status as keyof typeof barColors] || barColors.normal} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-gray-400 text-[11px]">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();

  // --- States cho Dữ liệu Tổng quát ---
  const [kpis, setKpis] = useState<dashboardService.DashboardKPIs | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<
    dashboardService.RecentAlert[]
  >([]);
  const [zonesOverview, setZonesOverview] = useState<
    dashboardService.ZoneOverview[]
  >([]);

  // --- States cho Bộ lọc và Cảm biến theo Ao ---
  const [zones, setZones] = useState<sensorService.Zone[]>([]);
  const [ponds, setPonds] = useState<sensorService.Pond[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPond, setSelectedPond] = useState<string>('');
  const [sensorStatusData, setSensorStatusData] = useState<
    sensorService.SensorData[]
  >([]);

  // --- States cho Phân trang (Pagination) của Zones ---
  const [currentPage, setCurrentPage] = useState(1);
  const zonesPerPage = 6;

  // 1. Khởi tạo: Lấy dữ liệu KPI, Alerts và danh sách Zones
  useEffect(() => {
    dashboardService.getKPIs().then(setKpis);
    dashboardService.getRecentAlerts(5).then(setRecentAlerts);
    dashboardService.getZonesOverview().then(setZonesOverview);

    sensorService.getZones().then((data) => {
      setZones(data);
      // Bỏ đoạn tự động chọn Zone ở đây để nó hiện "-- Chọn Vùng Nuôi --"
    });
  }, []);

  // 2. Khi chọn Zone: Lấy danh sách Ao của Zone đó
  useEffect(() => {
    if (!selectedZone) {
      setPonds([]); // Nếu không chọn vùng thì xóa danh sách ao
      return;
    }
    sensorService.getPondsByZone(selectedZone).then((data) => {
      setPonds(data);
      setSelectedPond(''); // Cố tình set rỗng để hiện "-- Chọn Ao Nuôi --"
    });
  }, [selectedZone]);

  // 2. Khi chọn Zone: Lấy danh sách Ao của Zone đó
  useEffect(() => {
    if (!selectedZone) return;
    sensorService.getPondsByZone(selectedZone).then((data) => {
      setPonds(data);
      if (data.length > 0) setSelectedPond(data[0].id);
      else setSelectedPond('');
    });
  }, [selectedZone]);

  // 3. Khi chọn Ao: Lấy dữ liệu cảm biến mới nhất
  useEffect(() => {
    if (!selectedPond) {
      setSensorStatusData([]);
      return;
    }

    // Hàm gọi API
    const fetchLatestData = () => {
      sensorService.getLatestSensors(selectedPond).then(setSensorStatusData);
    };

    // 1. Gọi ngay lập tức lần đầu tiên khi vừa chọn Ao
    fetchLatestData();

    // 2. Cài đặt bộ đếm (Interval) cứ 5 giây (5000ms) gọi lại hàm 1 lần
    const interval = setInterval(fetchLatestData, 5000);

    // 3. Clean-up: Hủy bộ đếm khi bạn chọn sang Ao khác hoặc rời khỏi trang Dashboard
    return () => clearInterval(interval);
  }, [selectedPond]);

  // Logic phân trang
  const totalPages = Math.ceil(zonesOverview.length / zonesPerPage);
  const currentZones = zonesOverview.slice(
    (currentPage - 1) * zonesPerPage,
    currentPage * zonesPerPage,
  );

  const deviceStatusData = kpis
    ? [
        { name: 'Hoạt động', value: kpis.activeDevices, color: '#10b981' },
        {
          name: 'Ngoại tuyến',
          value: Math.max(0, kpis.totalDevices - kpis.onlineDevices),
          color: '#ef4444',
        },
        {
          name: 'Chờ',
          value: Math.max(0, kpis.onlineDevices - kpis.activeDevices),
          color: '#f59e0b',
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-10">
      {/* HÀNG 1: KPI TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Khu Vực"
          value={kpis?.totalZones || 0}
          subtitle="Tổng số vùng quản lý"
          icon={<Waves size={22} />}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatCard
          title="Ao Nuôi"
          value={kpis?.totalPonds || 0}
          subtitle="Tổng ao đang vận hành"
          icon={<Activity size={22} />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Thiết Bị"
          value={`${kpis?.onlineDevices || 0}/${kpis?.totalDevices || 0}`}
          subtitle="Đang kết nối trực tuyến"
          icon={<Cpu size={22} />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Cảnh Báo"
          value={kpis?.criticalAlerts || 0}
          subtitle="Cần xử lý khẩn cấp"
          icon={<BellRing size={22} />}
          color={
            (kpis?.criticalAlerts || 0) > 0 ? 'text-red-600' : 'text-gray-400'
          }
          bgColor={(kpis?.criticalAlerts || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}
        />
      </div>

      {/* HÀNG 2: BỘ LỌC VÀ TRẠNG THÁI AO CỤ THỂ */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-gray-900 text-lg font-bold">Giám Sát Nhanh</h3>
            <p className="text-gray-400 text-sm">
              Xem thông số môi trường tức thời của từng ao
            </p>
          </div>

          {/* THANH CHỌN KHU VỰC & AO (Style giống Monitoring) */}
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="bg-slate-50 p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1 xl:min-w-[220px]">
              <MapPin className="text-slate-400" size={18} />
              <select
                className="w-full bg-transparent font-semibold text-slate-700 outline-none text-sm cursor-pointer"
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  setSelectedPond('');
                }}
              >
                <option value="">-- Chọn Vùng Nuôi --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1 xl:min-w-[220px]">
              <Fish className="text-slate-400" size={18} />
              <select
                className="w-full bg-transparent font-semibold text-slate-700 outline-none text-sm cursor-pointer"
                disabled={!selectedZone}
                value={selectedPond}
                onChange={(e) => setSelectedPond(e.target.value)}
              >
                <option value="">-- Chọn Ao Nuôi --</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {!selectedZone || !selectedPond ? (
            /* TRẠNG THÁI CHƯA CHỌN VÙNG/AO */
            <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <Activity size={32} className="mx-auto mb-3 opacity-20" />
              <p>Vui lòng chọn Vùng và Ao để xem dữ liệu tức thời.</p>
            </div>
          ) : sensorStatusData.length > 0 ? (
            /* TRẠNG THÁI CÓ DỮ LIỆU */
            <>
              {sensorStatusData.map((s) => {
                let label = s.name || s.type;
                let unit = s.unit || '';
                let min = 0;
                let max = 100;
                let icon = <Activity size={18} />;

                if (s.type === 'temperature') {
                  label = 'Nhiệt độ';
                  unit = '°C';
                  min = 20;
                  max = 35;
                  icon = <ThermometerSun size={18} />;
                } else if (s.type === 'water-level') {
                  label = 'Mực nước';
                  unit = '%';
                  min = 10;
                  max = 90;
                  icon = <Waves size={18} />;
                } else if (s.type === 'brightness') {
                  label = 'Ánh sáng';
                  unit = '%';
                  min = 0;
                  max = 100;
                  icon = <Sun size={18} />;
                }

                return (
                  <SensorStatusCard
                    key={s.id}
                    label={label}
                    value={s.value}
                    unit={unit}
                    min={min}
                    max={max}
                    status={s.status || 'normal'}
                    icon={icon}
                  />
                );
              })}

              {/* Thẻ thứ 4: Link sang Monitoring */}
              <div
                onClick={() =>
                  navigate(
                    `/monitoring?zoneId=${selectedZone}&pondId=${selectedPond}`,
                  )
                }
                className="group rounded-xl p-4 border-2 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 mb-3 group-hover:scale-110 group-hover:text-blue-600 transition-transform duration-300">
                  <Activity size={24} />
                </div>
                <span className="text-[14px] font-bold text-blue-700 group-hover:text-blue-800">
                  Phân Tích Chi Tiết
                </span>
                <span className="text-[11px] text-blue-500 mt-1 flex items-center gap-1 font-medium">
                  Chuyển sang biểu đồ <ArrowUpRight size={14} />
                </span>
              </div>
            </>
          ) : (
            /* TRẠNG THÁI CHỌN AO NHƯNG KHÔNG CÓ DATA SENSOR */
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Activity size={28} className="text-gray-300" />
              </div>
              <div>
                <p className="font-bold text-gray-700 text-[15px]">
                  Ao này chưa có dữ liệu
                </p>
                <p className="text-[13px] text-gray-400 mt-1">
                  Cảm biến có thể đang tắt hoặc chưa được kết nối.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HÀNG 3: BIỂU ĐỒ THIẾT BỊ & NHẬT KÝ CẢNH BÁO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 font-bold mb-4">Hạ Tầng Thiết Bị</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deviceStatusData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {deviceStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {deviceStatusData.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />{' '}
                  {d.name}
                </div>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 font-bold mb-4">Cảnh Báo Gần Đây</h3>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${a.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {a.pondName} - {a.sensorType}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {a.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-gray-400">
                Không có cảnh báo mới.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* HÀNG 4: TỔNG QUAN KHU VỰC (VỚI PHÂN TRANG VÀ ĐIỀU HƯỚNG) */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900 font-bold">Danh Sách Khu Vực</h3>
            <p className="text-gray-400 text-xs">
              Nhấp vào khu vực để xem chi tiết giám sát
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border rounded-md disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 border rounded-md disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentZones.map((z) => (
            <div
              key={z.id}
              onClick={() => navigate(`/admin/zones/${z.id}`)}
              className="group border border-gray-100 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-gray-50/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <p className="text-gray-900 font-bold group-hover:text-blue-600 truncate">
                    {z.name}
                  </p>
                  <p className="text-gray-400 text-[11px] flex items-center gap-1 mt-1 truncate">
                    <Settings size={12} />{' '}
                    {z.location || 'Vị trí chưa xác định'}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-gray-300 group-hover:text-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                  <p className="text-blue-600 font-bold text-lg">
                    {z.totalPonds}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">
                    Ao
                  </p>
                </div>
                <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                  <p className="text-emerald-500 font-bold text-lg">
                    {z.activeDevices}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">
                    Máy
                  </p>
                </div>
                <div
                  className={`bg-white p-2 rounded-lg text-center shadow-sm ${z.activeAlerts > 0 ? 'ring-1 ring-red-100' : ''}`}
                >
                  <p
                    className={`${z.activeAlerts > 0 ? 'text-red-500' : 'text-gray-300'} font-bold text-lg`}
                  >
                    {z.activeAlerts}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">
                    Lỗi
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
