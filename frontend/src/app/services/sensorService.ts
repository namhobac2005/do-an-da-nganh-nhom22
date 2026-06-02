// src/services/sensorService.ts
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const API_URL = "http://localhost:5000";
export interface Zone {
  id: string;
  name: string;
}

export interface Pond {
  id: string;
  name: string;
}

export interface SensorData {
  id: string;
  name: string;
  type: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  value: number;
  updated_at: string;
}

export interface HistoryRecord {
  value: number;
  timestamp: string;
  sensors: {
    type: string;
  };
}

// 1. Lấy danh sách Zone (HÀM ĐANG BỊ THIẾU GÂY RA LỖI)
export const getZones = async (): Promise<Zone[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors/zones`, {
      method: "GET", // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error("Lỗi fetch zones");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// 2. Lấy danh sách Pond theo Zone
export const getPondsByZone = async (zoneId: string): Promise<Pond[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors/zones/${zoneId}/ponds`, {
      method: "GET", // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error("Lỗi fetch ponds");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// 3. Lấy giá trị mới nhất của các cảm biến theo Pond
export const getLatestSensors = async (
  pondId: string,
): Promise<SensorData[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors/latest?pondId=${pondId}`, {
      method: "GET", // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error("Lỗi fetch latest sensors");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// 4. Lấy lịch sử cảm biến theo Pond để vẽ biểu đồ
export const getSensorHistory = async (
  pondId: string,
  limit: number = 50,
): Promise<HistoryRecord[]> => {
  try {
    const response = await fetch(
      `${API_URL}/sensors/history?pondId=${pondId}&limit=${limit}`,
      {
        method: "GET", // Phải khai báo method
        headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
      },
    );
    if (!response.ok) throw new Error("Lỗi fetch history");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ===== Latest all sensors (theo quyền) =====
export const getLatestSensorsByZoneAll = async (): Promise<SensorData[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors/latest/all`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Lỗi fetch latest sensors all");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ===== CRUD Sensor metadata =====
export type SensorStatus = "normal" | "warning" | "critical";

export interface CreateSensorDto {
  pond_id: string;
  name: string;
  type: string;
  unit: string;
  status: SensorStatus;
  feed_key?: string;
}

export interface UpdateSensorDto {
  pond_id?: string;
  name?: string;
  type?: string;
  unit?: string;
  status?: SensorStatus;
  feed_key?: string;
}

export const createSensor = async (
  dto: CreateSensorDto,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/sensors/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    const json = await response.json();
    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Tạo sensor thất bại");
    }

    return { success: true, data: json.data };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error?.message || "Lỗi kết nối server" };
  }
};

export const updateSensor = async (
  sensorId: string,
  dto: UpdateSensorDto,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/sensors/${sensorId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });

    const json = await response.json();
    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Cập nhật sensor thất bại");
    }

    return { success: true, data: json.data };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error?.message || "Lỗi kết nối server" };
  }
};

export const deleteSensor = async (
  sensorId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/sensors/${sensorId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const json = await response.json();
    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Xóa sensor thất bại");
    }

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error?.message || "Lỗi kết nối server" };
  }
};
