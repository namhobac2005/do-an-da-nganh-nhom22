import React, { useEffect, useState } from "react";
import { CalendarClock, Trash2 } from "lucide-react";
import type { Device } from "./DieuKhien";
import type { DeviceSchedule } from "../../services/deviceService";

export interface ScheduleTemplate {
  id: string;
  livestockType: string;
  label: string;
  deviceType: Device["type"];
  onTime: string;
  offTime?: string;
  onLevel: number;
  note: string;
}

export interface CustomScheduleActivity {
  id: string;
  deviceId: string;
  targetLevel: number;
  scheduleAt: string;
}

interface LapLichProps {
  livestockTypes: { value: string; label: string }[];
  selectedLivestockType: string;
  onSelectedLivestockTypeChange: (value: string) => void;
  templatesByLivestock: ScheduleTemplate[];
  selectedScheduleDeviceId: string;
  onSelectedScheduleDeviceIdChange: (value: string) => void;
  devices: Device[];
  zones?: { id: string; name: string }[];
  selectedZoneIds?: string[];
  onSelectedZoneIdsChange?: (values: string[]) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  repeatDaily?: boolean;
  onRepeatDailyChange?: (value: boolean) => void;
  scheduleAt: string;
  onScheduleAtChange: (value: string) => void;
  scheduleNote: string;
  onScheduleNoteChange: (value: string) => void;
  isTemplateSubmitting: boolean;
  isScheduleSubmitting: boolean;
  onApplyLivestockTemplates: () => void;
  onSaveCustomAsTemplate: () => void;
  onDeleteCustomTemplate?: (livestockType: string) => void;
  onCreateSchedule: () => void;
  customActivities: CustomScheduleActivity[];
  onCustomActivitiesChange: (activities: CustomScheduleActivity[]) => void;
  schedules: DeviceSchedule[];
  onCancelSchedule: (scheduleId: string) => void;
  deviceTypeLabels: Record<string, string>;
  getActionLabelByType: (
    deviceType: string | undefined,
    level: number,
  ) => string;
  scheduleMode?: "template" | "custom";
  onScheduleModeChange?: (mode: "template" | "custom") => void;
}

const SCHEDULE_STATUS_LABEL: Record<DeviceSchedule["status"], string> = {
  pending: "Đang chờ",
  done: "Đã chạy",
  failed: "Lỗi",
  cancelled: "Đã hủy",
};

