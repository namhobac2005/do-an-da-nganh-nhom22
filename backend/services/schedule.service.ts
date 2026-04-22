import { createClient } from "@supabase/supabase-js";
import * as deviceService from "./device.service.ts";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DeviceSchedulePayload {
  actuator_id: string;
  target_level: number;
  schedule_at: string;
  note?: string;
}

const SCHEDULE_TABLE = "device_schedules";
let scheduleTableAvailable = true;

const isMissingTableError = (message?: string) =>
  !!message && message.includes(`table 'public.${SCHEDULE_TABLE}'`);

export const getSchedules = async (actuatorId?: string) => {
  let query = supabase
    .from(SCHEDULE_TABLE)
    .select(
      "id, actuator_id, target_level, schedule_at, status, note, created_at, updated_at, actuators(name, type)",
    )
    .order("schedule_at", { ascending: true });

  if (actuatorId) {
    query = query.eq("actuator_id", actuatorId);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error.message)) {
      scheduleTableAvailable = false;
      return [];
    }
    throw new Error(error.message);
  }
  return data;
};

export const createSchedule = async (payload: DeviceSchedulePayload) => {
  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .insert([
      {
        actuator_id: payload.actuator_id,
        target_level: payload.target_level,
        schedule_at: payload.schedule_at,
        status: "pending",
        note: payload.note || null,
      },
    ])
    .select(
      "id, actuator_id, target_level, schedule_at, status, note, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      scheduleTableAvailable = false;
      throw new Error(
        "Thiếu bảng device_schedules. Hãy chạy SQL migration trước.",
      );
    }
    throw new Error(error.message);
  }
  return data;
};

export const cancelSchedule = async (scheduleId: string) => {
  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .update({ status: "cancelled" })
    .eq("id", scheduleId)
    .select("id, status")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      scheduleTableAvailable = false;
      throw new Error(
        "Thiếu bảng device_schedules. Hãy chạy SQL migration trước.",
      );
    }
    throw new Error(error.message);
  }
  return data;
};

export const runDueSchedules = async () => {
  if (!scheduleTableAvailable) {
    return { processed: 0 };
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, actuator_id, target_level")
    .eq("status", "pending")
    .lte("schedule_at", nowIso)
    .order("schedule_at", { ascending: true })
    .limit(20);

  if (error) {
    if (isMissingTableError(error.message)) {
      scheduleTableAvailable = false;
      return { processed: 0 };
    }
    throw new Error(error.message);
  }
  if (!data || data.length === 0) return { processed: 0 };

  let processed = 0;

  for (const schedule of data) {
    try {
      await deviceService.controlDevice(
        schedule.actuator_id,
        schedule.target_level,
        undefined,
      );

      await supabase
        .from(SCHEDULE_TABLE)
        .update({ status: "done", updated_at: new Date().toISOString() })
        .eq("id", schedule.id);

      processed += 1;
    } catch (_err) {
      await supabase
        .from(SCHEDULE_TABLE)
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", schedule.id);
    }
  }

  return { processed };
};
