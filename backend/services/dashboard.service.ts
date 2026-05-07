import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm helper (Dùng chung): Lấy danh sách ID các Zone mà User quản lý
const getUserZoneIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('user_zones')
    .select('zone_id')
    .eq('user_id', userId);
  return data ? data.map((uz) => uz.zone_id) : [];
};

// 1. Lấy thông số KPI tổng quan
export const getDashboardKPIs = async (userId: string) => {
  console.log('=== DEBUG DASHBOARD ===');
  console.log('1. Token đang đăng nhập của User ID:', userId);

  const zoneIds = await getUserZoneIds(userId);
  console.log('2. Các Zone tìm thấy cho User này:', zoneIds);

  // Nếu user chưa được phân công khu vực nào, trả về 0 hết
  if (zoneIds.length === 0) {
    return {
      totalZones: 0,
      totalPonds: 0,
      totalDevices: 0,
      onlineDevices: 0,
      activeDevices: 0,
      criticalAlerts: 0,
    };
  }

  // 1. Đếm Pond thuộc các Zone đó
  const { data: pondsData } = await supabase
    .from('ponds')
    .select('id')
    .in('zone_id', zoneIds);
  const pondIds = pondsData?.map((p) => p.id) || [];

  if (pondIds.length === 0) {
    return {
      totalZones: zoneIds.length,
      totalPonds: 0,
      totalDevices: 0,
      onlineDevices: 0,
      activeDevices: 0,
      criticalAlerts: 0,
    };
  }

  // 2. Chạy Query song song lấy Thiết bị và Cảnh báo thuộc các Pond đó
  const [{ data: sensors }, { data: actuators }, { count: criticalAlerts }] =
    await Promise.all([
      supabase.from('sensors').select('status').in('pond_id', pondIds),
      supabase.from('actuators').select('status').in('pond_id', pondIds),
      supabase
        .from('alerts')
        .select('*, sensors!inner(pond_id)', { count: 'exact', head: true })
        .eq('type', 'critical')
        .in('sensors.pond_id', pondIds),
    ]);

  const allDevices = [...(sensors || []), ...(actuators || [])];
  const activeDevices = allDevices.filter((d) => d.status === 'active').length;
  const onlineDevices = allDevices.filter(
    (d) => d.status === 'active' || d.status === 'standby',
  ).length;

  return {
    totalZones: zoneIds.length,
    totalPonds: pondIds.length,
    totalDevices: allDevices.length,
    onlineDevices,
    activeDevices,
    criticalAlerts: criticalAlerts || 0,
  };
};

// 2. Lấy danh sách cảnh báo gần đây
export const getRecentAlerts = async (userId: string, limit: number = 5) => {
  const zoneIds = await getUserZoneIds(userId);
  if (zoneIds.length === 0) return [];

  const { data, error } = await supabase
    .from('alerts')
    .select(
      `
      id,
      message,
      type,
      created_at,
      sensors!inner (
        type,
        ponds!inner ( name, zone_id )
      )
    `,
    )
    .in('sensors.ponds.zone_id', zoneIds) // CHỈ lấy cảnh báo của ao thuộc zone user quản lý
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((alert: any) => ({
    id: alert.id,
    message: alert.message,
    severity: alert.type,
    timestamp: alert.created_at,
    sensorType: alert.sensors?.type || 'Unknown',
    pondName: alert.sensors?.ponds?.name || 'Unknown Pond',
    isRead: false,
  }));
};

// 3. Thống kê tổng quan theo từng khu vực
export const getZonesOverview = async (userId: string) => {
  const zoneIds = await getUserZoneIds(userId);
  if (zoneIds.length === 0) return [];

  const { data: zones, error } = await supabase
    .from('zones')
    .select(
      `
      id,
      name,
      location,
      status,
      ponds (
        id,
        sensors ( status ),
        actuators ( status )
      )
    `,
    )
    .in('id', zoneIds); // Chỉ lấy những Zone nằm trong danh sách của User

  if (error) throw error;

  return zones.map((zone: any) => {
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
      status: zone.status || 'active',
      totalPonds: zone.ponds.length,
      activeDevices,
      activeAlerts: 0,
    };
  });
};
