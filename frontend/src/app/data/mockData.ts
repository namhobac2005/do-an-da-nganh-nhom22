/**
 * mockData.ts
 * Dữ liệu giả lập cho toàn bộ hệ thống quản lý ao nuôi thủy sản
 * Trong môi trường production, dữ liệu sẽ được fetch từ API / Adafruit IO
 */

// ========== TYPE DEFINITIONS ==========

export type DeviceType = 'pump' | 'aerator' | 'feeder' | 'heater' | 'light' | 'valve';
export type DeviceMode = 'auto' | 'manual';
export type SensorType = 'temperature' | 'ph' | 'do' | 'turbidity' | 'salinity' | 'ammonia';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type UserRole = 'admin' | 'user';

export interface Zone {
  id: string;
  name: string;
  location: string;
  pondCount: number;
  totalArea: number; // m²
  status: 'active' | 'inactive' | 'maintenance';
  managerId: string;
  createdAt: string;
}

export interface Pond {
  id: string;
  zoneId: string;
  name: string;
  area: number; // m²
  depth: number; // m
  species: string;
  stockingDate: string;
  stockingDensity: number; // con/m²
  status: 'active' | 'inactive' | 'harvesting';
  targetWeight: number; // kg
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  pondId: string;
  zoneId: string;
  /** Feed key trên Adafruit IO - dùng để gửi/nhận lệnh */
  feedKey: string;
  isOnline: boolean;
  isActive: boolean; // trạng thái bật/tắt hiện tại
  mode: DeviceMode;
  lastUpdated: string;
  powerWatts: number;
  model: string;
  serialNumber: string;
  installDate: string;
}

