/**
 * DieuKhien.tsx
 * UC13: Màn hình Điều Khiển Thiết Bị Thực Tế (Adafruit IO)
 * (Quạt/Bơm/Servo: ON/OFF | Đèn: 4 Mức)
 */

import { useState, useCallback, useEffect } from "react";
import {
  Droplets,
  Wind,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  ZapOff,
  Filter,
  RotateCcw,
  Play,
  Square,
  RotateCw, // Icon cho Servo
} from "lucide-react";
import { Switch } from "../../components/ui/switch";
import {
  sendDeviceCommand,
  getAllDevices,
  type SendCommandResult,
} from "../../services/deviceService";

// ===== CONSTANTS & CONFIG =====

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  pump: <Droplets />,
  fan: <Wind size={22} />,
  light: <Lightbulb size={22} />,
  servo: <RotateCw size={22} />,
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  pump: "Máy Bơm",
  fan: "Quạt Thông Gió",
  light: "Đèn Chiếu Sáng",
  servo: "Động Cơ Servo",
};

const DEVICE_TYPE_COLORS: Record<
  string,
  { bg: string; text: string; iconBg: string }
> = {
  pump: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100" },
  fan: { bg: "bg-teal-50", text: "text-teal-700", iconBg: "bg-teal-100" },
  light: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    iconBg: "bg-yellow-100",
  },
  servo: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    iconBg: "bg-purple-100",
  },
};

const LIGHT_LEVELS = [0, 1, 2, 3, 4];

// ===== TYPES =====

export type DeviceMode = "auto" | "manual";

export interface Device {
  id: string;
  name: string;
  type: "pump" | "fan" | "light" | "servo";
  feedKey: string;
  isActive: boolean;
  level: number;
  isOnline: boolean;
  mode: DeviceMode;
  lastUpdated: string;
}

interface CommandLog {
  deviceId: string;
  deviceName: string;
  level: number;
  timestamp: string;
  success: boolean;
}

// ===== CONFIRM DIALOG COMPONENT =====

