/**
 * deviceService.ts
 * Giao tiếp với Backend Node.js/Express
 * Hỗ trợ: light (đèn), pump (máy bơm), fan (quạt), servo (động cơ servo)
 */

const API_URL = "http://localhost:5000";

// Các loại thiết bị được hỗ trợ
const SUPPORTED_DEVICE_TYPES = ["light", "pump", "fan", "servo"];

export interface SendCommandResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface DeviceLog {
  id?: string;
  actuator_id?: string;
  device_id?: string;
  action: string;
  status: string;
  user_id?: string;
  created_at?: string;
  timestamp?: string;
  actuators?: {
    name: string;
    type: string;
  };
}

export const getAllDevices = async () => {
  try {
    const response = await fetch(`${API_URL}/devices`);
    if (!response.ok) throw new Error("Network response was not ok");

    const dbDevices = await response.json();

    return dbDevices
      .filter((dbDev: any) => {
        // Chỉ lấy các thiết bị thuộc 4 loại được hỗ trợ
        const deviceType = dbDev.type?.toLowerCase() || "pump";
        return SUPPORTED_DEVICE_TYPES.includes(deviceType);
      })
      .map((dbDev: any) => {
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
          zoneId: dbDev.zone_id || dbDev.zoneId || undefined,
          isActive: dbDev.status !== "OFF" && dbDev.status !== 0,
          level: currentLevel,
          isOnline: true, // Mặc định true vì đã lấy được từ DB
          mode: dbDev.mode ? dbDev.mode.toLowerCase() : "manual",
          lastUpdated: dbDev.updated_at || new Date().toISOString(),
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

/**
 * Lấy nhật ký của một thiết bị cụ thể
 */
export const getDeviceLogs = async (
  deviceId: string,
  limit: number = 50,
  from?: string,
  to?: string,
): Promise<DeviceLog[]> => {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await fetch(
      `${API_URL}/reports/devices/${deviceId}/logs?${params}`,
    );
    if (!response.ok) throw new Error("Lỗi fetch device logs");

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("[FE] Lỗi lấy nhật ký thiết bị:", error);
    return [];
  }
};

/**
 * Lấy tất cả nhật ký gần đây
 */
export const getAllLogs = async (limit: number = 100): Promise<DeviceLog[]> => {
  try {
    const response = await fetch(`${API_URL}/reports/logs?limit=${limit}`);
    if (!response.ok) throw new Error("Lỗi fetch all logs");

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("[FE] Lỗi lấy toàn bộ nhật ký:", error);
    return [];
  }
};

/**
 * Lấy báo cáo của thiết bị
 */
export const getDeviceReport = async (
  deviceId: string,
  period: "day" | "week" | "month" = "day",
) => {
  try {
    const response = await fetch(
      `${API_URL}/reports/devices/${deviceId}?period=${period}`,
    );
    if (!response.ok) throw new Error("Lỗi fetch device report");

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("[FE] Lỗi lấy báo cáo thiết bị:", error);
    return null;
  }
};

/**
 * Lấy báo cáo cảm biến
 */
export const getSensorReport = async (
  period: "day" | "week" | "month" = "day",
) => {
  try {
    const response = await fetch(`${API_URL}/reports/sensors?period=${period}`);
    if (!response.ok) throw new Error("Lỗi fetch sensor report");

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("[FE] Lỗi lấy báo cáo cảm biến:", error);
    return null;
  }
};