export interface Sensor {
  id: string;
  pondId: string;
  zoneId: string;
  type: SensorType;
  /** Feed key trên Adafruit IO để đọc dữ liệu real-time */
  feedKey: string;
  currentValue: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface SensorHistory {
  timestamp: string;
  value: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  pondId: string;
  pondName: string;
  zoneName: string;
  sensorType: string;
  message: string;
  severity: AlertSeverity;
  value: number;
  unit: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  zoneId?: string; // User chỉ có quyền trên zone được phân công
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

export interface Schedule {
  id: string;
  deviceId: string;
  name: string;
  type: 'time' | 'condition';
  startTime?: string;
  endTime?: string;
  days?: string[];
  conditionSensorType?: SensorType;
  conditionOperator?: '>' | '<' | '>=' | '<=';
  conditionValue?: number;
  action: 'on' | 'off';
  isActive: boolean;
}

// ========== MOCK DATA ==========

export const MOCK_ZONES: Zone[] = [
  {
    id: 'zone-1',
    name: 'Khu A - Tôm Thẻ',
    location: 'Phía Bắc, Cà Mau',
    pondCount: 4,
    totalArea: 12000,
    status: 'active',
    managerId: 'user-2',
    createdAt: '2023-01-15',
  },
  {
    id: 'zone-2',
    name: 'Khu B - Cá Tra',
    location: 'Phía Nam, An Giang',
    pondCount: 3,
    totalArea: 8500,
    status: 'active',
    managerId: 'user-3',
    createdAt: '2023-03-20',
  },
  {
    id: 'zone-3',
    name: 'Khu C - Tôm Sú',
    location: 'Trung Tâm, Bạc Liêu',
    pondCount: 3,
    totalArea: 9000,
    status: 'maintenance',
    managerId: 'user-4',
    createdAt: '2023-06-10',
  },
];

export const MOCK_PONDS: Pond[] = [
  // Zone A
  { id: 'pond-a1', zoneId: 'zone-1', name: 'Ao A1', area: 3000, depth: 1.5, species: 'Tôm Thẻ Chân Trắng', stockingDate: '2024-01-10', stockingDensity: 120, status: 'active', targetWeight: 15 },
  { id: 'pond-a2', zoneId: 'zone-1', name: 'Ao A2', area: 2800, depth: 1.4, species: 'Tôm Thẻ Chân Trắng', stockingDate: '2024-01-15', stockingDensity: 110, status: 'active', targetWeight: 15 },
  { id: 'pond-a3', zoneId: 'zone-1', name: 'Ao A3', area: 3200, depth: 1.6, species: 'Tôm Thẻ Chân Trắng', stockingDate: '2024-02-01', stockingDensity: 130, status: 'active', targetWeight: 15 },
  { id: 'pond-a4', zoneId: 'zone-1', name: 'Ao A4', area: 3000, depth: 1.5, species: 'Tôm Thẻ Chân Trắng', stockingDate: '2024-02-15', stockingDensity: 120, status: 'harvesting', targetWeight: 15 },
  // Zone B
  { id: 'pond-b1', zoneId: 'zone-2', name: 'Ao B1', area: 2500, depth: 2.0, species: 'Cá Tra', stockingDate: '2023-11-01', stockingDensity: 80, status: 'active', targetWeight: 800 },
  { id: 'pond-b2', zoneId: 'zone-2', name: 'Ao B2', area: 3000, depth: 2.2, species: 'Cá Tra', stockingDate: '2023-11-15', stockingDensity: 75, status: 'active', targetWeight: 800 },
  { id: 'pond-b3', zoneId: 'zone-2', name: 'Ao B3', area: 3000, depth: 2.0, species: 'Cá Tra', stockingDate: '2023-12-01', stockingDensity: 80, status: 'inactive', targetWeight: 800 },
  // Zone C
  { id: 'pond-c1', zoneId: 'zone-3', name: 'Ao C1', area: 3000, depth: 1.3, species: 'Tôm Sú', stockingDate: '2024-03-01', stockingDensity: 60, status: 'active', targetWeight: 30 },
  { id: 'pond-c2', zoneId: 'zone-3', name: 'Ao C2', area: 3000, depth: 1.2, species: 'Tôm Sú', stockingDate: '2024-03-10', stockingDensity: 55, status: 'active', targetWeight: 30 },
  { id: 'pond-c3', zoneId: 'zone-3', name: 'Ao C3', area: 3000, depth: 1.4, species: 'Tôm Sú', stockingDate: '2024-03-15', stockingDensity: 60, status: 'inactive', targetWeight: 30 },
];

export const MOCK_DEVICES: Device[] = [
  // ===== Zone A, Pond A1 =====
  { id: 'dev-001', name: 'Máy Bơm Chính A1', type: 'pump', pondId: 'pond-a1', zoneId: 'zone-1', feedKey: 'zone-a-pond1-pump1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:30:00', powerWatts: 750, model: 'Grundfos CM5', serialNumber: 'GF-2024-001', installDate: '2023-01-20' },
  { id: 'dev-002', name: 'Máy Sục Khí A1-1', type: 'aerator', pondId: 'pond-a1', zoneId: 'zone-1', feedKey: 'zone-a-pond1-aerator1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:31:00', powerWatts: 370, model: 'Paddle Wheel PW-2HP', serialNumber: 'PW-2024-001', installDate: '2023-01-20' },
  { id: 'dev-003', name: 'Máy Sục Khí A1-2', type: 'aerator', pondId: 'pond-a1', zoneId: 'zone-1', feedKey: 'zone-a-pond1-aerator2', isOnline: true, isActive: false, mode: 'manual', lastUpdated: '2024-07-20T07:00:00', powerWatts: 370, model: 'Paddle Wheel PW-2HP', serialNumber: 'PW-2024-002', installDate: '2023-01-20' },
  { id: 'dev-004', name: 'Máy Cho Ăn A1', type: 'feeder', pondId: 'pond-a1', zoneId: 'zone-1', feedKey: 'zone-a-pond1-feeder1', isOnline: true, isActive: false, mode: 'auto', lastUpdated: '2024-07-20T06:00:00', powerWatts: 50, model: 'AutoFeeder AF-500', serialNumber: 'AF-2024-001', installDate: '2023-03-15' },
  // ===== Zone A, Pond A2 =====
  { id: 'dev-005', name: 'Máy Bơm Chính A2', type: 'pump', pondId: 'pond-a2', zoneId: 'zone-1', feedKey: 'zone-a-pond2-pump1', isOnline: true, isActive: false, mode: 'manual', lastUpdated: '2024-07-20T09:00:00', powerWatts: 750, model: 'Grundfos CM5', serialNumber: 'GF-2024-002', installDate: '2023-02-01' },
  { id: 'dev-006', name: 'Máy Sục Khí A2', type: 'aerator', pondId: 'pond-a2', zoneId: 'zone-1', feedKey: 'zone-a-pond2-aerator1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:45:00', powerWatts: 370, model: 'Paddle Wheel PW-2HP', serialNumber: 'PW-2024-003', installDate: '2023-02-01' },
  { id: 'dev-007', name: 'Máy Cho Ăn A2', type: 'feeder', pondId: 'pond-a2', zoneId: 'zone-1', feedKey: 'zone-a-pond2-feeder1', isOnline: false, isActive: false, mode: 'manual', lastUpdated: '2024-07-19T18:00:00', powerWatts: 50, model: 'AutoFeeder AF-500', serialNumber: 'AF-2024-002', installDate: '2023-03-15' },
  // ===== Zone A, Pond A3 =====
  { id: 'dev-008', name: 'Máy Bơm Chính A3', type: 'pump', pondId: 'pond-a3', zoneId: 'zone-1', feedKey: 'zone-a-pond3-pump1', isOnline: true, isActive: true, mode: 'manual', lastUpdated: '2024-07-20T09:15:00', powerWatts: 1100, model: 'Grundfos CM7', serialNumber: 'GF-2024-003', installDate: '2023-02-15' },
  { id: 'dev-009', name: 'Máy Sục Khí A3', type: 'aerator', pondId: 'pond-a3', zoneId: 'zone-1', feedKey: 'zone-a-pond3-aerator1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T09:00:00', powerWatts: 550, model: 'Paddle Wheel PW-3HP', serialNumber: 'PW-2024-004', installDate: '2023-02-15' },
  // ===== Zone B, Pond B1 =====
  { id: 'dev-010', name: 'Máy Bơm Chính B1', type: 'pump', pondId: 'pond-b1', zoneId: 'zone-2', feedKey: 'zone-b-pond1-pump1', isOnline: true, isActive: false, mode: 'auto', lastUpdated: '2024-07-20T08:00:00', powerWatts: 1100, model: 'CNP CDLF', serialNumber: 'CNP-2024-001', installDate: '2023-03-20' },
  { id: 'dev-011', name: 'Máy Sục Khí B1', type: 'aerator', pondId: 'pond-b1', zoneId: 'zone-2', feedKey: 'zone-b-pond1-aerator1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:30:00', powerWatts: 750, model: 'Paddle Wheel PW-4HP', serialNumber: 'PW-2024-005', installDate: '2023-03-20' },
  { id: 'dev-012', name: 'Máy Gia Nhiệt B1', type: 'heater', pondId: 'pond-b1', zoneId: 'zone-2', feedKey: 'zone-b-pond1-heater1', isOnline: true, isActive: false, mode: 'auto', lastUpdated: '2024-07-20T07:30:00', powerWatts: 2000, model: 'Aqua Heater AH-2KW', serialNumber: 'AH-2024-001', installDate: '2023-04-01' },
  // ===== Zone B, Pond B2 =====
  { id: 'dev-013', name: 'Máy Bơm Chính B2', type: 'pump', pondId: 'pond-b2', zoneId: 'zone-2', feedKey: 'zone-b-pond2-pump1', isOnline: true, isActive: true, mode: 'manual', lastUpdated: '2024-07-20T09:30:00', powerWatts: 1100, model: 'CNP CDLF', serialNumber: 'CNP-2024-002', installDate: '2023-04-01' },
  { id: 'dev-014', name: 'Máy Sục Khí B2', type: 'aerator', pondId: 'pond-b2', zoneId: 'zone-2', feedKey: 'zone-b-pond2-aerator1', isOnline: false, isActive: false, mode: 'manual', lastUpdated: '2024-07-19T20:00:00', powerWatts: 750, model: 'Paddle Wheel PW-4HP', serialNumber: 'PW-2024-006', installDate: '2023-04-01' },
  // ===== Zone C, Pond C1 =====
  { id: 'dev-015', name: 'Máy Bơm Chính C1', type: 'pump', pondId: 'pond-c1', zoneId: 'zone-3', feedKey: 'zone-c-pond1-pump1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:00:00', powerWatts: 750, model: 'Grundfos CM5', serialNumber: 'GF-2024-004', installDate: '2023-06-15' },
  { id: 'dev-016', name: 'Máy Sục Khí C1', type: 'aerator', pondId: 'pond-c1', zoneId: 'zone-3', feedKey: 'zone-c-pond1-aerator1', isOnline: true, isActive: true, mode: 'auto', lastUpdated: '2024-07-20T08:15:00', powerWatts: 370, model: 'Paddle Wheel PW-2HP', serialNumber: 'PW-2024-007', installDate: '2023-06-15' },
];

export const MOCK_SENSORS: Sensor[] = [
  // Pond A1
  { id: 'sen-001', pondId: 'pond-a1', zoneId: 'zone-1', type: 'temperature', feedKey: 'zone-a-pond1-temp', currentValue: 28.5, unit: '°C', minThreshold: 25, maxThreshold: 33, status: 'normal', lastUpdated: '2024-07-20T09:25:00' },
  { id: 'sen-002', pondId: 'pond-a1', zoneId: 'zone-1', type: 'ph', feedKey: 'zone-a-pond1-ph', currentValue: 7.8, unit: '', minThreshold: 7.0, maxThreshold: 8.5, status: 'normal', lastUpdated: '2024-07-20T09:25:00' },
  { id: 'sen-003', pondId: 'pond-a1', zoneId: 'zone-1', type: 'do', feedKey: 'zone-a-pond1-do', currentValue: 5.2, unit: 'mg/L', minThreshold: 4.0, maxThreshold: 8.0, status: 'normal', lastUpdated: '2024-07-20T09:25:00' },
  { id: 'sen-004', pondId: 'pond-a1', zoneId: 'zone-1', type: 'turbidity', feedKey: 'zone-a-pond1-turbidity', currentValue: 32, unit: 'NTU', minThreshold: 15, maxThreshold: 50, status: 'normal', lastUpdated: '2024-07-20T09:25:00' },
  // Pond A2
  { id: 'sen-005', pondId: 'pond-a2', zoneId: 'zone-1', type: 'temperature', feedKey: 'zone-a-pond2-temp', currentValue: 31.2, unit: '°C', minThreshold: 25, maxThreshold: 33, status: 'warning', lastUpdated: '2024-07-20T09:20:00' },
  { id: 'sen-006', pondId: 'pond-a2', zoneId: 'zone-1', type: 'ph', feedKey: 'zone-a-pond2-ph', currentValue: 8.2, unit: '', minThreshold: 7.0, maxThreshold: 8.5, status: 'normal', lastUpdated: '2024-07-20T09:20:00' },
  { id: 'sen-007', pondId: 'pond-a2', zoneId: 'zone-1', type: 'do', feedKey: 'zone-a-pond2-do', currentValue: 3.5, unit: 'mg/L', minThreshold: 4.0, maxThreshold: 8.0, status: 'critical', lastUpdated: '2024-07-20T09:20:00' },
  // Pond B1
  { id: 'sen-008', pondId: 'pond-b1', zoneId: 'zone-2', type: 'temperature', feedKey: 'zone-b-pond1-temp', currentValue: 29.0, unit: '°C', minThreshold: 26, maxThreshold: 34, status: 'normal', lastUpdated: '2024-07-20T09:15:00' },
  { id: 'sen-009', pondId: 'pond-b1', zoneId: 'zone-2', type: 'ph', feedKey: 'zone-b-pond1-ph', currentValue: 7.4, unit: '', minThreshold: 6.5, maxThreshold: 8.0, status: 'normal', lastUpdated: '2024-07-20T09:15:00' },
  { id: 'sen-010', pondId: 'pond-b1', zoneId: 'zone-2', type: 'do', feedKey: 'zone-b-pond1-do', currentValue: 6.1, unit: 'mg/L', minThreshold: 4.0, maxThreshold: 8.0, status: 'normal', lastUpdated: '2024-07-20T09:15:00' },
  // Pond B2
  { id: 'sen-011', pondId: 'pond-b2', zoneId: 'zone-2', type: 'temperature', feedKey: 'zone-b-pond2-temp', currentValue: 27.8, unit: '°C', minThreshold: 26, maxThreshold: 34, status: 'normal', lastUpdated: '2024-07-20T09:10:00' },
  { id: 'sen-012', pondId: 'pond-b2', zoneId: 'zone-2', type: 'ph', feedKey: 'zone-b-pond2-ph', currentValue: 8.6, unit: '', minThreshold: 6.5, maxThreshold: 8.0, status: 'critical', lastUpdated: '2024-07-20T09:10:00' },
  // Pond C1
  { id: 'sen-013', pondId: 'pond-c1', zoneId: 'zone-3', type: 'temperature', feedKey: 'zone-c-pond1-temp', currentValue: 30.1, unit: '°C', minThreshold: 25, maxThreshold: 33, status: 'normal', lastUpdated: '2024-07-20T09:05:00' },
  { id: 'sen-014', pondId: 'pond-c1', zoneId: 'zone-3', type: 'salinity', feedKey: 'zone-c-pond1-salinity', currentValue: 15.5, unit: '‰', minThreshold: 5, maxThreshold: 25, status: 'normal', lastUpdated: '2024-07-20T09:05:00' },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'alert-001', timestamp: '2024-07-20T09:20:15', pondId: 'pond-a2', pondName: 'Ao A2', zoneName: 'Khu A', sensorType: 'DO', message: 'Nồng độ oxy hòa tan xuống dưới ngưỡng tối thiểu (3.5 mg/L < 4.0 mg/L). Kích hoạt máy sục khí ngay!', severity: 'critical', value: 3.5, unit: 'mg/L', isRead: false, isResolved: false },
  { id: 'alert-002', timestamp: '2024-07-20T09:10:42', pondId: 'pond-b2', pondName: 'Ao B2', zoneName: 'Khu B', sensorType: 'pH', message: 'pH vượt ngưỡng tối đa (8.6 > 8.5). Kiểm tra hệ thống nước.', severity: 'critical', value: 8.6, unit: '', isRead: false, isResolved: false },
  { id: 'alert-003', timestamp: '2024-07-20T08:45:30', pondId: 'pond-a2', pondName: 'Ao A2', zoneName: 'Khu A', sensorType: 'Nhiệt độ', message: 'Nhiệt độ đang ở mức cao (31.2°C), tiếp cận ngưỡng cảnh báo.', severity: 'warning', value: 31.2, unit: '°C', isRead: true, isResolved: false },
  { id: 'alert-004', timestamp: '2024-07-20T07:30:00', pondId: 'pond-b2', pondName: 'Ao B2', zoneName: 'Khu B', sensorType: 'Thiết bị', message: 'Máy Sục Khí B2 mất kết nối. Không nhận được tín hiệu trong 30 phút.', severity: 'warning', value: 0, unit: '', isRead: false, isResolved: false },
  { id: 'alert-005', timestamp: '2024-07-19T22:10:00', pondId: 'pond-a1', pondName: 'Ao A1', zoneName: 'Khu A', sensorType: 'pH', message: 'pH trở về ngưỡng bình thường (7.8).', severity: 'info', value: 7.8, unit: '', isRead: true, isResolved: true },
  { id: 'alert-006', timestamp: '2024-07-19T18:00:00', pondId: 'pond-a2', pondName: 'Ao A2', zoneName: 'Khu A', sensorType: 'Thiết bị', message: 'Máy Cho Ăn A2 mất kết nối với hệ thống.', severity: 'warning', value: 0, unit: '', isRead: true, isResolved: false },
  { id: 'alert-007', timestamp: '2024-07-19T14:20:00', pondId: 'pond-c1', pondName: 'Ao C1', zoneName: 'Khu C', sensorType: 'DO', message: 'DO trở về bình thường (5.8 mg/L) sau khi bật máy sục khí.', severity: 'info', value: 5.8, unit: 'mg/L', isRead: true, isResolved: true },
];

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Nguyễn Văn Admin', email: 'admin@aquasmart.vn', phone: '0901234567', role: 'admin', status: 'active', createdAt: '2023-01-01', lastLogin: '2024-07-20T09:00:00' },
  { id: 'user-2', name: 'Trần Thị Mai', email: 'mai.tran@aquasmart.vn', phone: '0912345678', role: 'user', zoneId: 'zone-1', status: 'active', createdAt: '2023-01-15', lastLogin: '2024-07-20T08:30:00' },
  { id: 'user-3', name: 'Lê Văn Hùng', email: 'hung.le@aquasmart.vn', phone: '0923456789', role: 'user', zoneId: 'zone-2', status: 'active', createdAt: '2023-03-20', lastLogin: '2024-07-19T17:00:00' },
  { id: 'user-4', name: 'Phạm Thị Lan', email: 'lan.pham@aquasmart.vn', phone: '0934567890', role: 'user', zoneId: 'zone-3', status: 'inactive', createdAt: '2023-06-10', lastLogin: '2024-07-10T10:00:00' },
  { id: 'user-5', name: 'Hoàng Văn Minh', email: 'minh.hoang@aquasmart.vn', phone: '0945678901', role: 'user', status: 'active', createdAt: '2024-01-05', lastLogin: '2024-07-18T14:00:00' },
];

