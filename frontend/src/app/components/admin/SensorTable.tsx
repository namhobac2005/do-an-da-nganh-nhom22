/**
 * SensorTable.tsx
 * Grid of sensors for displaying latest sensor metadata + values
 */

import {
  Pencil,
  Trash2,
  Thermometer,
  Waves,
  Droplets,
  Zap,
} from "lucide-react";
import type { SensorData } from "../../services/sensorService";

const TYPE_ICON: Record<string, React.ComponentType<any>> = {
  temperature: Thermometer,
  "water-level": Waves,
  water_level: Waves,
  brightness: Zap,
  light: Droplets,
};

const STATUS_CONFIG: Record<
  SensorData["status"],
  { label: string; bg: string; text: string; dot: string }
> = {
  normal: {
    label: "Bình thường",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Cảnh báo",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Nguy hiểm",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

const fallbackType = "temperature";

interface SensorTableProps {
  sensors: SensorData[];
  isLoading: boolean;
  error: string | null;
  onEdit: (sensor: SensorData & { pond_id?: string }) => void;
  onDelete: (sensor: SensorData) => void;
  onRetry: () => void;
}

export const SensorTable: React.FC<SensorTableProps> = ({
  sensors,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
          >
            <div className="h-28 bg-gradient-to-r from-teal-100 to-emerald-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
        <Zap size={32} className="text-red-400 mb-3" />
        <p className="text-gray-600 text-sm font-medium mb-1">
          Không thể tải sensor
        </p>
        <p className="text-gray-400 text-xs mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!sensors || sensors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
        <Waves size={36} className="text-gray-200 mb-3" />
        <p className="text-gray-500 text-sm font-medium">Chưa có sensor</p>
        <p className="text-gray-400 text-xs mt-1">
          Chọn ao khác hoặc nhấn "Thêm Sensor".
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sensors.map((s) => {
        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.normal;
        const typeKey = (s.type || fallbackType).toLowerCase();
        const Icon = TYPE_ICON[typeKey] || Thermometer;

        return (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className={`${cfg.bg} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className={cfg.text} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-bold truncate">
                      {s.name}
                    </p>
                    {/* Location - vùng nuôi */}
                    {s.zone_name && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.zone_name}
                      </p>
                    )}
                    {/* Location - ao số */}
                    {s.pond_name && (
                      <p className="text-xs text-gray-500">{s.pond_name}</p>
                    )}
                    <p className={`text-xs mt-0.5 ${cfg.text}`}>
                      {s.type} • {s.unit}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-gray-500 text-xs">Giá trị</p>
                  <p className="text-2xl font-bold text-emerald-700 leading-tight">
                    {Number.isFinite(s.value) ? s.value : 0}
                    <span className="text-base font-semibold text-gray-600 ml-1">
                      {s.unit}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Cập nhật</p>
                  <p className="text-xs text-gray-700">
                    {s.updated_at
                      ? new Date(s.updated_at).toLocaleString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => onEdit(s as any)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil size={12} />
                  Chỉnh sửa
                </button>

                <button
                  onClick={() => onDelete(s)}
                  className="p-2 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