interface ConfirmDialogProps {
  isOpen: boolean;
  device: Device | null;
  newLevel: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  device,
  newLevel,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !device) return null;

  const isLight = device.type === "light";
  const isTurningOff = newLevel === 0;
  const colors =
    DEVICE_TYPE_COLORS[device.type as string] || DEVICE_TYPE_COLORS.pump;

  const getActionText = () => {
    if (isTurningOff) return "TẮT thiết bị";
    if (isLight) return `chuyển sang MỨC ${newLevel}`;
    return "BẬT thiết bị";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`p-5 rounded-t-2xl ${!isTurningOff ? "bg-emerald-50 border-b border-emerald-100" : "bg-red-50 border-b border-red-100"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${!isTurningOff ? "bg-emerald-100" : "bg-red-100"}`}
            >
              {!isTurningOff ? (
                <Zap size={20} className="text-emerald-600" />
              ) : (
                <ZapOff size={20} className="text-red-600" />
              )}
            </div>
            <div>
              <p
                className={`${!isTurningOff ? "text-emerald-800" : "text-red-800"}`}
                style={{ fontSize: "16px", fontWeight: 600 }}
              >
                Xác nhận {getActionText()}
              </p>
              <p
                className={`${!isTurningOff ? "text-emerald-600" : "text-red-600"}`}
                style={{ fontSize: "13px" }}
              >
                Lệnh ({newLevel}) sẽ được gửi lên Adafruit IO ngay lập tức
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border ${colors.bg}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.text}`}
            >
              {DEVICE_ICONS[device.type as string]}
            </div>
            <div>
              <p
                className="text-gray-900"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {device.name}
              </p>
              <p className="text-gray-500" style={{ fontSize: "12px" }}>
                {DEVICE_TYPE_LABELS[device.type as string]}
              </p>
              <p className="text-gray-400" style={{ fontSize: "11px" }}>
                Feed:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {device.feedKey}
                </code>
              </p>
            </div>
          </div>

          {isTurningOff && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertCircle
                size={15}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <p className="text-amber-700" style={{ fontSize: "12px" }}>
                Tắt thiết bị có thể ảnh hưởng đến môi trường ao nuôi. Hãy đảm
                bảo an toàn.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontWeight: 500 }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              !isTurningOff
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : !isTurningOff ? (
              isLight ? (
                `Áp dụng Mức ${newLevel}`
              ) : (
                "BẬT Thiết Bị"
              )
            ) : (
              "TẮT Thiết Bị"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== DEVICE CARD COMPONENT =====

interface DeviceCardProps {
  device: Device;
  onLevelChangeRequest: (device: Device, level: number) => void;
  onModeChange: (deviceId: string, newMode: DeviceMode) => void;
  isUpdating: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onLevelChangeRequest,
  onModeChange,
  isUpdating,
}) => {
  const isLight = device.type === "light";
  const colors =
    DEVICE_TYPE_COLORS[device.type as string] || DEVICE_TYPE_COLORS.pump;

  return (
    <div
      className={`
      bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
      ${device.isActive && device.isOnline ? "border-emerald-200" : device.isOnline ? "border-gray-200" : "border-red-100"}
    `}
    >
      <div className={`px-5 py-4 ${colors.bg} border-b border-black/5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.text}`}
            >
              {DEVICE_ICONS[device.type as string]}
            </div>
            <div>
              <p
                className="text-gray-900"
                style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.3 }}
              >
                {device.name}
              </p>
              <p
                className={`${colors.text}`}
                style={{ fontSize: "11px", fontWeight: 500 }}
              >
                {DEVICE_TYPE_LABELS[device.type as string]}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              device.isOnline
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${device.isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            <span style={{ fontSize: "11px", fontWeight: 600 }}>
              {device.isOnline ? "Online" : "Mất kết nối"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <span className="text-gray-600" style={{ fontSize: "13px" }}>
            Chế độ
          </span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => onModeChange(device.id, "manual")}
              disabled={!device.isOnline}
              className={`px-3 py-1.5 transition-colors ${
                device.mode === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              Thủ công
            </button>
            <button
              onClick={() => onModeChange(device.id, "auto")}
              disabled={!device.isOnline}
              className={`px-3 py-1.5 transition-colors ${
                device.mode === "auto"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              Tự động
            </button>
          </div>
        </div>

        {/* Control Area */}
        {isLight ? (
          // === UI ĐÈN (4 MỨC) ===
          <div
            className={`p-4 rounded-xl border-2 ${
              device.isActive && device.isOnline
                ? "bg-emerald-50 border-emerald-200"
                : !device.isOnline
                  ? "bg-gray-50 border-gray-100"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {device.isActive && device.isOnline ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : !device.isOnline ? (
                  <XCircle size={16} className="text-red-500" />
                ) : (
                  <ZapOff size={16} className="text-gray-400" />
                )}
                <span
                  className={`${device.isActive && device.isOnline ? "text-emerald-700" : !device.isOnline ? "text-red-600" : "text-gray-500"}`}
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  {device.isOnline
                    ? device.isActive
                      ? `ĐANG CHẠY MỨC ${device.level}`
                      : "ĐANG TẮT"
                    : "OFFLINE"}
                </span>
              </div>
              {isUpdating && (
                <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
              )}
            </div>

            <div className="flex justify-between gap-1 relative">
              {device.mode === "auto" && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                  <span className="text-gray-600 font-medium text-xs bg-white px-2 py-1 rounded shadow-sm">
                    Vô hiệu ở Tự động
                  </span>
                </div>
              )}
              {LIGHT_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onLevelChangeRequest(device, lvl)}
                  disabled={
                    device.mode === "auto" || !device.isOnline || isUpdating
                  }
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all border ${
                    device.level === lvl
                      ? lvl === 0
                        ? "bg-gray-600 text-white border-gray-700 shadow-inner"
                        : "bg-emerald-500 text-white border-emerald-600 shadow-inner"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {lvl === 0 ? "Tắt" : lvl}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // === UI BƠM / QUẠT / SERVO (ON/OFF) ===
          <div
            className={`flex items-center justify-between p-4 rounded-xl border-2 ${
              device.isActive && device.isOnline
                ? "bg-emerald-50 border-emerald-200"
                : !device.isOnline
                  ? "bg-gray-50 border-gray-100"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                {device.isActive && device.isOnline ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : !device.isOnline ? (
                  <XCircle size={16} className="text-red-500" />
                ) : (
                  <ZapOff size={16} className="text-gray-400" />
                )}
                <span
                  className={`${device.isActive && device.isOnline ? "text-emerald-700" : !device.isOnline ? "text-red-600" : "text-gray-500"}`}
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  {device.isOnline
                    ? device.isActive
                      ? "ĐANG BẬT"
                      : "ĐANG TẮT"
                    : "OFFLINE"}
                </span>
              </div>
              {device.mode === "auto" && (
                <p
                  className="text-gray-400 mt-0.5"
                  style={{ fontSize: "11px" }}
                >
                  Switch vô hiệu ở Tự động
                </p>
              )}
            </div>

            <div className="relative">
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              )}
              <Switch
                checked={device.isActive}
                disabled={
                  device.mode === "auto" || !device.isOnline || isUpdating
                }
                onCheckedChange={(checked) =>
                  onLevelChangeRequest(device, checked ? 1 : 0)
                }
                className={`${isUpdating ? "opacity-0" : ""} data-[state=checked]:bg-emerald-500`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN DIEUKHIEN PAGE =====

export const DieuKhien: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    device: Device | null;
    newLevel: number;
  }>({ isOpen: false, device: null, newLevel: 0 });

  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  // ĐỒNG BỘ TRẠNG THÁI TỪ ADAFRUIT KHI LOAD TRANG
  useEffect(() => {
    const fetchInitialData = async () => {
      // Hàm getAllDevices giờ đã tự động map data chuẩn rồi
      const updatedDevices = await getAllDevices();
      setDevices(updatedDevices);
    };

    fetchInitialData();
    // Vẫn duy trì gọi API mỗi 5s để cập nhật trạng thái mới nhất từ DB
    const interval = setInterval(fetchInitialData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredDevices = devices.filter((device) => {
    if (filterType !== "all" && device.type !== filterType) return false;
    if (searchQuery) {
      return device.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleLevelChangeRequest = useCallback(
    (device: Device, level: number) => {
      if (device.level === level) return;
      setConfirmDialog({ isOpen: true, device, newLevel: level });
    },
    [],
  );

  const handleConfirmLevel = useCallback(async () => {
    const { device, newLevel } = confirmDialog;
    if (!device) return;

    setLoadingDeviceId(device.id);

    try {
      const result: SendCommandResult = await sendDeviceCommand(
        device.id,
        newLevel.toString(),
      );

      if (result.success) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === device.id
              ? {
                  ...d,
                  level: newLevel,
                  isActive: newLevel > 0,
                  lastUpdated: new Date().toISOString(),
                }
              : d,
          ),
        );

        setCommandLogs((prev) => [
          {
            deviceId: device.id,
            deviceName: device.name,
            level: newLevel,
            timestamp: result.timestamp,
            success: true,
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        alert(`Lỗi gửi lệnh lên hệ thống: ${result.error}`);
      }
    } finally {
      setLoadingDeviceId(null);
      setConfirmDialog({ isOpen: false, device: null, newLevel: 0 });
    }
  }, [confirmDialog]);

  const handleModeChange = useCallback(
    (deviceId: string, newMode: DeviceMode) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, mode: newMode } : d)),
      );
    },
    [],
  );

  const handleBulkAction = async (action: "on" | "off") => {
    const manualDevices = filteredDevices.filter(
      (d) => d.mode === "manual" && d.isOnline,
    );
    if (manualDevices.length === 0) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${action === "on" ? "BẬT" : "TẮT"} toàn bộ ${manualDevices.length} thiết bị?`,
    );
    if (!confirmed) return;

    for (const device of manualDevices) {
      const targetLevel =
        action === "off" ? 0 : device.type === "light" ? 4 : 1;
      await sendDeviceCommand(device.feedKey, targetLevel.toString());
    }

    setDevices((prev) =>
      prev.map((d) => {
        const isTarget = manualDevices.some((md) => md.id === d.id);
        if (!isTarget) return d;
        const targetLevel = action === "off" ? 0 : d.type === "light" ? 4 : 1;
        return {
          ...d,
          level: targetLevel,
          isActive: targetLevel > 0,
          lastUpdated: new Date().toISOString(),
        };
      }),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-gray-500" style={{ fontSize: "13px" }}>
          Hệ thống giám sát và điều khiển Adafruit IO - UC13
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleBulkAction("on")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <Play size={14} /> Bật tất cả
          </button>
          <button
            onClick={() => handleBulkAction("off")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <Square size={14} /> Tắt tất cả
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Tìm thiết bị..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400"
          style={{ fontSize: "13px" }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400"
          style={{ fontSize: "13px" }}
        >
          <option value="all">Tất cả loại</option>
          {Object.entries(DEVICE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setFilterType("all");
            setSearchQuery("");
          }}
          className="text-emerald-600 text-sm hover:underline"
        >
          <RotateCcw size={14} className="inline mr-1" /> Đặt lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredDevices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onLevelChangeRequest={handleLevelChangeRequest}
            onModeChange={handleModeChange}
            isUpdating={loadingDeviceId === device.id}
          />
        ))}
      </div>

      {commandLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3
            className="text-gray-900 mb-3"
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            Nhật Ký Gửi Lệnh Adafruit IO
          </h3>
          <div className="space-y-2">
            {commandLogs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${log.success ? "bg-emerald-50" : "bg-red-50"}`}
              >
                {log.success ? (
                  <CheckCircle2 size={15} className="text-emerald-600" />
                ) : (
                  <XCircle size={15} className="text-red-600" />
                )}
                <span
                  className="text-gray-800 flex-1"
                  style={{ fontSize: "13px" }}
                >
                  <strong>{log.deviceName}</strong> →{" "}
                  <span
                    className={
                      log.level > 0 ? "text-emerald-700" : "text-gray-600"
                    }
                  >
                    {log.level === 0
                      ? "TẮT"
                      : `BẬT ${log.level > 1 ? `(Mức ${log.level})` : ""}`}
                  </span>
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        device={confirmDialog.device}
        newLevel={confirmDialog.newLevel}
        isLoading={loadingDeviceId === confirmDialog.device?.id}
        onConfirm={handleConfirmLevel}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, device: null, newLevel: 0 })
        }
      />
    </div>
  );
};
