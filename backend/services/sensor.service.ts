import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const isAdmin = (role?: string) => role === "admin";

const getUserZoneIds = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_zones")
    .select("zone_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((row) => row.zone_id).filter(Boolean) as string[];
};

const getPondZoneId = async (pondId: string) => {
  const { data, error } = await supabase
    .from("ponds")
    .select("zone_id")
    .eq("id", pondId)
    .single();

  if (error) throw error;
  return data?.zone_id || null;
};

const ensureZoneAccess = async (userId: string, zoneId: string) => {
  const zoneIds = await getUserZoneIds(userId);
  if (!zoneIds.includes(zoneId)) {
    throw new Error("Bạn không có quyền truy cập zone này.");
  }
};

const ensurePondAccess = async (userId: string, pondId: string) => {
  const zoneId = await getPondZoneId(pondId);
  if (!zoneId) {
    throw new Error("Không tìm thấy ao cần truy cập.");
  }
  await ensureZoneAccess(userId, zoneId);
};

// Lấy lịch sử dữ liệu của các sensor thuộc một Pond cụ thể
export const getSensorHistoryByPond = async (pondId: string, limit: number) => {
  if (!pondId || pondId === "all") return [];

  const { data, error } = await supabase
    .from("sensor_data")
    .select(
      `
      value,
      timestamp,
      sensors!inner ( type, pond_id )
    `,
    )
    .eq("sensors.pond_id", pondId) // Lọc đúng hồ
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Lấy giá trị mới nhất của các sensor thuộc một Pond cụ thể
export const getLatestSensorsByPond = async (pondId: string) => {
  if (!pondId || pondId === "all") return [];

  const { data, error } = await supabase
    .from("sensors")
    .select(
      `
      id, name, type, unit, status,
      sensor_data ( value, timestamp )
    `,
    )
    .eq("pond_id", pondId) // Lọc đúng hồ
    .order("timestamp", { foreignTable: "sensor_data", ascending: false })
    .limit(1, { foreignTable: "sensor_data" });

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
  if (!userId) throw new Error("Yêu cầu userId để lấy danh sách khu vực");

  const { data, error } = await supabase
    .from("zones")
    // Sử dụng !inner join để bắt buộc zone này phải có mặt trong bảng user_zones ứng với userId
    .select("id, name, user_zones!inner(user_id)")
    .eq("user_zones.user_id", userId);

  if (error) throw error;

  // Format lại dữ liệu bỏ đi cục user_zones dư thừa
  return data.map((zone) => ({
    id: zone.id,
    name: zone.name,
  }));
};

export const getPondsByZone = async (zoneId: string) => {
  const { data, error } = await supabase
    .from("ponds")
    .select("id, name")
    .eq("zone_id", zoneId);
  if (error) throw error;
  return data;
};

export const getPondsByZoneForUser = async (
  zoneId: string,
  userId: string,
  role?: string,
) => {
  if (!userId || isAdmin(role)) {
    return getPondsByZone(zoneId);
  }

  await ensureZoneAccess(userId, zoneId);
  return getPondsByZone(zoneId);
};

export const getLatestSensorsByPondForUser = async (
  pondId: string,
  userId: string,
  role?: string,
) => {
  if (!userId || isAdmin(role)) {
    return getLatestSensorsByPond(pondId);
  }

  await ensurePondAccess(userId, pondId);
  return getLatestSensorsByPond(pondId);
};

export const getSensorHistoryByPondForUser = async (
  pondId: string,
  limit: number,
  userId: string,
  role?: string,
) => {
  if (!userId || isAdmin(role)) {
    return getSensorHistoryByPond(pondId, limit);
  }

  await ensurePondAccess(userId, pondId);
  return getSensorHistoryByPond(pondId, limit);
};
