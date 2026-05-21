import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const isAdmin = (role?: string) => role === "admin";

const getUserPondIds = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_ponds")
    .select("pond_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((row) => row.pond_id).filter(Boolean) as string[];
};

// Check if a user has access to a specific pond via user_ponds
const userHasPondAccess = async (userId: string, pondId: string) => {
  const pondIds = await getUserPondIds(userId);
  return pondIds.includes(pondId);
};

const ensurePondAccessById = async (userId: string, pondId: string) => {
  const hasAccess = await userHasPondAccess(userId, pondId);
  if (!hasAccess) {
    throw new Error("Bạn không có quyền truy cập ao nuôi này.");
  }
};

const ensurePondAccess = async (userId: string, pondId: string) => {
  await ensurePondAccessById(userId, pondId);
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

// Lấy danh sách Vùng nuôi (Zone) mà User được quản lý
export const getAllZones = async (userId: string) => {
  if (!userId) throw new Error("Yêu cầu userId để lấy danh sách vùng nuôi");

  // Step 1: Get user's assigned pond IDs
  const { data: userPonds, error: upErr } = await supabase
    .from("user_ponds")
    .select("pond_id")
    .eq("user_id", userId);

  if (upErr) throw upErr;
  
  const pondIds = (userPonds || []).map((row: any) => row.pond_id).filter(Boolean) as string[];
  if (pondIds.length === 0) return [];

  // Step 2: Get zone_ids from those ponds
  const { data: ponds, error: pErr } = await supabase
    .from("ponds")
    .select("zone_id")
    .in("id", pondIds);

  if (pErr) throw pErr;
  
  const zoneIds = [...new Set((ponds || []).map((p: any) => p.zone_id).filter(Boolean))];
  if (zoneIds.length === 0) return [];

  // Step 3: Fetch zones with those IDs
  const { data: zones, error: zErr } = await supabase
    .from("zones")
    .select("id, name")
    .in("id", zoneIds)
    .order("name", { ascending: true });

  if (zErr) throw zErr;

  // Format and return clean zone objects
  return (zones || []).map((z: any) => ({
    id: z.id,
    name: z.name,
  }));
};

export const getPondsByZoneForUser = async (
  zoneId: string,
  userId: string,
  role?: string,
) => {
  // Admin: get all ponds in zone
  if (role === "admin") {
    const { data, error } = await supabase
      .from("ponds")
      .select("id, name")
      .eq("zone_id", zoneId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // User: filter by user_ponds assignment
  const pondIds = await getUserPondIds(userId);
  if (pondIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ponds")
    .select("id, name")
    .eq("zone_id", zoneId)
    .in("id", pondIds)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
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
