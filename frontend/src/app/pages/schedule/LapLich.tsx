/**
 * LapLich.tsx
 * Trang Lập Lịch - Tạo lịch trình tự động cho thiết bị
 * Quy trình: Chọn Vùng → Thiết Bị → Thời Gian
 */

import { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  PlayCircle,
  PauseCircle,
  Zap,
  Wind,
  Droplets,
  Lightbulb,
  Save,
  X,
  Eye,
  EyeOff,
  Power,
} from "lucide-react";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  Schedule,
} from "../../services/scheduleService";
import { getAllDevices } from "../../services/deviceService";
import { MOCK_ZONES } from "../../data/mockData";

interface Device {
  id: string;
  name: string;
  type: string;
  isOnline: boolean;
  zoneId?: string;
}

interface Zone {
  id: string;
  name: string;
  location: string;
}

interface ScheduleWithDevice extends Schedule {
  device_name?: string;
  device_type?: string;
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  pump: <Droplets size={18} />,
  fan: <Wind size={18} />,
  light: <Lightbulb size={18} />,
  servo: <Zap size={18} />,
};

const DEVICE_COLORS: Record<
  string,
  { bg: string; icon: string; text: string }
> = {
  light: {
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    text: "text-yellow-700",
  },
  pump: { bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-700" },
  fan: { bg: "bg-teal-50", icon: "text-teal-600", text: "text-teal-700" },
  servo: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    text: "text-purple-700",
  },
};

const TIME_PRESETS = [
  { time: "06:00", label: "6:00 sáng", cron: "0 6 * * *" },
  { time: "09:00", label: "9:00 sáng", cron: "0 9 * * *" },
  { time: "12:00", label: "12:00 trưa", cron: "0 12 * * *" },
  { time: "15:00", label: "3:00 chiều", cron: "0 15 * * *" },
  { time: "18:00", label: "6:00 tối", cron: "0 18 * * *" },
  { time: "21:00", label: "9:00 tối", cron: "0 21 * * *" },
];

const buildCronFromTime = (hour: string, minute: string) => {
  return `${minute} ${hour} * * *`;
};

