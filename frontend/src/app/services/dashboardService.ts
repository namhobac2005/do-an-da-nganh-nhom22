// src/services/dashboardService.ts
const API_URL = 'http://localhost:5000';

export interface DashboardKPIs {
  totalZones: number;
  totalPonds: number;
  totalDevices: number;
  onlineDevices: number;
  activeDevices: number;
  criticalAlerts: number;
}

export interface RecentAlert {
  id: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  sensorType: string;
  pondName: string;
  isRead: boolean;
}

export interface ZoneOverview {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
  totalPonds: number;
  activeDevices: number;
  activeAlerts: number;
}

/**
 * Lấy các chỉ số KPI trên cùng (StatCards)
 */
export const getKPIs = async (): Promise<DashboardKPIs | null> => {
  try {
    const response = await fetch(`${API_URL}/dashboard/kpis`);
    if (!response.ok) throw new Error('Lỗi fetch KPIs');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Lấy danh sách cảnh báo gần đây
 */
export const getRecentAlerts = async (
  limit: number = 5,
): Promise<RecentAlert[]> => {
  try {
    const response = await fetch(
      `${API_URL}/dashboard/alerts/recent?limit=${limit}`,
    );
    if (!response.ok) throw new Error('Lỗi fetch alerts');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Lấy thông tin tóm tắt của các khu vực (Cards cuối trang)
 */
export const getZonesOverview = async (): Promise<ZoneOverview[]> => {
  try {
    const response = await fetch(`${API_URL}/dashboard/zones-overview`);
    if (!response.ok) throw new Error('Lỗi fetch zones overview');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};
