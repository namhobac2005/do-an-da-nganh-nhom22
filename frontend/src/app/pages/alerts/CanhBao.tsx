/**
 * CanhBao.tsx
 * Module Cảnh Báo & Ngưỡng Thiết Lập (cho tất cả user)
 * - Tab 1: Thiết lập ngưỡng (Threshold)
 * - Tab 2: Nhật ký cảnh báo (Alert Logs)
 *
 * Fully connected to the backend API. No mock data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Settings,
  Bell,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Settings2,
  AlertCircle,
} from 'lucide-react';
import * as alertService from '../../services/alertService';
import * as zoneService from '../../services/zoneService';
import type { Threshold, AlertLog, Metric, TargetType } from '../../services/alertService';
import type { Zone } from '../../types/user.types';

// ===== CONSTANTS =====

const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: 'pH',          label: 'pH',                  unit: '' },
  { value: 'temperature', label: 'Nhiệt độ',            unit: '°C' },
  { value: 'DO',          label: 'Ô xy hoà tan (DO)',   unit: 'mg/L' },
];

const STATUS_MAP = {
  unread:   { label: 'Chưa xử lý', bg: 'bg-red-100',     text: 'text-red-700' },
  resolved: { label: 'Đã xử lý',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

// ===== TAB 1: THRESHOLD SETTINGS =====

interface ThresholdFormValues {
  target_type: TargetType;
  target_id:   string;
  metric:      Metric;
  min_value:   string;
  max_value:   string;
}

const ThresholdTab: React.FC<{ zones: Zone[] }> = ({ zones }) => {
  const [thresholds,   setThresholds]   = useState<Threshold[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchThresholds = useCallback(async () => {
    setIsLoading(true);
    try { setThresholds(await alertService.getThresholds()); }
    catch { toast.error('Không thể tải ngưỡng cảnh báo.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const { register, handleSubmit, watch, formState: { errors }, reset } =
    useForm<ThresholdFormValues>({
      defaultValues: { target_type: 'zone', target_id: '', metric: 'pH', min_value: '', max_value: '' },
    });

  const targetType = watch('target_type');
  const minVal     = watch('min_value');
  const maxVal     = watch('max_value');
  const minMaxErr  = minVal && maxVal && Number(minVal) >= Number(maxVal);

  const onSubmit = async (vals: ThresholdFormValues) => {
    if (minMaxErr) return;
    setIsSubmitting(true);
    try {
      const saved = await alertService.upsertThreshold({
        target_type: vals.target_type,
        target_id:   vals.target_id,
        metric:      vals.metric,
        min_value:   Number(vals.min_value),
        max_value:   Number(vals.max_value),
      });
      setThresholds((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        return idx >= 0 ? prev.map((t) => t.id === saved.id ? saved : t) : [saved, ...prev];
      });
      reset();
      toast.success('Đã lưu ngưỡng cảnh báo.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa ngưỡng này?')) return;
    try {
      await alertService.deleteThreshold(id);
      setThresholds((prev) => prev.filter((t) => t.id !== id));
      toast.success('Đã xóa ngưỡng.');
    } catch (err: any) { toast.error(err.message); }
  };

  const inputCls = (hasErr?: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
      hasErr ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
             : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'
    }`;

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-gray-800 text-sm font-semibold flex items-center gap-2 mb-5">
          <Plus size={15} className="text-emerald-600" />
          Thêm / cập nhật ngưỡng cảnh báo
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Áp dụng cho</label>
            <select {...register('target_type')} className={inputCls()}>
              <option value="zone">Vùng ao cụ thể</option>
              <option value="farming_type">Loại nuôi</option>
            </select>
          </div>

          {/* Target id */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {targetType === 'zone' ? 'Chọn vùng ao' : 'Nhập loại nuôi'}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            {targetType === 'zone' ? (
              <select
                {...register('target_id', { required: 'Vui lòng chọn vùng ao.' })}
                className={inputCls(!!errors.target_id)}
              >
                <option value="">— Chọn vùng ao —</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            ) : (
              <input
                {...register('target_id', { required: 'Vui lòng nhập loại nuôi.' })}
                placeholder="VD: Tôm thẻ chân trắng"
                className={inputCls(!!errors.target_id)}
              />
            )}
            {errors.target_id && <p className="text-red-500 text-xs mt-1">{errors.target_id.message}</p>}
          </div>

          {/* Metric */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Chỉ số <span className="text-red-500">*</span></label>
            <select {...register('metric')} className={inputCls()}>
              {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ngưỡng dưới <span className="text-red-500">*</span></label>
              <input
                type="number" step="any"
                {...register('min_value', { required: 'Bắt buộc.' })}
                placeholder="0"
                className={inputCls(!!errors.min_value || !!minMaxErr)}
              />
              {errors.min_value && <p className="text-red-500 text-xs mt-1">{errors.min_value.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ngưỡng trên <span className="text-red-500">*</span></label>
              <input
                type="number" step="any"
                {...register('max_value', { required: 'Bắt buộc.' })}
                placeholder="14"
                className={inputCls(!!errors.max_value || !!minMaxErr)}
              />
              {errors.max_value && <p className="text-red-500 text-xs mt-1">{errors.max_value.message}</p>}
            </div>
          </div>

          {/* Validation error */}
          {minMaxErr && (
            <div className="sm:col-span-2">
              <p className="text-red-500 text-xs font-semibold">⚠ Ngưỡng dưới không được lớn hơn hoặc bằng ngưỡng trên.</p>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !!minMaxErr}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Lưu ngưỡng
            </button>
          </div>
        </form>
      </div>

      {/* Active thresholds list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-gray-800 text-sm font-semibold">Ngưỡng đang áp dụng</h2>
          <button onClick={fetchThresholds} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {['Đối tượng', 'Loại', 'Chỉ số', 'Ngưỡng dưới', 'Ngưỡng trên', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : thresholds.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Chưa có ngưỡng nào được thiết lập.</td></tr>
              ) : (
                thresholds.map((t) => {
                  const metric = METRICS.find((m) => m.value === t.metric);
                  const zoneName = t.target_type === 'zone'
                    ? zones.find((z) => z.id === t.target_id)?.name ?? t.target_id.slice(0, 8)
                    : t.target_id;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{zoneName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.target_type === 'zone' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.target_type === 'zone' ? 'Vùng ao' : 'Loại nuôi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{metric?.label ?? t.metric}</td>
                      <td className="px-4 py-3 text-sm text-blue-700 font-semibold">{t.min_value} {metric?.unit}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">{t.max_value} {metric?.unit}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ===== TAB 2: ALERT LOGS =====

const AlertLogsTab: React.FC<{ zones: Zone[] }> = ({ zones }) => {
  const [logs,      setLogs]      = useState<AlertLog[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const LIMIT = 20;

  const fetchLogs = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const result = await alertService.getAlertLogs({ page: p, limit: LIMIT });
      setLogs(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch { toast.error('Không thể tải nhật ký cảnh báo.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handleResolve = async (id: string) => {
    try {
      const updated = await alertService.resolveAlert(id);
      setLogs((prev) => prev.map((l) => l.id === updated.id ? updated : l));
      toast.success('Đã đánh dấu xử lý.');
    } catch (err: any) { toast.error(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-gray-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={15} className="text-red-500" />
          Nhật ký cảnh báo · {total} bản ghi
        </h2>
        <button onClick={() => fetchLogs(page)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              {['Thời gian', 'Vùng ao', 'Chỉ số', 'Giá trị', 'Lý do', 'Trạng thái', 'Thao tác'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400 text-sm">Chưa có cảnh báo nào</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const st       = STATUS_MAP[log.status];
                const metric   = METRICS.find((m) => m.value === log.metric);
                const zoneName = zones.find((z) => z.id === log.zone_id)?.name ?? log.zone_id?.slice(0, 8) ?? '—';
                const dt       = new Date(log.created_at);
                return (
                  <tr key={log.id} className={`hover:bg-gray-50/60 transition-colors ${log.status === 'unread' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p className="font-medium text-gray-700">{dt.toLocaleDateString('vi-VN')}</p>
                      <p>{dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{zoneName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{metric?.label ?? log.metric}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600">{log.recorded_value} {metric?.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate" title={log.reason}>{log.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'unread' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'unread' && (
                        <button
                          onClick={() => handleResolve(log.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 size={12} />
                          Đã xử lý
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
          <p className="text-xs text-gray-400">Trang {page} / {totalPages}</p>
          <div className="flex gap-1.5">
            <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== MAIN COMPONENT =====

type Tab = 'threshold' | 'log';

export const CanhBao: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [zones,     setZones]     = useState<Zone[]>([]);
  const [unread,    setUnread]    = useState(0);

  useEffect(() => {
    zoneService.getZones().then(setZones).catch(() => null);
    alertService.getUnreadCount().then(setUnread).catch(() => null);
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'log',       label: 'Nhật ký cảnh báo',  icon: <AlertCircle size={15} /> },
    { key: 'threshold', label: 'Thiết lập ngưỡng',  icon: <Settings2  size={15} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-red-500" />
            Cảnh báo & Ngưỡng
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Quản lý ngưỡng cảnh báo và nhật ký sự kiện
          </p>
        </div>
        {unread > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
            <ShieldAlert size={15} className="text-red-500" />
            <span className="text-red-700 text-sm font-semibold">{unread} cảnh báo chưa xử lý</span>
          </div>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Chưa xử lý', value: unread, color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle size={20} /> },
          { label: 'Vùng ao', value: zones.length, color: 'text-teal-700', bg: 'bg-teal-50', icon: <BellRing size={20} /> },
          { label: 'Thiết lập', value: '—', color: 'text-amber-700', bg: 'bg-amber-50', icon: <Settings size={20} /> },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <p className={`${s.color} text-xl font-bold leading-tight`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'log' && unread > 0 && (
              <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'threshold' ? <ThresholdTab zones={zones} /> : <AlertLogsTab zones={zones} />}
    </div>
  );
};