export const LapLich: React.FC<LapLichProps> = ({
  livestockTypes,
  selectedLivestockType,
  onSelectedLivestockTypeChange,
  templatesByLivestock,
  selectedScheduleDeviceId,
  onSelectedScheduleDeviceIdChange,
  devices,
  scheduleAt,
  onScheduleAtChange,
  scheduleNote,
  onScheduleNoteChange,
  isTemplateSubmitting,
  isScheduleSubmitting,
  onApplyLivestockTemplates,
  onSaveCustomAsTemplate,
  onDeleteCustomTemplate,
  onCreateSchedule,
  customActivities,
  onCustomActivitiesChange,
  schedules,
  onCancelSchedule,
  deviceTypeLabels,
  getActionLabelByType,
  zones = [],
  selectedZoneIds = [],
  onSelectedZoneIdsChange = () => {},
  startDate = "",
  endDate = "",
  onStartDateChange = () => {},
  onEndDateChange = () => {},
  repeatDaily = false,
  onRepeatDailyChange = () => {},
  scheduleMode = "template",
  onScheduleModeChange = () => {},
}) => {
  const getActionOptionsByType = (deviceType: Device["type"] | undefined) =>
    deviceType === "light"
      ? [
          { value: 0, label: "Tắt đèn" },
          ...[1, 2, 3, 4].map((level) => ({
            value: level,
            label: `Bật đèn mức ${level}`,
          })),
        ]
      : [
          { value: 0, label: "Tắt thiết bị" },
          { value: 1, label: "Bật thiết bị" },
        ];

  const toDateTimeLocalValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const createDefaultActivity = (): CustomScheduleActivity => ({
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    deviceId: devices[0]?.id ?? "",
    targetLevel: devices[0]?.type === "light" ? 4 : 1,
    scheduleAt,
  });

  const updateCustomActivity = (
    activityId: string,
    patch: Partial<CustomScheduleActivity>,
  ) => {
    onCustomActivitiesChange(
      customActivities.map((activity) =>
        activity.id === activityId ? { ...activity, ...patch } : activity,
      ),
    );
  };

  useEffect(() => {
    if (customActivities.length === 0 || devices.length === 0) {
      return;
    }

    const nextActivities = customActivities.map((activity, index) => {
      const currentDevice = devices.find(
        (device) => device.id === activity.deviceId,
      );
      if (currentDevice) {
        return activity;
      }

      const fallbackDevice = devices[index] ?? devices[0];
      if (!fallbackDevice) {
        return activity;
      }

      const defaultLevel = fallbackDevice.type === "light" ? 4 : 1;
      return {
        ...activity,
        deviceId: fallbackDevice.id,
        targetLevel: defaultLevel,
      };
    });

    const hasChanges = nextActivities.some(
      (activity, index) => activity !== customActivities[index],
    );

    if (hasChanges) {
      onCustomActivitiesChange(nextActivities);
    }
  }, [customActivities, devices, onCustomActivitiesChange]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3
            className="text-gray-900 flex items-center gap-2"
            style={{ fontSize: "14px", fontWeight: 700 }}
          >
            <CalendarClock size={16} className="text-emerald-600" />
            Lập Lịch Điều Khiển
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onScheduleModeChange("template")}
              className={`px-3 py-1 rounded text-sm font-600 ${
                scheduleMode === "template"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Theo mẫu
            </button>
            <button
              type="button"
              onClick={() => onScheduleModeChange("custom")}
              className={`px-3 py-1 rounded text-sm font-600 ${
                scheduleMode === "custom"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tự lập lịch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scheduleMode === "template" && (
            <>
              <select
                value={selectedLivestockType}
                onChange={(e) => onSelectedLivestockTypeChange(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                style={{ fontSize: "13px" }}
              >
                {livestockTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <div className="md:col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p
                    className="text-gray-900"
                    style={{ fontSize: "13px", fontWeight: 700 }}
                  >
                    Mẫu cho{" "}
                    {
                      livestockTypes.find(
                        (type) => type.value === selectedLivestockType,
                      )?.label
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500" style={{ fontSize: "11px" }}>
                      Thiết bị nào làm gì
                    </p>
                    {selectedLivestockType.startsWith("custom-") &&
                      onDeleteCustomTemplate && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteCustomTemplate(selectedLivestockType)
                          }
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Xóa mẫu
                        </button>
                      )}
                  </div>
                </div>

                {templatesByLivestock.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {templatesByLivestock.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className="text-gray-900"
                              style={{ fontSize: "12px", fontWeight: 700 }}
                            >
                              {deviceTypeLabels[template.deviceType]}
                            </p>
                            <p
                              className="text-gray-500"
                              style={{ fontSize: "11px" }}
                            >
                              {template.note}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className="text-emerald-700"
                              style={{ fontSize: "11px", fontWeight: 700 }}
                            >
                              Bật {template.onTime}
                            </p>
                            {template.offTime && (
                              <p
                                className="text-gray-500"
                                style={{ fontSize: "11px" }}
                              >
                                Tắt {template.offTime}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500" style={{ fontSize: "12px" }}>
                    Chưa có mẫu lịch cho loại nuôi này.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-gray-700"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Áp dụng cho ao:
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {zones.map((z) => (
                    <label
                      key={z.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.includes(z.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectedZoneIdsChange([...selectedZoneIds, z.id]);
                          } else {
                            onSelectedZoneIdsChange(
                              selectedZoneIds.filter((id) => id !== z.id),
                            );
                          }
                        }}
                      />
                      {z.name}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSelectedZoneIdsChange(zones.map((z) => z.id))
                  }
                  className="mt-2 text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Chọn tất cả
                </button>
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-gray-700"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Ngày bắt đầu / kết thúc:
                </label>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                    style={{ fontSize: "13px" }}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                    style={{ fontSize: "13px" }}
                  />
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={repeatDaily}
                      onChange={(e) => onRepeatDailyChange(e.target.checked)}
                    />
                    Lặp hàng ngày
                  </label>
                </div>
              </div>
            </>
          )}

          {scheduleMode === "custom" && (
            <>
              <div className="md:col-span-2 flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onCustomActivitiesChange([
                        ...customActivities,
                        createDefaultActivity(),
                      ])
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                  >
                    Thêm hoạt động
                  </button>
                  <button
                    type="button"
                    onClick={onSaveCustomAsTemplate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                  >
                    Lưu làm mẫu
                  </button>
                </div>
              </div>

              {customActivities.map((activity, index) => {
                const selectedDevice = devices.find(
                  (device) => device.id === activity.deviceId,
                );
                const actionOptions = getActionOptionsByType(
                  selectedDevice?.type,
                );

                return (
                  <div
                    key={activity.id}
                    className="md:col-span-2 rounded-xl border border-gray-100 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className="text-gray-900"
                        style={{ fontSize: "13px", fontWeight: 700 }}
                      >
                        Hoạt động {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onCustomActivitiesChange(
                            customActivities.filter(
                              (item) => item.id !== activity.id,
                            ),
                          )
                        }
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        disabled={customActivities.length <= 1}
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="datetime-local"
                        value={activity.scheduleAt}
                        onChange={(e) =>
                          updateCustomActivity(activity.id, {
                            scheduleAt: e.target.value,
                          })
                        }
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                        style={{ fontSize: "13px" }}
                      />

                      <select
                        value={activity.deviceId}
                        onChange={(e) => {
                          const nextDevice = devices.find(
                            (device) => device.id === e.target.value,
                          );
                          updateCustomActivity(activity.id, {
                            deviceId: e.target.value,
                            targetLevel: nextDevice?.type === "light" ? 4 : 1,
                          });
                        }}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                        style={{ fontSize: "13px" }}
                      >
                        <option value="">Chọn thiết bị</option>
                        {devices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} (
                            {deviceTypeLabels[device.type] ?? device.type})
                          </option>
                        ))}
                      </select>

                      <select
                        value={activity.targetLevel}
                        onChange={(e) =>
                          updateCustomActivity(activity.id, {
                            targetLevel: Number(e.target.value),
                          })
                        }
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                        style={{ fontSize: "13px" }}
                        disabled={!selectedDevice}
                      >
                        {actionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-gray-500" style={{ fontSize: "11px" }}>
                      {selectedDevice
                        ? `${selectedDevice.name} - ${getActionLabelByType(selectedDevice.type, activity.targetLevel)}`
                        : "Chọn thiết bị để cấu hình hành động"}
                    </p>
                  </div>
                );
              })}

              <div className="md:col-span-2">
                <label
                  className="text-gray-700"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Ghi chú chung:
                </label>
                <input
                  type="text"
                  value={scheduleNote}
                  onChange={(e) => onScheduleNoteChange(e.target.value)}
                  placeholder="Ghi chú lịch (tuỳ chọn)"
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
                  style={{ fontSize: "13px" }}
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={onCreateSchedule}
          disabled={isScheduleSubmitting || devices.length === 0}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          {isScheduleSubmitting ? "Đang lưu lịch..." : "Tạo lịch"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3
          className="text-gray-900 mb-3"
          style={{ fontSize: "14px", fontWeight: 700 }}
        >
          Danh Sách Lịch
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {schedules.length === 0 && (
            <p className="text-gray-400" style={{ fontSize: "12px" }}>
              Chưa có lịch điều khiển.
            </p>
          )}
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-gray-800"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    {schedule.actuators?.name || schedule.actuator_id} -{" "}
                    {getActionLabelByType(
                      schedule.actuators?.type?.toLowerCase(),
                      schedule.target_level,
                    )}
                  </p>
                  <p className="text-gray-500" style={{ fontSize: "12px" }}>
                    {new Date(schedule.schedule_at).toLocaleString("vi-VN")}
                  </p>
                  {schedule.note && (
                    <p className="text-gray-400" style={{ fontSize: "11px" }}>
                      {schedule.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      schedule.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : schedule.status === "done"
                          ? "bg-emerald-100 text-emerald-700"
                          : schedule.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {SCHEDULE_STATUS_LABEL[schedule.status]}
                  </span>
                  {schedule.status === "pending" && (
                    <button
                      onClick={() => onCancelSchedule(schedule.id)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50"
                      title="Hủy lịch"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
