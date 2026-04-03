/**
 * BaoCao.tsx
 * Trang Báo Cáo & Thống Kê - Xuất báo cáo Excel/PDF (giả lập)
 */

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { MOCK_ZONES, MOCK_PONDS, MOCK_DEVICES, generateSensorHistory } from '../../data/mockData';

// Dữ liệu thống kê tổng hợp theo ngày trong tuần
const WEEKLY_SENSOR_DATA = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => ({
  day,
  'Nhiệt độ TB (°C)': 27 + Math.sin(i * 0.8) * 1.5 + Math.random() * 0.5,
  'pH TB': 7.5 + Math.cos(i * 0.5) * 0.3,
  'DO TB (mg/L)': 5.5 + Math.sin(i * 1.2) * 0.8,
}));

// Thống kê thiết bị theo khu vực
const DEVICE_USAGE_DATA = MOCK_ZONES.map((zone) => {
  const zoneDevices = MOCK_DEVICES.filter((d) => d.zoneId === zone.id);
  return {
    name: zone.name.split(' - ')[0],
    'Tổng thiết bị': zoneDevices.length,
    'Đang hoạt động': zoneDevices.filter((d) => d.isActive).length,
    'Offline': zoneDevices.filter((d) => !d.isOnline).length,
  };
});

const ALERT_PIE_DATA = [
  { name: 'Nguy cấp', value: 2, color: '#ef4444' },
  { name: 'Cảnh báo', value: 4, color: '#f59e0b' },
  { name: 'Thông tin', value: 1, color: '#3b82f6' },
];

export const BaoCao: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2024-07-14');
  const [dateTo, setDateTo] = useState('2024-07-20');
  const [selectedZone, setSelectedZone] = useState('all');
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  // Giả lập xuất báo cáo
  const handleExport = async (type: 'excel' | 'pdf') => {
    setIsExporting(type);
    await new Promise((r) => setTimeout(r, 1500));
    setIsExporting(null);
    alert(`✅ Đã xuất báo cáo ${type.toUpperCase()} thành công!\n\nFile: BaoCao_AoNuoi_${dateFrom}_${dateTo}.${type === 'excel' ? 'xlsx' : 'pdf'}\n\n(Trong môi trường production, file sẽ tự động tải về)`);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Export Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>
              Từ ngày
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: '13px' }} />
          </div>
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>
              Đến ngày
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: '13px' }} />
          </div>
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>
              Khu vực
            </label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: '13px' }}>
              <option value="all">Tất cả khu vực</option>
              {MOCK_ZONES.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={!!isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {isExporting === 'excel' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <FileSpreadsheet size={16} />}
              Xuất Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {isExporting === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <FileText size={16} />}
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng ao hoạt động', value: MOCK_PONDS.filter((p) => p.status === 'active').length, unit: 'ao', color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Thời gian hoạt động TB', value: '18.5', unit: 'giờ/ngày', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Cảnh báo trong kỳ', value: 7, unit: 'sự kiện', color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Điện năng tiêu thụ', value: '124.5', unit: 'kWh/ngày', color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-5`}>
            <p className="text-gray-500 mb-1" style={{ fontSize: '12px' }}>{kpi.label}</p>
            <p className={kpi.color} style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.2 }}>
              {kpi.value}
              <span style={{ fontSize: '13px', fontWeight: 400 }}> {kpi.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Weekly Sensor Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>
            Xu Hướng Cảm Biến Trong Tuần
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKLY_SENSOR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(2)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Nhiệt độ TB (°C)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pH TB" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="DO TB (mg/L)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Distribution Pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>
            Phân Bố Cảnh Báo
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={ALERT_PIE_DATA} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} style={{ fontSize: 10 }}>
                {ALERT_PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {ALERT_PIE_DATA.map((item) => (
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

      {/* Device Usage Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-900 mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>
          Thống Kê Thiết Bị Theo Khu Vực
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DEVICE_USAGE_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Tổng thiết bị" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Đang hoạt động" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Offline" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
