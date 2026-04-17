import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lấy nhật ký thiết bị với bộ lọc
 */
export const getDeviceLogs = async (
  deviceId: string,
  from?: string,
  to?: string,
  limit = 50,
) => {
  let query = supabase
    .from("actuator_logs")
    .select("*")
    .eq("actuator_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Lấy báo cáo tổng hợp của thiết bị (số lượng theo trạng thái, hành động)
 * Giả sử RPC đã được tạo trong Supabase cho các tổng hợp
 */
export const getDeviceReport = async (
  deviceId: string,
  period: "day" | "week" | "month" = "day",
) => {
  const now = new Date();
  let fromDate: Date;

  switch (period) {
    case "week":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const { data, error } = await supabase.rpc("device_report", {
    device_id_param: deviceId,
    from_date_param: fromDate.toISOString(),
  });

  if (error) throw new Error(error.message);
  return data || { on_count: 0, off_count: 0, total_actions: 0 };
};

/**
 * Lấy báo cáo cảm biến (trung bình / nhỏ nhất / lớn nhất cho mỗi cảm biến)
 * Logic tương tự, tổng hợp dữ liệu cảm biến
 */
export const getSensorReport = async (
  period: "day" | "week" | "month" = "day",
) => {
  const now = new Date();
  let fromDate: Date;
  switch (period) {
    case "week":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const { data, error } = await supabase
    .from("sensor_data")
    .select(
      `
      sensors!inner(type),
      value,
      timestamp
    `,
    )
    .gte("timestamp", fromDate.toISOString())
    .order("timestamp");

  if (error) throw error;
  // Tổng hợp phía client hoặc RPC máy chủ
  return data;
};

/**
 * Tất cả nhật ký gần đây
 */
export const getAllLogs = async (limit = 100) => {
  const { data, error } = await supabase
    .from("actuator_logs")
    .select(
      `
      *,
      actuators(type, name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
