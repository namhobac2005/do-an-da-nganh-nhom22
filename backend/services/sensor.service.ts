import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lấy lịch sử dữ liệu của các sensor thuộc một Pond cụ thể
export const getSensorHistoryByPond = async (pondId: string, limit: number) => {
  if (!pondId || pondId === 'all') return [];

  const { data, error } = await supabase
    .from('sensor_data')
    .select(
      `
      value,
      timestamp,
      sensors!inner ( type, pond_id )
    `,
    )
    .eq('sensors.pond_id', pondId) // Lọc đúng hồ
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Lấy giá trị mới nhất của các sensor thuộc một Pond cụ thể
export const getLatestSensorsByPond = async (pondId: string) => {
  if (!pondId || pondId === 'all') return [];

  const { data, error } = await supabase
    .from('sensors')
    .select(
      `
      id, name, type, unit, status,
      sensor_data ( value, timestamp )
    `,
    )
    .eq('pond_id', pondId) // Lọc đúng hồ
    .order('timestamp', { foreignTable: 'sensor_data', ascending: false })
    .limit(1, { foreignTable: 'sensor_data' });

  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    unit: s.unit,
    status: s.status,
    value: s.sensor_data?.[0]?.value ?? 0,
    updated_at: s.sensor_data?.[0]?.timestamp ?? null,
  }));
};

export const getAllZones = async (userId: string) => {
  if (!userId) throw new Error('Yêu cầu userId để lấy danh sách khu vực');

  const { data, error } = await supabase
    .from('zones')
    // Sử dụng !inner join để bắt buộc zone này phải có mặt trong bảng user_zones ứng với userId
    .select('id, name, user_zones!inner(user_id)')
    .eq('user_zones.user_id', userId);

  if (error) throw error;

  // Format lại dữ liệu bỏ đi cục user_zones dư thừa
  return data.map((zone) => ({
    id: zone.id,
    name: zone.name,
  }));
};

export const getPondsByZone = async (zoneId: string) => {
  const { data, error } = await supabase
    .from('ponds')
    .select('id, name')
    .eq('zone_id', zoneId);
  if (error) throw error;
  return data;
};