/** Tạo dữ liệu lịch sử cảm biến giả lập cho 24 giờ qua */
export const generateSensorHistory = (baseValue: number, variance: number, hours: number = 24): SensorHistory[] => {
  const data: SensorHistory[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * variance * 2;
    const trend = Math.sin((i / hours) * Math.PI) * variance * 0.5;
    data.push({
      timestamp: time.toISOString(),
      value: Math.round((baseValue + noise + trend) * 10) / 10,
    });
  }
  return data;
};

/** Dữ liệu lịch sử cảm biến mẫu cho dashboard chart */
export const SENSOR_HISTORY = {
  'pond-a1-temp': generateSensorHistory(28.5, 1.5),
  'pond-a1-ph': generateSensorHistory(7.8, 0.3),
  'pond-a1-do': generateSensorHistory(5.2, 0.8),
  'pond-a2-temp': generateSensorHistory(31.2, 1.2),
  'pond-b1-temp': generateSensorHistory(29.0, 1.0),
  'pond-b1-ph': generateSensorHistory(7.4, 0.2),
};

export const MOCK_SCHEDULES: Schedule[] = [
  { id: 'sch-001', deviceId: 'dev-002', name: 'Sục khí ban đêm', type: 'time', startTime: '22:00', endTime: '06:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], action: 'on', isActive: true },
  { id: 'sch-002', deviceId: 'dev-004', name: 'Cho ăn buổi sáng', type: 'time', startTime: '06:30', endTime: '07:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], action: 'on', isActive: true },
  { id: 'sch-003', deviceId: 'dev-004', name: 'Cho ăn buổi chiều', type: 'time', startTime: '16:00', endTime: '16:30', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], action: 'on', isActive: true },
  { id: 'sch-004', deviceId: 'dev-002', name: 'Sục khí khi DO thấp', type: 'condition', conditionSensorType: 'do', conditionOperator: '<', conditionValue: 4.5, action: 'on', isActive: true },
];
