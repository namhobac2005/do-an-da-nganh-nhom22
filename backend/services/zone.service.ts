import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
);

// 1. Lấy danh sách Zone mà User được phân quyền quản lý
export const getZonesForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('zones')
    .select('id, name, location, status, user_zones!inner(user_id)')
    .eq('user_zones.user_id', userId);
  if (error) throw error;
  return data || []; // Luôn trả về mảng
};

// 2. Lấy Chi tiết Zone kèm Thống kê thực tế (Ponds, Sensors, Actuators)
export const getZoneDetail = async (zoneId: string, userId: string) => {
  const { data: zone, error } = await supabase
    .from('zones')
    .select(
      `
      *,
      user_zones!inner(user_id),
      ponds (
        id,
        sensors ( id, status ),
        actuators ( id, status )
      )
    `,
    )
    .eq('id', zoneId)
    .eq('user_zones.user_id', userId)
    .single();

  if (error || !zone)
    throw new Error('Vùng không tồn tại hoặc bạn không có quyền');

  // Tính toán các chỉ số thống kê từ quan hệ Database
  const stats = {
    totalPonds: zone.ponds?.length || 0,
    totalSensors: zone.ponds?.reduce(
      (acc: number, p: any) => acc + (p.sensors?.length || 0),
      0,
    ),
    totalActuators: zone.ponds?.reduce(
      (acc: number, p: any) => acc + (p.actuators?.length || 0),
      0,
    ),
    // Lấy danh sách username những người cùng quản lý
    managers: await supabase
      .from('user_zones')
      .select('users(username)')
      .eq('zone_id', zoneId)
      .then(
        (res) =>
          res.data?.map((m: any) => m.users?.username).filter(Boolean) || [],
      ),
  };

  return { ...zone, stats };
};
