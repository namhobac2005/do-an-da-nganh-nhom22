/**
 * alert.service.ts
 * Business logic for UC15 (Threshold Management) & UC16 (Alert Logs).
 * All DB operations use supabaseAdmin (bypasses RLS).
 *
 * KEY EXPORT: evaluateSensorData()
 *   Called by the Sensor module after each reading.
 *   Checks value against thresholds → inserts alert_log → emits ALERT_TRIGGERED event.
 */

import { supabaseAdmin } from '../lib/supabase.client.ts';
import { alertEmitter, type AlertTriggeredPayload } from '../lib/alert.events.ts';

// ===== TYPES =====

export type TargetType = 'zone' | 'farming_type';
export type Metric     = 'pH' | 'temperature' | 'DO';

export interface Threshold {
  id:          string;
  target_type: TargetType;
  target_id:   string;
  metric:      Metric;
  min_value:   number;
  max_value:   number;
  created_at:  string;
}

export interface AlertLog {
  id:             string;
  zone_id:        string | null;
  metric:         string;
  recorded_value: number;
  reason:         string;
  status:         'unread' | 'resolved';
  created_at:     string;
}

export interface UpsertThresholdDto {
  target_type: TargetType;
  target_id:   string;
  metric:      Metric;
  min_value:   number;
  max_value:   number;
}

// ===== THRESHOLD CRUD (UC15) =====

export const listThresholds = async (): Promise<Threshold[]> => {
  const { data, error } = await supabaseAdmin
    .from('thresholds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Threshold[];
};

export const getThresholdById = async (id: string): Promise<Threshold> => {
  const { data, error } = await supabaseAdmin
    .from('thresholds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Threshold;
};

/**
 * Upserts a threshold (insert or update by unique target_type+target_id+metric).
 * Validation: min_value < max_value is enforced HERE before hitting DB.
 */
export const upsertThreshold = async (dto: UpsertThresholdDto): Promise<Threshold> => {
  if (dto.min_value >= dto.max_value) {
    throw new Error('Ngưỡng dưới không được lớn hơn hoặc bằng ngưỡng trên.');
  }

  const { data, error } = await supabaseAdmin
    .from('thresholds')
    .upsert(
      {
        target_type: dto.target_type,
        target_id:   dto.target_id,
        metric:      dto.metric,
        min_value:   dto.min_value,
        max_value:   dto.max_value,
      },
      { onConflict: 'target_type,target_id,metric' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Threshold;
};

export const deleteThreshold = async (id: string): Promise<void> => {
  const { error } = await supabaseAdmin.from('thresholds').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ===== ALERT LOGS (UC16) =====

export interface ListAlertLogsOptions {
  status?: 'unread' | 'resolved';
  zoneId?: string;
  page?:   number;
  limit?:  number;
}

export interface AlertLogsPage {
  data:  AlertLog[];
  total: number;
  page:  number;
  limit: number;
}

export const listAlertLogs = async (opts: ListAlertLogsOptions = {}): Promise<AlertLogsPage> => {
  const page  = opts.page  ?? 1;
  const limit = opts.limit ?? 30;
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  let query = supabaseAdmin
    .from('alert_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.zoneId) query = query.eq('zone_id', opts.zoneId);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data: (data ?? []) as AlertLog[], total: count ?? 0, page, limit };
};

export const countUnread = async (): Promise<number> => {
  const { count, error } = await supabaseAdmin
    .from('alert_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const resolveAlert = async (id: string): Promise<AlertLog> => {
  const { data, error } = await supabaseAdmin
    .from('alert_logs')
    .update({ status: 'resolved' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AlertLog;
};

// ===== CORE ENGINE: evaluateSensorData() =====

/**
 * Called by the Sensor module after each reading is persisted.
 * Checks the value against all applicable thresholds (zone-specific first,
 * then farming_type-level), inserts an alert_log if out of range,
 * and emits 'ALERT_TRIGGERED' for the Actuator module to react to.
 *
 * Hook point for Sensor module:
 *   import { evaluateSensorData } from '../services/alert.service.ts';
 *   await evaluateSensorData(zoneId, farmingType, 'pH', 7.8);
 *
 * @param zoneId       UUID of the zone the sensor belongs to
 * @param farmingType  Farming type label (e.g. "Tôm thẻ chân trắng"), or null
 * @param metric       'pH' | 'temperature' | 'DO'
 * @param value        The sensor reading
 */
export const evaluateSensorData = async (
  zoneId:      string,
  farmingType: string | null,
  metric:      Metric,
  value:       number
): Promise<AlertLog | null> => {
  // 1. Find the most specific applicable threshold (zone > farming_type)
  let threshold: Threshold | null = null;

  // Try zone-specific first
  const { data: zoneThreshold } = await supabaseAdmin
    .from('thresholds')
    .select('*')
    .eq('target_type', 'zone')
    .eq('target_id', zoneId)
    .eq('metric', metric)
    .maybeSingle();

  if (zoneThreshold) {
    threshold = zoneThreshold as Threshold;
  } else if (farmingType) {
    // Fall back to farming_type level
    const { data: typeThreshold } = await supabaseAdmin
      .from('thresholds')
      .select('*')
      .eq('target_type', 'farming_type')
      .eq('target_id', farmingType)
      .eq('metric', metric)
      .maybeSingle();

    if (typeThreshold) threshold = typeThreshold as Threshold;
  }

  if (!threshold) return null; // no threshold defined → nothing to check

  // 2. Determine if the value is out of range
  let reason: string | null = null;
  if (value < threshold.min_value) reason = `Dưới ngưỡng dưới (${threshold.min_value})`;
  if (value > threshold.max_value) reason = `Vượt ngưỡng trên (${threshold.max_value})`;

  if (!reason) return null; // within bounds → no alert

  // 3. Insert alert_log
  const { data: alertRow, error } = await supabaseAdmin
    .from('alert_logs')
    .insert({
      zone_id:        zoneId,
      metric:         metric,
      recorded_value: value,
      reason:         reason,
      status:         'unread',
    })
    .select()
    .single();

  if (error) {
    console.error('[alert.service] Failed to insert alert_log:', error.message);
    return null;
  }

  const alert = alertRow as AlertLog;

  // 4. Emit event for Actuator module to subscribe to
  const payload: AlertTriggeredPayload = {
    alertId:       alert.id,
    zoneId:        zoneId,
    metric:        metric,
    recordedValue: value,
    minValue:      threshold.min_value,
    maxValue:      threshold.max_value,
    reason:        reason,
    triggeredAt:   alert.created_at,
  };
  alertEmitter.emit('ALERT_TRIGGERED', payload);

  return alert;
};
