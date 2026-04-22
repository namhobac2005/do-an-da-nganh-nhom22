const API_URL = "http://localhost:5000";

export interface ReportKpis {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalCommands: number;
}

export interface SensorTrendPoint {
  day: string;
  temperature: number | null;
  waterLevel: number | null;
  brightness: number | null;
}

export interface LogDistributionItem {
  name: string;
  value: number;
}

export interface LatestLogItem {
  id: string;
  action: string;
  status: string;
  created_at: string;
  actuators?: {
    name?: string;
    type?: string;
  };
}

export interface DashboardReport {
  kpis: ReportKpis;
  sensorTrend: SensorTrendPoint[];
  logDistribution: LogDistributionItem[];
  latestLogs: LatestLogItem[];
}

export const getDashboardReport = async (params: {
  from?: string;
  to?: string;
  actuatorType?: string;
}): Promise<DashboardReport | null> => {
  try {
    const query = new URLSearchParams();

    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.actuatorType && params.actuatorType !== "all") {
      query.set("actuatorType", params.actuatorType);
    }

    const response = await fetch(
      `${API_URL}/reports/dashboard${query.toString() ? `?${query.toString()}` : ""}`,
    );

    if (!response.ok) {
      throw new Error("Không lấy được dữ liệu báo cáo");
    }

    return await response.json();
  } catch (error) {
    console.error("[FE] Lỗi lấy dữ liệu báo cáo:", error);
    return null;
  }
};
