/**
 * deviceService.ts
 * Giao tiếp với Backend Node.js/Express
 */

const API_URL = 'http://localhost:5000';

export interface SendCommandResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

export const getAllDevices = async () => {
  try {
    const response = await fetch(`${API_URL}/devices`);
    if (!response.ok) throw new Error('Network response was not ok');

    const dbDevices = await response.json();

    return dbDevices.map((dbDev: any) => {
      // Xác định level: Nếu là số thì giữ nguyên, nếu là chữ ON/OFF thì map về 1/0
      const currentLevel =
        typeof dbDev.status === 'number'
          ? dbDev.status
          : dbDev.status === 'ON'
            ? 1
            : 0;

      return {
        id: dbDev.id,
        name: dbDev.name || 'Thiết bị không tên',
        type: dbDev.type?.toLowerCase() || 'pump',
        isActive: dbDev.status !== 'OFF' && dbDev.status !== 0,
        level: currentLevel,
        isOnline: true, // Mặc định true vì đã lấy được từ DB
        mode: dbDev.mode ? dbDev.mode.toLowerCase() : 'manual',
        lastUpdated: dbDev.updated_at || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('[FE] Lỗi lấy danh sách thiết bị:', error);
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
      typeof level === 'string' ? parseInt(level, 10) : level;

    const response = await fetch(`${API_URL}/devices/${deviceId}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level: numericLevel }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lỗi từ Backend');
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[FE] Lỗi gửi lệnh điều khiển:', error);
    return {
      success: false,
      error: error.message || 'Lỗi kết nối Server',
      timestamp: new Date().toISOString(),
    };
  }
};
