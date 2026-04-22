import { createClient } from "@supabase/supabase-js";
import axios from "axios"; // Nhớ chạy: npm install axios @supabase/supabase-js

// Khởi tạo Supabase client (Ép kiểu string để TS không báo lỗi thiếu biến môi trường)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cấu hình Adafruit IO
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const AIO_BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

/**
 * Lấy danh sách thiết bị từ bảng actuators
 */
export const getAllDevices = async () => {
  // Đổi từ 'ACTUATOR' thành 'actuators'
  const { data, error } = await supabase.from("actuators").select("*");
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Điều khiển thiết bị: Gửi lệnh Adafruit -> Update DB -> Ghi Log
 */
export const controlDevice = async (
  deviceId: string,
  level: number,
  userId?: string,
) => {
  // 1. Lấy thông tin từ bảng 'actuators'
  const { data: device, error: fetchErr } = await supabase
    .from("actuators")
    .select("*")
    .eq("id", deviceId) // Cột là 'id' chứ không phải 'DeviceID'
    .single();

  if (fetchErr || !device)
    throw new Error("Không tìm thấy thiết bị: " + fetchErr?.message);

  const feedKey = device.type.toLowerCase();

  // 2. Gửi lệnh lên Adafruit IO (Giữ nguyên logic cũ)
  try {
    await axios.post(
      `${AIO_BASE_URL}/${feedKey}/data`,
      {
        value: level.toString(),
      },
      {
        headers: { "X-AIO-Key": AIO_KEY, "Content-Type": "application/json" },
      },
    );
  } catch (aioError: any) {
    throw new Error("Adafruit IO Offline");
  }

  // 3. Cập nhật bảng 'actuators'
  const newStatus = level > 0 ? "ON" : "OFF";
  const { error: updateErr } = await supabase
    .from("actuators")
    .update({ status: newStatus }) // Cột 'status' viết thường
    .eq("id", deviceId);

  if (updateErr) throw new Error(updateErr.message);

  // 4. Ghi log vào bảng 'actuator_logs' (Số nhiều)
  await supabase.from("actuator_logs").insert([
    {
      actuator_id: deviceId, // Tên cột: actuator_id
      action: level === 0 ? "OFF" : `ON (Level ${level})`,
      mode: device.mode,
      status: newStatus,
      user_id: userId || null,
    },
  ]);

  return { success: true, message: "Thành công" };
};

export const getDeviceLogs = async (
  limit: number = 50,
  actuatorId?: string,
) => {
  let query = supabase
    .from("actuator_logs")
    .select(
      "id, actuator_id, action, mode, status, user_id, created_at, actuators(name, type)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (actuatorId) {
    query = query.eq("actuator_id", actuatorId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};