export const LapLich: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleWithDevice[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones] = useState<Zone[]>(MOCK_ZONES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    zone_id: "",
    device_id: "",
    level: 1,
    cron_expr: "0 6 * * *",
    action: "Bật thiết bị",
  });

  const [cronBuilder, setCronBuilder] = useState({
    hour: "6",
    minute: "0",
  });

  const selectedZone = zones.find((z) => z.id === formData.zone_id);
  const zoneDevices = selectedZone
    ? devices.filter((d) => d.zoneId === formData.zone_id)
    : [];
  const selectedDevice = devices.find((d) => d.id === formData.device_id);
  const isLight = selectedDevice?.type === "light";

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [schedulesData, devicesData] = await Promise.all([
          getSchedules(),
          getAllDevices(),
        ]);

        const enrichedSchedules = schedulesData.map(
          (sch: ScheduleWithDevice) => {
            const device = devicesData.find(
              (d: Device) => d.id === sch.device_id,
            );
            return {
              ...sch,
              device_name: device?.name || "Thiết bị không tên",
              device_type: device?.type || "unknown",
            };
          },
        );

        setSchedules(enrichedSchedules);
        setDevices(devicesData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      zone_id: "",
      device_id: "",
      level: 1,
      cron_expr: "0 6 * * *",
      action: "Bật thiết bị",
    });
    setCronBuilder({ hour: "6", minute: "0" });
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: ScheduleWithDevice) => {
    setEditingId(schedule.id || null);
    const device = devices.find((d) => d.id === schedule.device_id);

    setFormData({
      zone_id: device?.zoneId || "",
      device_id: schedule.device_id,
      level: schedule.level,
      cron_expr: schedule.cron_expr,
      action: schedule.action,
    });

    const parts = schedule.cron_expr.split(" ");
    setCronBuilder({ minute: parts[0], hour: parts[1] });
    setIsModalOpen(true);
  };

  const handleZoneChange = (zoneId: string) => {
    setFormData({
      ...formData,
      zone_id: zoneId,
      device_id: "",
      level: 1,
    });
  };

  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    const defaultLevel = device?.type === "light" ? 1 : 1;
    const defaultAction =
      device?.type === "light"
        ? "Bật đèn mức 1"
        : `Bật ${device?.name || "thiết bị"}`;

    setFormData({
      ...formData,
      device_id: deviceId,
      level: defaultLevel,
      action: defaultAction,
    });
  };

  const handleLevelChange = (level: number) => {
    const levelText = isLight ? `mức ${level}` : level === 0 ? "tắt" : "bật";
    const action = isLight
      ? `Bật đèn ${levelText}`
      : `${level === 0 ? "Tắt" : "Bật"} ${selectedDevice?.name || "thiết bị"}`;

    setFormData({
      ...formData,
      level,
      action,
    });
  };

  const handleUpdateCron = (updates: Partial<typeof cronBuilder>) => {
    const newCronBuilder = { ...cronBuilder, ...updates };
    setCronBuilder(newCronBuilder);

    const cronExpr = buildCronFromTime(
      newCronBuilder.hour,
      newCronBuilder.minute,
    );
    setFormData((prev) => ({ ...prev, cron_expr: cronExpr }));
  };

  const handleSave = async () => {
    if (!formData.zone_id || !formData.device_id) {
      alert("Vui lòng chọn vùng và thiết bị");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateSchedule(editingId, {
          device_id: formData.device_id,
          level: formData.level,
          cron_expr: formData.cron_expr,
          action: formData.action,
          active: true,
        });
        if (updated) {
          setSchedules((prev) =>
            prev.map((s) =>
              s.id === editingId
                ? {
                    ...updated,
                    device_name: selectedDevice?.name,
                    device_type: selectedDevice?.type,
                  }
                : s,
            ),
          );
        }
      } else {
        const newSchedule = await createSchedule({
          device_id: formData.device_id,
          level: formData.level,
          cron_expr: formData.cron_expr,
          action: formData.action,
          active: true,
        });
        if (newSchedule) {
          setSchedules((prev) => [
            {
              ...newSchedule,
              device_name: selectedDevice?.name || "Thiết bị không tên",
              device_type: selectedDevice?.type || "unknown",
            },
            ...prev,
          ]);
        }
      }
      setIsModalOpen(false);
      alert("✅ Thành công!");
    } catch (error: any) {
      console.error(error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm("Bạn có chắc muốn xóa lịch trình này?")) return;

    try {
      await deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      alert("✅ Đã xóa lịch trình");
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.message}`);
    }
  };

  const handleToggleActive = async (
    id: string | undefined,
    current: boolean,
  ) => {
    if (!id) return;
    try {
      const updated = await updateSchedule(id, { active: !current });
      if (updated) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: !current } : s)),
        );
      }
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.message}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold" style={{ fontSize: "18px" }}>
            🕐 Lập Lịch Tự Động
          </h2>
          <p className="text-gray-500 mt-1" style={{ fontSize: "13px" }}>
            Chọn vùng ao → thiết bị → thời gian và mức độ
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm lịch
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3
                className="text-gray-900 font-bold"
                style={{ fontSize: "16px" }}
              >
                {editingId ? "✏️ Sửa Lịch" : "➕ Lịch Mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  Vùng Ao <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-400"
                  style={{ fontSize: "13px" }}
                >
                  <option value="">-- Chọn vùng ao --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.zone_id && (
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    Thiết Bị <span className="text-red-500">*</span>
                  </label>
                  {zoneDevices.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-700 text-sm">
                        Vùng này không có thiết bị
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.device_id}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-400"
                      style={{ fontSize: "13px" }}
                    >
                      <option value="">-- Chọn thiết bị --</option>
                      {zoneDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedDevice && (
                <>
                  <div
                    className={`p-3 rounded-lg ${DEVICE_COLORS[selectedDevice.type].bg}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={DEVICE_COLORS[selectedDevice.type].icon}>
                        {DEVICE_ICONS[selectedDevice.type]}
                      </div>
                      <p
                        className={`${DEVICE_COLORS[selectedDevice.type].text} font-semibold`}
                        style={{ fontSize: "12px" }}
                      >
                        {selectedDevice.type === "light"
                          ? "Đèn - 4 bậc sáng"
                          : `${selectedDevice.type === "pump" ? "Máy bơm" : selectedDevice.type === "fan" ? "Quạt" : "Servo"} - ON/OFF`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 mb-3"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      {isLight ? "Mức Sáng" : "Trạng Thái"}
                    </label>
                    {isLight ? (
                      <div className="grid grid-cols-5 gap-2">
                        {[0, 1, 2, 3, 4].map((level) => (
                          <button
                            key={level}
                            onClick={() => handleLevelChange(level)}
                            className={`py-2 rounded-lg font-bold text-sm border-2 ${
                              formData.level === level
                                ? level === 0
                                  ? "bg-gray-700 text-white border-gray-800"
                                  : "bg-yellow-500 text-white border-yellow-600"
                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {level === 0 ? "Tắt" : level}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleLevelChange(0)}
                          className={`py-3 rounded-lg font-bold border-2 flex items-center justify-center gap-2 ${
                            formData.level === 0
                              ? "bg-gray-700 text-white border-gray-800"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          <Power size={16} /> TẮT
                        </button>
                        <button
                          onClick={() => handleLevelChange(1)}
                          className={`py-3 rounded-lg font-bold border-2 flex items-center justify-center gap-2 ${
                            formData.level === 1
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}
                        >
                          <Zap size={16} /> BẬT
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      Nhanh ⚡
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_PRESETS.map((preset) => (
                        <button
                          key={preset.cron}
                          onClick={() => {
                            const parts = preset.cron.split(" ");
                            handleUpdateCron({
                              hour: parts[1],
                              minute: parts[0],
                            });
                          }}
                          className={`px-2 py-2 rounded-lg border-2 text-center ${
                            formData.cron_expr === preset.cron
                              ? "bg-blue-100 border-blue-400 text-blue-700 font-semibold"
                              : "bg-white border-gray-200 text-gray-600"
                          }`}
                          style={{ fontSize: "11px" }}
                        >
                          <div className="font-bold">{preset.time}</div>
                          <div style={{ fontSize: "9px" }}>{preset.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 bg-blue-50">
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      ⏰ Tuỳ Chỉnh Giờ
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="text-gray-600 text-xs mb-1 block"
                          style={{ fontWeight: 500 }}
                        >
                          Giờ
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleUpdateCron({
                                hour: Math.max(
                                  0,
                                  parseInt(cronBuilder.hour) - 1,
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="p-1 hover:bg-white rounded text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={cronBuilder.hour}
                            onChange={(e) =>
                              handleUpdateCron({
                                hour: Math.min(
                                  23,
                                  Math.max(0, parseInt(e.target.value) || 0),
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-center text-sm font-mono outline-none focus:border-blue-400"
                          />
                          <button
                            onClick={() =>
                              handleUpdateCron({
                                hour: Math.min(
                                  23,
                                  parseInt(cronBuilder.hour) + 1,
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="p-1 hover:bg-white rounded text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <label
                          className="text-gray-600 text-xs mb-1 block"
                          style={{ fontWeight: 500 }}
                        >
                          Phút
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleUpdateCron({
                                minute: Math.max(
                                  0,
                                  parseInt(cronBuilder.minute) - 5,
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="p-1 hover:bg-white rounded text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={cronBuilder.minute}
                            onChange={(e) =>
                              handleUpdateCron({
                                minute: Math.min(
                                  59,
                                  Math.max(0, parseInt(e.target.value) || 0),
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-center text-sm font-mono outline-none focus:border-blue-400"
                          />
                          <button
                            onClick={() =>
                              handleUpdateCron({
                                minute: Math.min(
                                  59,
                                  parseInt(cronBuilder.minute) + 5,
                                )
                                  .toString()
                                  .padStart(2, "0"),
                              })
                            }
                            className="p-1 hover:bg-white rounded text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-600">Cron:</p>
                      <code className="text-xs font-mono text-blue-700 block mt-1">
                        {formData.cron_expr} ({cronBuilder.hour}:
                        {cronBuilder.minute.padStart(2, "0")} hàng ngày)
                      </code>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-700 text-sm font-semibold">
                      ✅ Sẽ thực hiện:{" "}
                      <span className="font-bold">{formData.action}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-100 flex gap-3 bg-white">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.zone_id || !formData.device_id}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lưu...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Chưa có lịch trình nào</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-emerald-600 hover:underline text-sm font-medium"
            >
              Thêm lịch trình ngay →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  schedule.active
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="shrink-0">
                  {schedule.active ? (
                    <PlayCircle size={24} className="text-emerald-600" />
                  ) : (
                    <PauseCircle size={24} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className="text-gray-900 font-bold"
                      style={{ fontSize: "14px" }}
                    >
                      {schedule.device_name}
                    </p>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {schedule.device_type === "light" && schedule.level === 0
                        ? "Tắt"
                        : schedule.level}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm font-mono">
                    {schedule.cron_expr}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {schedule.action}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleToggleActive(schedule.id, schedule.active)
                    }
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title={schedule.active ? "Tạm dừng" : "Tiếp tục"}
                  >
                    {schedule.active ? (
                      <Eye size={16} className="text-emerald-600" />
                    ) : (
                      <EyeOff size={16} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
