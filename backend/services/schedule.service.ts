import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import * as deviceService from "./device.service.js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map lưu tác vụ cron toàn cục: schedule_id -> tác vụ
const cronTasks = new Map();

/**
 * Tạo lịch trình và khởi động tác vụ cron
 */
export const createSchedule = async (
  device_id: string,
  level: number,
  cron_expr: string,
  action: string,
) => {
  const { data, error } = await supabase
    .from("schedules")
    .insert([{ device_id, level, cron_expr, action, active: true }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Không thể tạo lịch trình");

  // Khởi động tác vụ cron
  const task = cron.schedule(cron_expr, () => {
    console.log(
      `Đang chạy tác vụ theo lịch cho thiết bị ${device_id} lúc ${new Date().toISOString()}`,
    );
    deviceService.controlDevice(device_id, level);
  });

  cronTasks.set(data.id, task);

  return data;
};

/**
 * Lấy tất cả lịch trình
 */
export const getSchedules = async () => {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Cập nhật lịch trình (khởi động lại cron nếu thay đổi)
 */
export const updateSchedule = async (id: string, updates: any) => {
  const { data: oldData } = await supabase
    .from("schedules")
    .select()
    .eq("id", id)
    .single();
  const { data, error } = await supabase
    .from("schedules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Dừng tác vụ cũ nếu tồn tại
  const oldTask = cronTasks.get(id);
  if (oldTask) oldTask.stop();

  // Khởi động lại nếu đang hoạt động
  if (data.active && data.cron_expr) {
    const task = cron.schedule(data.cron_expr, () => {
      console.log(
        `Đang chạy tác vụ theo lịch cho thiết bị ${data.device_id} lúc ${new Date().toISOString()}`,
      );
      deviceService.controlDevice(data.device_id, data.level);
    });
    cronTasks.set(id, task);
  }

  return data;
};

/**
 * Xóa lịch trình
 */
export const deleteSchedule = async (id: string) => {
  const task = cronTasks.get(id);
  if (task) {
    task.stop();
    cronTasks.delete(id);
  }

  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return { success: true };
};

/**
 * Tải các lịch trình hiện có khi khởi động máy chủ
 */
export const loadSchedules = async () => {
  const schedules = await getSchedules();
  schedules.forEach((sch) => {
    if (sch.active && sch.cron_expr) {
      const task = cron.schedule(sch.cron_expr, () => {
        console.log(`Tác vụ khởi động máy chủ cho thiết bị ${sch.device_id}`);
        deviceService.controlDevice(sch.device_id, sch.level);
      });
      cronTasks.set(sch.id, task);
    }
  });
  console.log(`Đã tải ${schedules.length} lịch trình`);
};

export const getCronStatus = () => cronTasks.size;
