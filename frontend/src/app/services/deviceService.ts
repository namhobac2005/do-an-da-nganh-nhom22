/**
 * deviceService.ts
 * Giao tiếp với Backend Node.js/Express
 */

const API_URL = "http://localhost:5000";

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
    const response = await fetch(`${API_URL}/devices`);
    if (!response.ok) throw new Error("Network response was not ok");

    const dbDevices = await response.json();

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

    const response = await fetch(`${API_URL}/devices/${deviceId}/control`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level: numericLevel }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Lỗi từ Backend");
    }

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
): Promise<DeviceLog[]> => {
  try {
    const query = new URLSearchParams({ limit: String(limit) });
    if (actuatorId) query.set("actuatorId", actuatorId);

    const response = await fetch(`${API_URL}/devices/logs?${query.toString()}`);
    if (!response.ok) {
      console.error(
        "[FE] Response not ok:",
        response.status,
        response.statusText,
      );
      throw new Error("Không lấy được logs thiết bị");
    }
    const data = await response.json();
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

    const response = await fetch(
      `${API_URL}/schedules${query.toString() ? `?${query.toString()}` : ""}`,
    );

    if (!response.ok) throw new Error("Không lấy được lịch điều khiển");
    return await response.json();
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
    const response = await fetch(`${API_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Tạo lịch thất bại");
    }

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
    const response = await fetch(`${API_URL}/schedules/${scheduleId}/cancel`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Hủy lịch thất bại");
    }

    return { success: true };
  } catch (error: any) {
    console.error("[FE] Lỗi hủy lịch:", error);
    return { success: false, error: error.message || "Lỗi kết nối server" };
  }
};
