// src/services/sensorService.ts
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const API_URL = 'http://localhost:5000';
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
  status: 'normal' | 'warning' | 'critical';
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
      method: 'GET', // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error('Lỗi fetch zones');
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
      method: 'GET', // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error('Lỗi fetch ponds');
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
      method: 'GET', // Phải khai báo method
      headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
    });
    if (!response.ok) throw new Error('Lỗi fetch latest sensors');
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
        method: 'GET', // Phải khai báo method
        headers: getAuthHeaders(), // THÊM DÒNG NÀY ĐỂ ĐƯA TOKEN CHO BACKEND
      },
    );
    if (!response.ok) throw new Error('Lỗi fetch history');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};
