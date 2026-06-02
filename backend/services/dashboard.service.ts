import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper cũ: lấy danh sách pond_id theo userId (nếu userId có)
// Nếu userId = null -> trả về null (bỏ qua filter)
const getUserPondIds = async (
  userId: string | null,
): Promise<string[] | null> => {
  if (userId === null) return null; // null = lấy tất cả ponds
  const { data } = await supabase
    .from("user_ponds")
    .select("pond_id")
    .eq("user_id", userId);
  return data ? data.map((up) => up.pond_id) : [];
};

// 1. KPI tổng quan
export const getDashboardKPIs = async (userId: string | null) => {
  const pondIds = await getUserPondIds(userId);
  console.log("Ponds filter:", pondIds === null ? "ALL" : pondIds);

  // Nếu userId có nhưng không có pond nào -> trả về 0
  if (pondIds !== null && pondIds.length === 0) {
    return {
      totalZones: 0,
      totalPonds: 0,
      totalDevices: 0,
      onlineDevices: 0,
      activeDevices: 0,
      criticalAlerts: 0,
    };
  }

  // Xây dựng query sensors, actuators, alerts với điều kiện pond_id
  let sensorsQuery = supabase.from("sensors").select("status");
  let actuatorsQuery = supabase.from("actuators").select("status");
  let alertsQuery = supabase
    .from("alerts")
    .select("*, sensors!inner(pond_id)", { count: "exact", head: true })
    .eq("type", "critical");

  if (pondIds !== null) {
    sensorsQuery = sensorsQuery.in("pond_id", pondIds);
    actuatorsQuery = actuatorsQuery.in("pond_id", pondIds);
    alertsQuery = alertsQuery.in("sensors.pond_id", pondIds);
  }

  const [sensorsResult, actuatorsResult, alertsResult] = await Promise.all([
    sensorsQuery,
    actuatorsQuery,
    alertsQuery,
  ]);

  const sensors = sensorsResult.data || [];
  const actuators = actuatorsResult.data || [];
  const criticalAlerts = alertsResult.count || 0;

  const allDevices = [...sensors, ...actuators];
  const activeDevices = allDevices.filter((d) => d.status === "active").length;
  const onlineDevices = allDevices.filter(
    (d) => d.status === "active" || d.status === "standby",
  ).length;

  // Nếu userId === null, "totalZones" có thể hiểu là tổng số zones (distinct)
  let totalZones = 0;
  if (pondIds === null) {
    const { count } = await supabase
      .from("zones")
      .select("*", { count: "exact", head: true });
    totalZones = count || 0;
  } else {
    totalZones = pondIds.length; // nếu lọc theo user, zones = số ponds (hoặc bạn có thể tính distinct zone)
  }

  let totalPonds = 0;
  if (pondIds === null) {
    const { count } = await supabase
      .from("ponds")
      .select("*", { count: "exact", head: true });
    totalPonds = count || 0;
  } else {
    totalPonds = pondIds.length;
  }

  return {
    totalZones,
    totalPonds,
    totalDevices: allDevices.length,
    onlineDevices,
    activeDevices,
    criticalAlerts,
  };
};

// 2. Cảnh báo gần đây
export const getRecentAlerts = async (
  userId: string | null,
  limit: number = 5,
) => {
  const pondIds = await getUserPondIds(userId);
  if (pondIds !== null && pondIds.length === 0) return [];

  let query = supabase
    .from("alerts")
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
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pondIds !== null) {
    query = query.in("sensors.pond_id", pondIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((alert: any) => ({
    id: alert.id,
    message: alert.message,
    severity: alert.type,
    timestamp: alert.created_at,
    sensorType: alert.sensors?.type || "Unknown",
    pondName: "Ao nuôi",
    isRead: false,
  }));
};

// 3. Tổng quan khu vực (zones)
export const getZonesOverview = async (userId: string | null) => {
  const pondIds = await getUserPondIds(userId);
  if (pondIds !== null && pondIds.length === 0) return [];

  // Lấy danh sách ponds kèm zone, sensors, actuators
  let pondsQuery = supabase.from("ponds").select(
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
  );

  if (pondIds !== null) {
    pondsQuery = pondsQuery.in("id", pondIds);
  }

  const { data: pondsData, error } = await pondsQuery;
  if (error) throw error;

  const zoneMap: Record<string, any> = {};

  (pondsData || []).forEach((pond: any) => {
    const zone = pond.zones;
    if (!zone) return;

    const activeSensors =
      pond.sensors?.filter((s: any) => s.status === "active").length || 0;
    const activeActuators =
      pond.actuators?.filter((a: any) => a.status === "active").length || 0;
    const pondActiveDevices = activeSensors + activeActuators;

    if (!zoneMap[zone.id]) {
      zoneMap[zone.id] = {
        id: zone.id,
        name: zone.name,
        location: zone.location,
        totalPonds: 0,
        activeDevices: 0,
        activeAlerts: 0,
        ponds: [],
      };
    }

    zoneMap[zone.id].totalPonds += 1;
    zoneMap[zone.id].activeDevices += pondActiveDevices;
    zoneMap[zone.id].ponds.push({
      id: pond.id,
      name: pond.name,
      status: pond.status || "active",
    });
  });

  return Object.values(zoneMap);
};
