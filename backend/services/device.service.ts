import axios from "axios";
import { supabaseAdmin as supabase } from "../lib/supabase.client.ts"; // Nhớ chạy: npm install axios @supabase/supabase-js

// Cấu hình Adafruit IO
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const AIO_BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;
let aioFeedCreationDisabled = false;

const aioHeaders = () => ({
  headers: { "X-AIO-Key": AIO_KEY, "Content-Type": "application/json" },
});

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
  from?: string,
  to?: string,
) => {
  try {
    let query = supabase
      .from("actuator_logs")
      .select(
        "id, actuator_id, action, mode, status, user_id, timestamp, actuators(name, type)",
      )
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (actuatorId) {
      query = query.eq("actuator_id", actuatorId);
    }
    if (from) {
      query = query.gte("timestamp", from);
    }
    if (to) {
      query = query.lte("timestamp", to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Backend] Error fetching logs with join:", error);
      // Fallback: fetch logs without the join if join fails
      let fallbackQuery = supabase
        .from("actuator_logs")
        .select("id, actuator_id, action, mode, status, user_id, timestamp")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (actuatorId) {
        fallbackQuery = fallbackQuery.eq("actuator_id", actuatorId);
      }
      if (from) {
        fallbackQuery = fallbackQuery.gte("timestamp", from);
      }
      if (to) {
        fallbackQuery = fallbackQuery.lte("timestamp", to);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw new Error(fallbackError.message);
      return (fallbackData || []).map((item: any) => ({
        ...item,
        created_at: item.created_at || item.timestamp || null,
      }));
    }

    return (data || []).map((item: any) => ({
      ...item,
      created_at: item.created_at || item.timestamp || null,
    }));
  } catch (error: any) {
    console.error("[Backend] Error in getDeviceLogs:", error);
    throw new Error(error.message);
  }
};

/**
 * Tạo thiết bị mới
 */
export const createDevice = async (deviceData: {
  name: string;
  type: "pump" | "fan" | "light" | "servo";
  feed_key?: string | undefined;
  pond_id?: string;
  mode?: "auto" | "manual";
  description?: string;
}) => {
  // If feed_key not provided, auto-generate a unique feed key based on name
  let feedKey = (deviceData.feed_key || "").trim();
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);

  if (!feedKey) {
    const base = slugify(deviceData.name || "device");
    let candidate = base || "device";
    let attempts = 0;
    while (attempts < 10) {
      const suffix =
        attempts === 0 ? "" : `_${Math.random().toString(36).slice(2, 5)}`;
      candidate = `${base}${suffix}`.slice(0, 64);
      const { data: existing } = await supabase
        .from("actuators")
        .select("id")
        .eq("feed_key", candidate)
        .limit(1);
      if (!existing || (Array.isArray(existing) && existing.length === 0)) {
        feedKey = candidate;
        break;
      }
      attempts += 1;
    }
    if (!feedKey) {
      // fallback to random key
      feedKey = `feed_${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  // Attempt to create feed on Adafruit IO (best-effort).
  if (AIO_USERNAME && AIO_KEY && !aioFeedCreationDisabled) {
    try {
      // Adafruit IO: POST /api/v2/{username}/feeds
      // Body: provide a name and key; if key exists, API may return 409 — treat as OK
      await axios.post(
        `${AIO_BASE_URL}`,
        { name: deviceData.name || feedKey, key: feedKey },
        aioHeaders(),
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const responseData = err?.response?.data;
      const responseMessage =
        responseData?.error?.[0] || responseData?.message || err?.message || "";
      const isFeedLimitReached =
        status === 400 &&
        typeof responseMessage === "string" &&
        responseMessage.toLowerCase().includes("feed limit reached");

      if (status === 409) {
        // feed exists — fine
      } else if (isFeedLimitReached) {
        aioFeedCreationDisabled = true;
        console.warn(
          "[Backend] Adafruit IO feed limit reached; skipping remote feed creation for the rest of this process.",
        );
      } else {
        console.warn(
          "[Backend] Could not create feed on Adafruit IO:",
          status ?? err?.message ?? err,
        );
      }
    }
  } else {
    console.warn(
      "[Backend] AIO_USERNAME or AIO_KEY not configured — skipping feed creation",
    );
  }

  const { data, error } = await supabase
    .from("actuators")
    .insert([
      Object.assign(
        {
          name: deviceData.name,
          type: deviceData.type,
          feed_key: feedKey,
          pond_id: deviceData.pond_id || null,
          mode: deviceData.mode || "manual",
          status: "OFF",
        },
        // only attach description if explicitly provided to avoid schema cache issues
        deviceData.description !== undefined
          ? { description: deviceData.description }
          : {},
      ),
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Cập nhật thiết bị
 */
export const updateDevice = async (
  deviceId: string,
  deviceData: {
    name?: string;
    type?: "pump" | "fan" | "light" | "servo";
    feed_key?: string;
    pond_id?: string;
    mode?: "auto" | "manual";
    description?: string;
  },
) => {
  const { data, error } = await supabase
    .from("actuators")
    .update(deviceData)
    .eq("id", deviceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Xóa thiết bị
 */
export const deleteDevice = async (deviceId: string) => {
  // Fetch device to get feed_key
  const { data: device, error: fetchErr } = await supabase
    .from("actuators")
    .select("feed_key")
    .eq("id", deviceId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const feedKey = device?.feed_key;
  if (feedKey && AIO_USERNAME && AIO_KEY) {
    try {
      await axios.delete(`${AIO_BASE_URL}/${feedKey}`, aioHeaders());
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // feed not found on Adafruit — ignore
      } else {
        console.warn(
          "[Backend] Could not delete feed on Adafruit IO:",
          err?.message ?? err,
        );
      }
    }
  }

  const { error } = await supabase
    .from("actuators")
    .delete()
    .eq("id", deviceId);

  if (error) throw new Error(error.message);
  return { success: true, message: "Đã xóa thiết bị thành công" };
};

/**
 * Lấy thiết bị theo ID
 */
export const getDeviceById = async (deviceId: string) => {
  const { data, error } = await supabase
    .from("actuators")
    .select("*, ponds(zone_id)")
    .eq("id", deviceId)
    .single();

  if (error) throw new Error(error.message);

  // Flatten zone_id from joined ponds table for easier access
  return {
    ...data,
    zone_id: data?.ponds?.zone_id || null,
  };
};
