/**
 * DeviceTable.tsx
 * Grid of device cards for displaying IoT devices
 */

import {
  Pencil,
  Trash2,
  Droplets,
  Wind,
  Lightbulb,
  RotateCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import type { Device } from "../../services/deviceService";

const DEVICE_TYPE_CONFIG = {
  pump: {
    label: "Máy Bơm",
    icon: Droplets,
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  fan: {
    label: "Quạt Sục Khí",
    icon: Wind,
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  light: {
    label: "Đèn LED",
    icon: Lightbulb,
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  servo: {
    label: "Van/Servo",
    icon: RotateCw,
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
};

const MODE_CONFIG = {
  auto: { label: "Tự động", bg: "bg-emerald-100", text: "text-emerald-700" },
  manual: { label: "Thủ công", bg: "bg-blue-100", text: "text-blue-700" },
};

const STATUS_CONFIG = {
  ON: {
    label: "Bật",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  OFF: {
    label: "Tắt",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onRetry: () => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
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
            <div className="h-20 bg-gradient-to-r from-blue-100 to-cyan-100" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
        <AlertCircle size={32} className="text-red-400 mb-3" />
        <p className="text-gray-600 text-sm font-medium mb-1">
          Không thể tải danh sách thiết bị
        </p>
        <p className="text-gray-400 text-xs mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <RotateCw size={13} />
          Thử lại
        </button>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
        <Zap size={36} className="text-gray-200 mb-3" />
        <p className="text-gray-500 text-sm font-medium">
          Chưa có thiết bị nào
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Nhấn "Thêm Thiết Bị" để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {devices.map((device) => {
        const typeCfg =
          DEVICE_TYPE_CONFIG[device.type as keyof typeof DEVICE_TYPE_CONFIG];
        const modeCfg = MODE_CONFIG[device.mode as keyof typeof MODE_CONFIG];
        const statusCfg =
          STATUS_CONFIG[device.status as keyof typeof STATUS_CONFIG] ||
          STATUS_CONFIG.OFF;
        const TypeIcon = typeCfg?.icon || Zap;

        return (
          <div
            key={device.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            {/* Card header */}
            <div className={`${typeCfg?.bg || "bg-gray-100"} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 ${typeCfg?.bg} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <TypeIcon
                      size={20}
                      className={typeCfg?.text || "text-gray-700"}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-bold truncate">
                      {device.name}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${typeCfg?.text || "text-gray-600"}`}
                    >
                      {typeCfg?.label || "Thiết bị"}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {statusCfg.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Feed Key */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Feed:</span>
                <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono truncate">
                  {device.feed_key}
                </code>
              </div>

              {/* Mode badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${modeCfg.bg} ${modeCfg.text}`}
                >
                  {modeCfg.label}
                </span>
              </div>

              {/* Description */}
              {device.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {device.description}
                </p>
              )}

              {/* Created at */}
              <p className="text-xs text-gray-400">
                Tạo{" "}
                {device.created_at
                  ? new Date(device.created_at).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => onEdit(device)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil size={12} />
                  Chỉnh sửa
                </button>

                <button
                  onClick={() => onDelete(device)}
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
