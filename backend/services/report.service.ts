import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ReportQuery {
  from?: string;
  to?: string;
  actuatorType?: string;
}

const withDateFilter = (
  query: any,
  field: string,
  from?: string,
  to?: string,
) => {
  let nextQuery = query;

  if (from) {
    nextQuery = nextQuery.gte(field, from);
  }

  if (to) {
    nextQuery = nextQuery.lte(field, to);
  }

  return nextQuery;
};

export const getDashboardReport = async ({
  from,
  to,
  actuatorType,
}: ReportQuery) => {
  const { data: actuators, error: actuatorError } = await supabase
    .from("actuators")
    .select("id, name, type, status, updated_at");

  if (actuatorError) throw new Error(actuatorError.message);

  let logQuery = supabase
    .from("actuator_logs")
    .select(
      "id, action, status, created_at, actuator_id, actuators(type, name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  logQuery = withDateFilter(logQuery, "created_at", from, to);

  const { data: logs, error: logError } = await logQuery;
  if (logError) throw new Error(logError.message);

  let sensorQuery = supabase
    .from("sensor_data")
    .select("value, timestamp, sensor_id, sensors(type)")
    .order("timestamp", { ascending: true })
    .limit(1000);

  sensorQuery = withDateFilter(sensorQuery, "timestamp", from, to);

  const { data: sensorData, error: sensorError } = await sensorQuery;
  if (sensorError) throw new Error(sensorError.message);

  const filteredActuators = (actuators || []).filter((item: any) =>
    actuatorType && actuatorType !== "all" ? item.type === actuatorType : true,
  );

  const filteredLogs = (logs || []).filter((item: any) => {
    if (!actuatorType || actuatorType === "all") return true;
    return item.actuators?.type === actuatorType;
  });

  const totalDevices = filteredActuators.length;
  const activeDevices = filteredActuators.filter(
    (item: any) => item.status !== "OFF",
  ).length;
  const offlineDevices = filteredActuators.filter(
    (item: any) => item.status === "OFF",
  ).length;

  const sensorSeriesMap: Record<string, Record<string, number[]>> = {
    temperature: {},
    "water-level": {},
    brightness: {},
  };

  for (const row of sensorData || []) {
    const type = row.sensors?.type;
    if (!type || !sensorSeriesMap[type]) continue;

    const dateKey = new Date(row.timestamp).toISOString().slice(0, 10);
    if (!sensorSeriesMap[type][dateKey]) {
      sensorSeriesMap[type][dateKey] = [];
    }
    sensorSeriesMap[type][dateKey].push(Number(row.value));
  }

  const allDays = Array.from(
    new Set(
      (sensorData || []).map((row: any) =>
        new Date(row.timestamp).toISOString().slice(0, 10),
      ),
    ),
  ).sort();

  const sensorTrend = allDays.map((day) => {
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((sum, num) => sum + num, 0) / arr.length : null;

    return {
      day,
      temperature: avg(sensorSeriesMap.temperature[day] || []),
      waterLevel: avg(sensorSeriesMap["water-level"][day] || []),
      brightness: avg(sensorSeriesMap.brightness[day] || []),
    };
  });

  const logsByAction = filteredLogs.reduce(
    (acc: Record<string, number>, item: any) => {
      const key = item.action || "UNKNOWN";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {},
  );

  const logDistribution = Object.entries(logsByAction).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    kpis: {
      totalDevices,
      activeDevices,
      offlineDevices,
      totalCommands: filteredLogs.length,
    },
    sensorTrend,
    logDistribution,
    latestLogs: filteredLogs.slice(0, 20),
  };
};
