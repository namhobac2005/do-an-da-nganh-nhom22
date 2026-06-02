/**
 * alert.service.ts
 * Business logic for UC15 (Threshold Management) & UC16 (Alert Logs).
 * All DB operations use supabaseAdmin (bypasses RLS).
 *
 * DB Tables:
 *   - public.threshold  → safety boundaries per metric/target
 *   - public.alert_logs → historical alert records
 *
 * KEY EXPORT: evaluateSensorData()
 *   Called by the Sensor module after each reading.
 *   Checks value against thresholds → inserts alert_log → emits ALERT_TRIGGERED event.
 */

import { supabaseAdmin } from '../lib/supabase.client.ts';
import { alertEmitter, type AlertTriggeredPayload } from '../lib/alert.events.ts';

// ===== TYPES =====

export type TargetType = 'pond' | 'farming_type';
export type Metric = 'light' | 'temperature' | 'water_level';

export interface Threshold {
  id: string;
  target_type: TargetType;
  target_id: string;
  metric: Metric;
  min_value: number;
  max_value: number;
  created_at: string;
}

export interface AlertLog {
  id: string;
  zone_id: string | null;
  metric: string;
  recorded_value: number;
  reason: string;
  status: 'unread' | 'resolved';
  created_at: string;
  pond_name?: string;
  zone_name?: string;
}

export interface UpsertThresholdDto {
  target_type: TargetType;
  target_id: string;
  metric: Metric;
  min_value: number;
  max_value: number;
}

// ===== THRESHOLD CRUD (UC15) =====

/**
 * List all thresholds. If pondIds is provided, filter to only those ponds.
 */
export const listThresholds = async (pondIds?: string[]): Promise<Threshold[]> => {
  let query = supabaseAdmin
    .from('thresholds')
    .select('*')
    .order('created_at', { ascending: false });

  // Pond-based security: filter by pond IDs for non-admin users
  if (pondIds && pondIds.length > 0) {
    // Show thresholds that target one of the user's ponds OR are farming_type-level
    query = query.or(
      `target_type.eq.farming_type,and(target_type.eq.pond,target_id.in.(${pondIds.join(',')}))`
    );
  }

  const { data, error } = await query;
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
        target_id: dto.target_id,
        metric: dto.metric,
        min_value: dto.min_value,
        max_value: dto.max_value,
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
  pondIds?: string[];
  page?: number;
  limit?: number;
}

export interface AlertLogsPage {
  data: AlertLog[];
  total: number;
  page: number;
  limit: number;
}

export const listAlertLogs = async (opts: ListAlertLogsOptions = {}): Promise<AlertLogsPage> => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 30;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('alert_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.zoneId) query = query.eq('zone_id', opts.zoneId);

  // Zone-based security: filter by pond IDs for non-admin users
  if (opts.pondIds && opts.pondIds.length > 0) {
    query = query.in('zone_id', opts.pondIds);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Enrich with pond + zone names (zone_id actually stores pond IDs)
  const pondIds = [...new Set((data ?? []).map((r: any) => r.zone_id).filter(Boolean))];
  let pondMap: Record<string, { pond_name: string; zone_name: string }> = {};
  if (pondIds.length > 0) {
    const { data: ponds } = await supabaseAdmin
      .from('ponds')
      .select('id, name, zones(name)')
      .in('id', pondIds);
    if (ponds) {
      for (const p of ponds as any[]) {
        pondMap[p.id] = {
          pond_name: p.name ?? '',
          zone_name: p.zones?.name ?? '',
        };
      }
    }
  }

  const enriched = (data ?? []).map((row: any) => ({
    ...row,
    pond_name: pondMap[row.zone_id]?.pond_name ?? '',
    zone_name: pondMap[row.zone_id]?.zone_name ?? '',
  }));

  return { data: enriched as AlertLog[], total: count ?? 0, page, limit };
};

export const countUnread = async (pondIds?: string[]): Promise<number> => {
  let query = supabaseAdmin
    .from('alert_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (pondIds && pondIds.length > 0) {
    query = query.in('zone_id', pondIds);
  }

  const { count, error } = await query;
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

/**
 * Called by the MQTT/Sensor module after each reading is persisted.
 * Checks the value against the pond-specific threshold,
 * inserts an alert_log if out of range,
 * and emits 'ALERT_TRIGGERED' for the Actuator module to react to.
 *
 * Hook point for Sensor module:
 *   import { evaluateSensorData } from '../services/alert.service.ts';
 *   await evaluateSensorData(pondId, null, 'temperature', 32.5);
 *
 * @param pondId        UUID of the pond the sensor belongs to
 * @param _farmingType  Deprecated — kept for API compat, not used
 * @param metric        Sensor type string (e.g. 'light', 'temperature', 'water_level')
 * @param value         The sensor reading
 */
export const evaluateSensorData = async (
  pondId: string,
  _farmingType: string | null,
  metric: string,
  value: number
): Promise<AlertLog | null> => {
  // 1. Find the pond-specific threshold for this metric
  const { data: threshold } = await supabaseAdmin
    .from('thresholds')
    .select('*')
    .eq('target_type', 'pond')
    .eq('target_id', pondId)
    .eq('metric', metric)
    .maybeSingle();

  if (!threshold) return null; // no threshold defined → nothing to check

  // 2. Determine if the value is out of range
  let reason: string | null = null;
  if (value < threshold.min_value) reason = `Dưới ngưỡng dưới (${threshold.min_value})`;
  if (value > threshold.max_value) reason = `Vượt ngưỡng trên (${threshold.max_value})`;

  if (!reason) return null; // within bounds → no alert

  // 2b. De-duplication: skip if last alert for same pond+metric has identical value
  const { data: lastAlert } = await supabaseAdmin
    .from('alert_logs')
    .select('recorded_value')
    .eq('zone_id', pondId)
    .eq('metric', metric)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAlert && lastAlert.recorded_value === value) return null;

  // 3. Insert alert_log
  const { data: alertRow, error } = await supabaseAdmin
    .from('alert_logs')
    .insert({
      zone_id: pondId,
      metric: metric,
      recorded_value: value,
      reason: reason,
      status: 'unread',
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
    alertId: alert.id,
    zoneId: pondId,
    metric: metric,
    recordedValue: value,
    minValue: threshold.min_value,
    maxValue: threshold.max_value,
    reason: reason,
    triggeredAt: alert.created_at,
  };
  alertEmitter.emit('ALERT_TRIGGERED', payload);

  return alert;
};
