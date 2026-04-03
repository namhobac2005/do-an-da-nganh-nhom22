// src/services/sensorService.ts
const API_URL = 'http://localhost:5000';

export interface SensorData {
  id: string;
  type: 'temperature' | 'water-level' | 'brightness';
  value: number;
  status: 'normal' | 'warning' | 'critical';
  unit: string;
  timestamp: string;
}

export interface HistoryRecord {
  value: number;
  timestamp: string;
  sensors: {
    type: string;
  };
}

/**
 * Lấy trạng thái mới nhất của tất cả cảm biến (cho các Card)
 */
export const getLatestSensors = async (): Promise<SensorData[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors`);
    if (!response.ok) throw new Error('Lỗi fetch sensors');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Lấy lịch sử dữ liệu (cho biểu đồ)
 */
export const getSensorHistory = async (
  limit: number = 10,
): Promise<HistoryRecord[]> => {
  try {
    const response = await fetch(`${API_URL}/sensors/history?limit=${limit}`);
    if (!response.ok) throw new Error('Lỗi fetch history');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};
