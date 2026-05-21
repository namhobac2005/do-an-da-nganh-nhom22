import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm helper (Dùng chung): Lấy danh sách ID các Pond mà User quản lý
const getUserPondIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('user_ponds')
    .select('pond_id')
    .eq('user_id', userId);
  return data ? data.map((up) => up.pond_id) : [];
};

// 1. Lấy thông số KPI tổng quan
export const getDashboardKPIs = async (userId: string) => {
  console.log('=== DEBUG DASHBOARD ===');
  console.log('1. Token đang đăng nhập của User ID:', userId);

  const pondIds = await getUserPondIds(userId);
  console.log('2. Các Pond tìm thấy cho User này:', pondIds);

  // Nếu user chưa được phân công ao nào, trả về 0 hết
  if (pondIds.length === 0) {
    return {
      totalZones: 0,
      totalPonds: 0,
      totalDevices: 0,
      onlineDevices: 0,
      activeDevices: 0,
      criticalAlerts: 0,
    };
  }

  // Chạy Query song song lấy Thiết bị và Cảnh báo thuộc các Pond đó
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
    totalZones: pondIds.length,
    totalPonds: pondIds.length,
    totalDevices: allDevices.length,
    onlineDevices,
    activeDevices,
    criticalAlerts: criticalAlerts || 0,
  };
};

// 2. Lấy danh sách cảnh báo gần đây
export const getRecentAlerts = async (userId: string, limit: number = 5) => {
  const pondIds = await getUserPondIds(userId);
  if (pondIds.length === 0) return [];

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
        pond_id
      )
    `,
    )
    .in('sensors.pond_id', pondIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((alert: any) => ({
    id: alert.id,
    message: alert.message,
    severity: alert.type,
    timestamp: alert.created_at,
    sensorType: alert.sensors?.type || 'Unknown',
    pondName: 'Ao nuôi',
    isRead: false,
  }));
};

// 3. Thống kê tổng quan theo từng ao nuôi
export const getZonesOverview = async (userId: string) => {
  const pondIds = await getUserPondIds(userId);
  if (pondIds.length === 0) return [];

  const { data: ponds, error } = await supabase
    .from('ponds')
    .select(
      `
      id,
      name,
      location,
      status,
      sensors ( status ),
      actuators ( status )
    `,
    )
    .in('id', pondIds);

  if (error) throw error;

  return (ponds || []).map((pond: any) => {
    const activeSensors =
      pond.sensors?.filter((s: any) => s.status === 'active').length || 0;
    const activeActuators =
      pond.actuators?.filter((a: any) => a.status === 'active').length || 0;

    return {
      id: pond.id,
      name: pond.name,
      location: pond.location,
      status: pond.status || 'active',
      totalPonds: 1,
      activeDevices: activeSensors + activeActuators,
      activeAlerts: 0,
    };
  });
};
