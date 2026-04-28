// src/services/dashboard.service.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Lấy thông số KPI tổng quan (Số khu vực, số ao, thống kê thiết bị, cảnh báo)
export const getDashboardKPIs = async () => {
  // Promise.all để chạy các câu query song song cho nhanh
  const [
    { count: totalZones },
    { count: totalPonds },
    { data: sensors },
    { data: actuators },
    { count: criticalAlerts },
  ] = await Promise.all([
    supabase.from('zones').select('*', { count: 'exact', head: true }),
    supabase.from('ponds').select('*', { count: 'exact', head: true }),
    supabase.from('sensors').select('status'),
    supabase.from('actuators').select('status'),
    supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'critical'),
  ]);

  // Tổng hợp thiết bị (cảm biến + thiết bị điều khiển)
  const allDevices = [...(sensors || []), ...(actuators || [])];
  const totalDevices = allDevices.length;
  // Giả sử status lưu là 'active', 'offline', 'maintenance'
  const activeDevices = allDevices.filter((d) => d.status === 'active').length;
  const onlineDevices = allDevices.filter(
    (d) => d.status === 'active' || d.status === 'standby',
  ).length; // Ví dụ định nghĩa online

  return {
    totalZones: totalZones || 0,
    totalPonds: totalPonds || 0,
    totalDevices,
    onlineDevices,
    activeDevices,
    criticalAlerts: criticalAlerts || 0,
  };
};

// 2. Lấy danh sách cảnh báo gần đây (Recent Alerts)
export const getRecentAlerts = async (limit: number = 5) => {
  const { data, error } = await supabase
    .from('alerts')
    .select(
      `
      id,
      message,
      type,
      created_at,
      sensors (
        type,
        ponds ( name )
      )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Format lại dữ liệu cho Frontend dễ đọc
  return data.map((alert) => ({
    id: alert.id,
    message: alert.message,
    severity: alert.type, // 'critical', 'warning', 'info'
    timestamp: alert.created_at,
    sensorType: alert.sensors?.type || 'Unknown',
    pondName: alert.sensors?.ponds?.name || 'Unknown Pond',
    isRead: false, // Bạn có thể thêm cột is_read vào bảng alerts sau này
  }));
};

// 3. Thống kê tổng quan theo từng khu vực (Zone Overview)
export const getZonesOverview = async () => {
  // Lấy tất cả zones kèm theo ao và thiết bị bên trong
  const { data: zones, error } = await supabase.from('zones').select(`
      id,
      name,
      location,
      ponds (
        id,
        sensors ( status ),
        actuators ( status )
      )
    `);

  if (error) throw error;

  return zones.map((zone) => {
    let totalPonds = zone.ponds.length;
    let activeDevices = 0;

    zone.ponds.forEach((pond: any) => {
      const activeSensors =
        pond.sensors?.filter((s: any) => s.status === 'active').length || 0;
      const activeActuators =
        pond.actuators?.filter((a: any) => a.status === 'active').length || 0;
      activeDevices += activeSensors + activeActuators;
    });

    return {
      id: zone.id,
      name: zone.name,
      location: zone.location,
      status: 'active', // Giả định (bảng zones hiện tại chưa có cột status, bạn có thể thêm sau)
      totalPonds,
      activeDevices,
      activeAlerts: 0, // Có thể viết thêm query join để lấy số alerts của zone này
    };
  });
};
