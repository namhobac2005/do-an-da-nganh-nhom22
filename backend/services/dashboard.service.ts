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
const getUserZoneIds = async (userId: string): Promise<string[]> => {
  // 1. Lấy tất cả các ao thuộc quyền quản lý của User
  const { data: userPonds } = await supabase
    .from('user_ponds')
    .select('pond_id')
    .eq('user_id', userId);

  if (!userPonds || userPonds.length === 0) return [];

  const pondIds = userPonds.map((up) => up.pond_id);

  // 2. Tra cứu bảng ponds để lấy ra các zone_id tương ứng của những ao đó
  const { data: pondsData } = await supabase
    .from('ponds')
    .select('zone_id')
    .in('id', pondIds);

  if (!pondsData) return [];

  // 3. Sử dụng Set để lọc bỏ các zone_id trùng lặp (vì nhiều ao có thể chung một Zone)
  const zoneIds = pondsData
    .map((p) => p.zone_id)
    .filter((zoneId): zoneId is string => !!zoneId); // Loại bỏ giá trị null/undefined nếu có

  return Array.from(new Set(zoneIds));
};

// 1. Lấy thông số KPI tổng quan
export const getDashboardKPIs = async (userId: string) => {
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

  // Lấy danh sách các ao của user kèm theo thông tin chi tiết về Zone của ao đó
  const { data: pondsData, error } = await supabase
    .from('ponds')
    .select(
      `
      id,
      name,
      status,
      zones!inner (
        id,
        name,
        location
      ),
      sensors ( status ),
      actuators ( status )
    `,
    )
    .in('id', pondIds);

  if (error) throw error;

  // Tiến hành gộp dữ liệu các Ao (Ponds) vào nhóm Khu Vực (Zones) tương ứng
  const zoneMap: Record<string, any> = {};

  (pondsData || []).forEach((pond: any) => {
    const zone = pond.zones;
    if (!zone) return;

    // Tính toán số thiết bị đang chạy của ao này
    const activeSensors =
      pond.sensors?.filter((s: any) => s.status === 'active').length || 0;
    const activeActuators =
      pond.actuators?.filter((a: any) => a.status === 'active').length || 0;
    const pondActiveDevices = activeSensors + activeActuators;

    // Nếu nhóm Zone này chưa có trong Map thì khởi tạo khung cấu trúc mới
    if (!zoneMap[zone.id]) {
      zoneMap[zone.id] = {
        id: zone.id,
        name: zone.name,
        location: zone.location,
        totalPonds: 0,
        activeDevices: 0,
        activeAlerts: 0,
        ponds: [], // Mảng chứa danh sách ao chi tiết phục vụ hiển thị lồng
      };
    }

    // Tích lũy dữ liệu vào Vùng (Zone) lớn
    zoneMap[zone.id].totalPonds += 1;
    zoneMap[zone.id].activeDevices += pondActiveDevices;

    // Đẩy thông tin ao hiện tại vào mảng ponds của Zone
    zoneMap[zone.id].ponds.push({
      id: pond.id,
      name: pond.name,
      status: pond.status || 'active',
    });
  });

  // Chuyển đối tượng Map thành mảng để giao diện Frontend map() xử lý
  return Object.values(zoneMap);
};
