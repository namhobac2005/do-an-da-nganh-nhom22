/**
 * scheduleService.ts - Schedule CRUD APIs
 */
const API_URL = "http://localhost:5000";

export interface Schedule {
  id?: string;
  device_id: string;
  level: number;
  cron_expr: string;
  action: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lấy danh sách tất cả lịch trình
 */
export const getSchedules = async (): Promise<Schedule[]> => {
  try {
    const response = await fetch(`${API_URL}/schedules`);
    if (!response.ok) throw new Error("Lỗi fetch schedules");
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("[FE] Lỗi lấy danh sách lịch trình:", error);
    return [];
  }
};

/**
 * Tạo lịch trình mới
 */
export const createSchedule = async (
  schedule: Schedule,
): Promise<Schedule | null> => {
  try {
    const response = await fetch(`${API_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    });
    if (!response.ok) throw new Error("Lỗi tạo lịch trình");
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("[FE] Lỗi tạo lịch trình:", error);
    throw error;
  }
};

/**
 * Cập nhật lịch trình
 */
export const updateSchedule = async (
  id: string,
  updates: Partial<Schedule>,
): Promise<Schedule | null> => {
  try {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Lỗi cập nhật lịch trình");
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("[FE] Lỗi cập nhật lịch trình:", error);
    throw error;
  }
};

/**
 * Xóa lịch trình
 */
export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Lỗi xóa lịch trình");
    return true;
  } catch (error) {
    console.error("[FE] Lỗi xóa lịch trình:", error);
    throw error;
  }
};

/**
 * Lấy trạng thái cron jobs
 */
export const getCronStatus = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_URL}/schedules/status`);
    if (!response.ok) throw new Error("Lỗi fetch cron status");
    const result = await response.json();
    return result.active_jobs || 0;
  } catch (error) {
    console.error("[FE] Lỗi lấy trạng thái cron:", error);
    return 0;
  }
};
