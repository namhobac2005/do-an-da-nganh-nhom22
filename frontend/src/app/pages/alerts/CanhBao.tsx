/**
 * CanhBao.tsx
 * Module Cảnh Báo & Ngưỡng Thiết Lập
 * - Bảng hiển thị nhật ký cảnh báo
 * - Form thiết lập ngưỡng cảnh báo (Threshold)
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  BellRing,
  Settings,
  Filter,
  Check,
  X,
  ThermometerSun,
  Droplets,
  Wind,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { MOCK_ALERTS, MOCK_SENSORS, MOCK_PONDS, type Alert } from '../../data/mockData';

// ===== THRESHOLD FORM =====

interface Threshold {
  sensorType: string;
  minValue: number;
  maxValue: number;
  unit: string;
}

const SENSOR_CONFIGS: Threshold[] = [
  { sensorType: 'Nhiệt độ', minValue: 25, maxValue: 33, unit: '°C' },
  { sensorType: 'pH', minValue: 7.0, maxValue: 8.5, unit: '' },
  { sensorType: 'DO (Oxy hòa tan)', minValue: 4.0, maxValue: 8.0, unit: 'mg/L' },
  { sensorType: 'Độ đục', minValue: 15, maxValue: 50, unit: 'NTU' },
  { sensorType: 'Độ mặn', minValue: 5, maxValue: 25, unit: '‰' },
  { sensorType: 'Amoniac (NH₃)', minValue: 0, maxValue: 0.5, unit: 'mg/L' },
];

const ThresholdForm: React.FC = () => {
  const [thresholds, setThresholds] = useState<Threshold[]>(SENSOR_CONFIGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = (index: number, field: 'minValue' | 'maxValue', value: string) => {
    setThresholds((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: parseFloat(value) || 0 } : t))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
  };

  const sensorIcons: Record<string, React.ReactNode> = {
    'Nhiệt độ': <ThermometerSun size={16} />,
    'pH': <Droplets size={16} />,
    'DO (Oxy hòa tan)': <Wind size={16} />,
    'Độ đục': <Activity size={16} />,
    'Độ mặn': <Droplets size={16} />,
    'Amoniac (NH₃)': <AlertTriangle size={16} />,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
          <Settings size={18} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
            Thiết Lập Ngưỡng Cảnh Báo
          </h3>
          <p className="text-gray-400" style={{ fontSize: '12px' }}>
            Hệ thống sẽ tự động cảnh báo khi giá trị vượt ngưỡng
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {thresholds.map((threshold, index) => (
          <div key={threshold.sensorType} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 w-44 shrink-0">
              <span className="text-gray-500">{sensorIcons[threshold.sensorType]}</span>
              <span className="text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>
                {threshold.sensorType}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-gray-400" style={{ fontSize: '12px' }}>Min:</span>
              <input
                type="number"
                step="0.1"
                value={threshold.minValue}
                onChange={(e) => handleUpdate(index, 'minValue', e.target.value)}
                className="w-20 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 outline-none focus:border-amber-400 text-center"
                style={{ fontSize: '13px' }}
              />
              <span className="text-gray-400" style={{ fontSize: '12px' }}>Max:</span>
              <input
                type="number"
                step="0.1"
                value={threshold.maxValue}
                onChange={(e) => handleUpdate(index, 'maxValue', e.target.value)}
                className="w-20 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 outline-none focus:border-amber-400 text-center"
                style={{ fontSize: '13px' }}
              />
              {threshold.unit && (
                <span className="text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1.5"
                  style={{ fontSize: '12px' }}>
                  {threshold.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white transition-colors ${
            saved ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'
          } disabled:opacity-60`}
          style={{ fontWeight: 600 }}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={16} />
              Đã lưu thành công!
            </>
          ) : (
            'Lưu Ngưỡng Cảnh Báo'
          )}
        </button>
      </div>
    </div>
  );
};

// ===== ALERT TABLE =====

const SEVERITY_CONFIG = {
  critical: { label: 'NGUY CẤP', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: <AlertTriangle size={14} /> },
  warning:  { label: 'CẢNH BÁO', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertTriangle size={14} /> },
  info:     { label: 'THÔNG TIN', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: <Info size={14} /> },
};

// ===== MAIN COMPONENT =====

export const CanhBao: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [activeTab, setActiveTab] = useState<'log' | 'threshold'>('log');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Đánh dấu đã đọc
  const markAsRead = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
  };

  // Đánh dấu đã xử lý
  const markAsResolved = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isResolved: true, isRead: true } : a)));
    if (selectedAlert?.id === alertId) {
      setSelectedAlert((prev) => prev ? { ...prev, isResolved: true } : null);
    }
  };

  // Đánh dấu tất cả đã đọc
  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterRead === 'unread' && a.isRead) return false;
    if (filterRead === 'read' && !a.isRead) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length;

  return (
    <div className="space-y-5">
      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng cảnh báo', value: alerts.length, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Nguy cấp', value: criticalCount, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Chưa đọc', value: unreadCount, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Đã xử lý', value: alerts.filter((a) => a.isResolved).length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={s.color} style={{ fontSize: '26px', fontWeight: 700 }}>{s.value}</p>
            <p className="text-gray-500" style={{ fontSize: '12px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'log', label: '📋 Nhật ký cảnh báo', badge: unreadCount },
          { key: 'threshold', label: '⚙️ Thiết lập ngưỡng' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'log' | 'threshold')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400 }}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5" style={{ fontSize: '10px', fontWeight: 700 }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'log' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Alert List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <Filter size={15} className="text-gray-400" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none"
                style={{ fontSize: '13px' }}
              >
                <option value="all">Tất cả mức độ</option>
                <option value="critical">Nguy cấp</option>
                <option value="warning">Cảnh báo</option>
                <option value="info">Thông tin</option>
              </select>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none"
                style={{ fontSize: '13px' }}
              >
                <option value="all">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="ml-auto flex items-center gap-1.5 text-emerald-600 hover:underline"
                  style={{ fontSize: '13px' }}
                >
                  <Check size={14} />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Alert Items */}
            <div className="divide-y divide-gray-50">
              {filteredAlerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity];
                return (
                  <div
                    key={alert.id}
                    onClick={() => { setSelectedAlert(alert); markAsRead(alert.id); }}
                    className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedAlert?.id === alert.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {alert.pondName} - {alert.sensorType}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}
                          style={{ fontSize: '10px', fontWeight: 700 }}>
                          {config.label}
                        </span>
                        {!alert.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        {alert.isResolved && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"
                            style={{ fontSize: '10px', fontWeight: 600 }}>
                            Đã xử lý
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-0.5 truncate" style={{ fontSize: '12px' }}>
                        {alert.message}
                      </p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: '11px' }}>
                        {new Date(alert.timestamp).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                );
              })}

              {filteredAlerts.length === 0 && (
                <div className="py-16 text-center">
                  <BellRing size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400" style={{ fontSize: '14px' }}>Không có cảnh báo nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Alert Detail Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {selectedAlert ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>Chi tiết cảnh báo</h3>
                  <button onClick={() => setSelectedAlert(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <X size={16} />
                  </button>
                </div>

                {/* Severity Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${SEVERITY_CONFIG[selectedAlert.severity].bg} ${SEVERITY_CONFIG[selectedAlert.severity].text}`}>
                  {SEVERITY_CONFIG[selectedAlert.severity].icon}
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>
                    {SEVERITY_CONFIG[selectedAlert.severity].label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400" style={{ fontSize: '11px' }}>Vị trí</p>
                    <p className="text-gray-800" style={{ fontSize: '13px', fontWeight: 500 }}>
                      {selectedAlert.zoneName} → {selectedAlert.pondName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400" style={{ fontSize: '11px' }}>Cảm biến</p>
                    <p className="text-gray-800" style={{ fontSize: '13px', fontWeight: 500 }}>
                      {selectedAlert.sensorType}
                    </p>
                  </div>
                  {selectedAlert.value > 0 && (
                    <div>
                      <p className="text-gray-400" style={{ fontSize: '11px' }}>Giá trị đo được</p>
                      <p className="text-gray-800" style={{ fontSize: '20px', fontWeight: 700 }}>
                        {selectedAlert.value}
                        <span className="text-gray-400 ml-1" style={{ fontSize: '13px' }}>
                          {selectedAlert.unit}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400" style={{ fontSize: '11px' }}>Mô tả</p>
                    <p className="text-gray-700" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                      {selectedAlert.message}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400" style={{ fontSize: '11px' }}>Thời gian</p>
                    <p className="text-gray-800" style={{ fontSize: '13px' }}>
                      {new Date(selectedAlert.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {!selectedAlert.isResolved && (
                  <div className="mt-5 space-y-2">
                    <button
                      onClick={() => markAsResolved(selectedAlert.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <CheckCircle2 size={16} />
                      Đánh dấu đã xử lý
                    </button>
                    <button className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                      style={{ fontSize: '13px' }}>
                      Đến trang điều khiển
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <BellRing size={32} className="text-gray-200 mb-3" />
                <p className="text-gray-400" style={{ fontSize: '13px' }}>
                  Chọn một cảnh báo để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ThresholdForm />
      )}
    </div>
  );
};
