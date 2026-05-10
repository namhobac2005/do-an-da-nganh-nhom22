/**
 * deviceService.ts
 * Giao tiếp với Backend Node.js/Express
 */

import { api } from "./api";

export interface SendCommandResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface DeviceLog {
  id: string;
  actuator_id: string;
  action: string;
  mode: string;
  status: string;
  user_id?: string | null;
  created_at: string;
  actuators?: {
    name?: string;
    type?: string;
  };
}

export interface DeviceSchedule {
  id: string;
  actuator_id: string;
  target_level: number;
  schedule_at: string;
  status: "pending" | "done" | "failed" | "cancelled";
  note?: string | null;
  created_at: string;
  updated_at?: string;
  actuators?: {
    name?: string;
    type?: string;
  };
}

export const getAllDevices = async () => {
  try {
    const dbDevices = await api.get<any[]>("/devices");

    return dbDevices.map((dbDev: any) => {
      // Xác định level: Nếu là số thì giữ nguyên, nếu là chữ ON/OFF thì map về 1/0
      const currentLevel =
        typeof dbDev.status === "number"
          ? dbDev.status
          : dbDev.status === "ON"
            ? 1
            : 0;

      return {
        id: dbDev.id,
        name: dbDev.name || "Thiết bị không tên",
        type: dbDev.type?.toLowerCase() || "pump",
        isActive: dbDev.status !== "OFF" && dbDev.status !== 0,
        level: currentLevel,
        isOnline: true, // Mặc định true vì đã lấy được từ DB
        mode: dbDev.mode ? dbDev.mode.toLowerCase() : "manual",
        lastUpdated: dbDev.updated_at || new Date().toISOString(),
        // Nếu DB có liên kết zone/ao, giữ nguyên trường để frontend có thể lọc theo ao
        pond_id: dbDev.pond_id || null,
        zone_id: dbDev.zone_id || null,
      };
    });
  } catch (error) {
    console.error("[FE] Lỗi lấy danh sách thiết bị:", error);
    return [];
  }
};

/**
 * Gửi lệnh điều khiển thiết bị lên Backend
 * Fix: Chấp nhận level là string hoặc number để linh hoạt cho các loại thiết bị
 */
export const sendDeviceCommand = async (
  deviceId: string,
  level: string | number, // Để string cho Adafruit dễ xử lý hoặc number cho DB
): Promise<SendCommandResult> => {
  try {
    // Ép kiểu level về number trước khi gửi lên Backend nếu Backend yêu cầu số
    const numericLevel =
      typeof level === "string" ? parseInt(level, 10) : level;

    await api.post(`/devices/${deviceId}/control`, { level: numericLevel });

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("[FE] Lỗi gửi lệnh điều khiển:", error);
    return {
      success: false,
      error: error.message || "Lỗi kết nối Server",
      timestamp: new Date().toISOString(),
    };
  }
};

export const getDeviceLogs = async (
  limit: number = 30,
  actuatorId?: string,
  from?: string,
  to?: string,
): Promise<DeviceLog[]> => {
  try {
    const query = new URLSearchParams({ limit: String(limit) });
    if (actuatorId) query.set("actuatorId", actuatorId);
    if (from) query.set("from", from);
    if (to) query.set("to", to);

    const data = await api.get<DeviceLog[]>(
      `/devices/logs?${query.toString()}`,
    );
    console.log("[FE] Device logs fetched:", data);
    return data;
  } catch (error) {
    console.error("[FE] Lỗi lấy logs thiết bị:", error);
    return [];
  }
};

export const getDeviceSchedules = async (
  actuatorId?: string,
): Promise<DeviceSchedule[]> => {
  try {
    const query = new URLSearchParams();
    if (actuatorId) query.set("actuatorId", actuatorId);

    return await api.get<DeviceSchedule[]>(
      `/schedules${query.toString() ? `?${query.toString()}` : ""}`,
    );
  } catch (error) {
    console.error("[FE] Lỗi lấy lịch điều khiển:", error);
    return [];
  }
};

export const createDeviceSchedule = async (payload: {
  actuator_id: string;
  target_level: number;
  schedule_at: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post("/schedules", payload);

    return { success: true };
  } catch (error: any) {
    console.error("[FE] Lỗi tạo lịch:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};

export const cancelDeviceSchedule = async (
  scheduleId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.patch(`/schedules/${scheduleId}/cancel`);

    return { success: true };
  } catch (error: any) {
    console.error("[FE] Lỗi hủy lịch:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};

// ===== DEVICE MANAGEMENT CRUD FUNCTIONS =====

export interface Device {
  id: string;
  name: string;
  type: "pump" | "fan" | "light" | "servo";
  feed_key: string;
  pond_id?: string;
  zone_id?: string | null;
  status: string;
  mode: "auto" | "manual";
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeviceDto {
  name: string;
  type: "pump" | "fan" | "light" | "servo";
  feed_key: string;
  pond_id?: string;
  mode?: "auto" | "manual";
  description?: string;
}

export interface UpdateDeviceDto {
  name?: string;
  type?: "pump" | "fan" | "light" | "servo";
  feed_key?: string;
  pond_id?: string;
  mode?: "auto" | "manual";
  description?: string;
}

/**
 * Tạo thiết bị mới
 */
export const createDevice = async (
  deviceData: CreateDeviceDto,
): Promise<{ success: boolean; data?: Device; error?: string }> => {
  try {
    const result = await api.post<{ success: boolean; data: Device }>(
      "/devices",
      deviceData,
    );

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("[FE] Lỗi tạo thiết bị:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};

/**
 * Cập nhật thiết bị
 */
export const updateDevice = async (
  deviceId: string,
  deviceData: UpdateDeviceDto,
): Promise<{ success: boolean; data?: Device; error?: string }> => {
  try {
    const result = await api.put<{ success: boolean; data: Device }>(
      `/devices/${deviceId}`,
      deviceData,
    );

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("[FE] Lỗi cập nhật thiết bị:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};

/**
 * Xóa thiết bị
 */
export const deleteDevice = async (
  deviceId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.delete(`/devices/${deviceId}`);

    return { success: true };
  } catch (error: any) {
    console.error("[FE] Lỗi xóa thiết bị:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};

/**
 * Lấy chi tiết thiết bị
 */
export const getDevice = async (deviceId: string): Promise<Device | null> => {
  try {
    return await api.get<Device>(`/devices/${deviceId}`);
  } catch (error) {
    console.error("[FE] Lỗi lấy chi tiết thiết bị:", error);
    return null;
  }
};
